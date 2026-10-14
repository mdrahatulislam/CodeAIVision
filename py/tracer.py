"""Line-by-line tracer used by the DL Code Visualizer.

It runs in the browser (Pyodide) *and* in normal CPython, so it can be unit-tested.
`run(code, max_steps)` executes user code, records the state after every executed line
and returns everything as one JSON string.

Step layout (all values are indexes into `pool`, so repeated values cost nothing):
  line     1-based source line that was executed
  func     name of the function that line belongs to ("<module>" at top level)
  stack    names of all active user frames, outermost first
  vars     {name: pool index}  -> variables of that frame AFTER the line ran
  changed  {name: pool index of OLD value, or -1 if the variable is new}
  out      length of stdout after the line ran
  ret      pool index of the return value (only on the last line of a function)
"""
import io
import json
import math
import sys
import types

USER_FILE = "<user>"
MAX_ELEMS = 256      # arrays bigger than this are summarised, not drawn
MAX_REPR = 140
MAX_OUT = 30000


class _StepLimit(BaseException):
    pass


def _short(s, n=MAX_REPR):
    s = str(s)
    return s if len(s) <= n else s[: n - 1] + "…"


def _clean(x):
    """Make nested lists JSON safe (nan/inf -> None, tuples -> lists)."""
    if isinstance(x, (list, tuple)):
        return [_clean(e) for e in x]
    if isinstance(x, float) and not math.isfinite(x):
        return None
    return x


def _grid_shape(v, depth=0):
    """Shape of a rectangular nested list of numbers (max 3 dims) or None."""
    if isinstance(v, (list, tuple)):
        if not v or depth >= 3:
            return None
        subs = [_grid_shape(e, depth + 1) for e in v]
        if any(s is None for s in subs) or any(s != subs[0] for s in subs):
            return None
        return (len(v),) + subs[0]
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        return ()
    return None


def _prod(shape):
    p = 1
    for s in shape:
        p *= s
    return p


def describe(v):
    ty = type(v).__name__
    try:
        np = sys.modules.get("numpy")
        if np is not None and isinstance(v, np.generic):
            item = v.item()
            d = {"ty": ty, "r": _short(repr(item))}
            if isinstance(item, (int, float)) and not isinstance(item, bool) and math.isfinite(item):
                d["n"] = item
            return d
        if np is not None and isinstance(v, np.ndarray):
            d = {"ty": "ndarray", "dt": str(v.dtype), "shape": list(v.shape), "r": _short(repr(v))}
            if v.dtype.kind in "iufb" and v.size <= MAX_ELEMS and v.ndim <= 3:
                d["d"] = _clean(v.tolist())
            elif v.size > MAX_ELEMS:
                d["tr"] = True
            return d
        if isinstance(v, (list, tuple)):
            d = {"ty": ty, "len": len(v), "r": _short(repr(v))}
            if len(v) <= MAX_ELEMS:
                shp = _grid_shape(v)
                if shp and _prod(shp) <= MAX_ELEMS:
                    d["shape"] = list(shp)
                    d["d"] = _clean(v)
            return d
        d = {"ty": ty, "r": _short(repr(v))}
        if isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v):
            d["n"] = v
        if isinstance(v, (dict, set, frozenset, str)):
            d["len"] = len(v)
        return d
    except Exception:
        return {"ty": ty, "r": "<" + ty + ">"}


class Tracer:
    def __init__(self, max_steps):
        self.max = max_steps
        self.steps = []
        self.pool = []
        self.pool_idx = {}
        self.frames = {}
        self.out = io.StringIO()
        self.truncated = False

    def intern(self, desc):
        key = json.dumps(desc, sort_keys=True, separators=(",", ":"))
        i = self.pool_idx.get(key)
        if i is None:
            i = len(self.pool)
            self.pool.append(desc)
            self.pool_idx[key] = i
        return i

    def snapshot(self, frame):
        snap = {}
        for k, v in list(frame.f_locals.items()):
            if k.startswith("__") or k.startswith("."):
                continue
            if isinstance(v, (types.ModuleType, types.FunctionType, types.BuiltinFunctionType, type)):
                continue
            snap[k] = self.intern(describe(v))
        return snap

    def stack(self, frame):
        names = []
        f = frame
        while f is not None:
            if f.f_code.co_filename == USER_FILE:
                names.append(f.f_code.co_name)
            f = f.f_back
        return names[::-1]

    def patch(self, rec, after):
        i = rec["step"]
        if i is None:
            return
        before = rec["snap"] or {}
        st = self.steps[i]
        st["vars"] = after
        st["changed"] = {k: before.get(k, -1) for k, idx in after.items() if before.get(k, -1) != idx}
        st["out"] = self.out.tell()

    def trace(self, frame, event, arg):
        if frame.f_code.co_filename != USER_FILE:
            return None
        self.frames[id(frame)] = {"step": None, "snap": None}
        return self.local

    def local(self, frame, event, arg):
        rec = self.frames.setdefault(id(frame), {"step": None, "snap": None})
        if event == "line":
            snap = self.snapshot(frame)
            self.patch(rec, snap)
            if len(self.steps) >= self.max:
                self.truncated = True
                raise _StepLimit()
            self.steps.append({"line": frame.f_lineno, "func": frame.f_code.co_name,
                               "stack": self.stack(frame), "vars": None, "changed": None, "out": 0})
            rec["step"] = len(self.steps) - 1
            rec["snap"] = snap
        elif event == "return":
            snap = self.snapshot(frame)
            self.patch(rec, snap)
            if rec["step"] is not None and frame.f_code.co_name != "<module>":
                self.steps[rec["step"]]["ret"] = self.intern(describe(arg))
            self.frames.pop(id(frame), None)
        return self.local

    def finish(self):
        for rec in self.frames.values():          # frames cut short by the step limit / errors
            i = rec["step"]
            if i is not None and self.steps[i]["vars"] is None:
                self.steps[i]["vars"] = rec["snap"] or {}
                self.steps[i]["changed"] = {}
                self.steps[i]["out"] = self.out.tell()
        for st in self.steps:
            if st["vars"] is None:
                st["vars"], st["changed"] = {}, {}


def run(code, max_steps=3000):
    t = Tracer(max_steps)
    result = {"error": None, "truncated": False}
    try:
        compiled = compile(code, USER_FILE, "exec")
    except SyntaxError as e:
        result.update(steps=[], pool=[], out="", error={"type": "SyntaxError", "msg": e.msg, "line": e.lineno})
        return json.dumps(result)

    g = {"__name__": "__main__"}
    old_out = sys.stdout
    sys.stdout = t.out
    sys.settrace(t.trace)
    try:
        exec(compiled, g)
    except _StepLimit:
        pass
    except BaseException as e:
        line, tb = None, e.__traceback__
        while tb is not None:
            if tb.tb_frame.f_code.co_filename == USER_FILE:
                line = tb.tb_lineno
            tb = tb.tb_next
        result["error"] = {"type": type(e).__name__, "msg": str(e), "line": line}
    finally:
        sys.settrace(None)
        sys.stdout = old_out
    t.finish()
    result.update(steps=t.steps, pool=t.pool, out=t.out.getvalue()[:MAX_OUT], truncated=t.truncated)
    return json.dumps(result)
