"""Run with:  python tests/test_tracer.py     (needs numpy for the numpy examples)

Checks that the tracer works and that every built-in example runs without errors.
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "py"))
import tracer  # noqa: E402


def run(code, n=3000):
    return json.loads(tracer.run(code, n))


def test_basic_line_tracking():
    r = run("a = 1\nb = a + 1\n")
    assert [s["line"] for s in r["steps"]] == [1, 2]
    assert r["pool"][r["steps"][1]["vars"]["b"]]["n"] == 2
    assert "a" not in r["steps"][0]["changed"] or r["steps"][0]["changed"]["a"] == -1


def test_function_stack_and_return():
    r = run("def f(n):\n    return n * 2\nx = f(4)\n")
    assert any(len(s["stack"]) == 2 for s in r["steps"])
    assert any("ret" in s for s in r["steps"])


def test_error_reports_line():
    r = run("x = 1\ny = 1 / 0\n")
    assert r["error"]["type"] == "ZeroDivisionError" and r["error"]["line"] == 2


def test_syntax_error():
    r = run("def (:\n")
    assert r["error"]["type"] == "SyntaxError"


def test_step_limit():
    r = run("while True:\n    pass\n", 50)
    assert r["truncated"] and len(r["steps"]) == 50


def test_stdout_captured():
    r = run("print('hi')\n")
    assert r["out"] == "hi\n"


def test_examples_run():
    js = os.path.join(ROOT, "js", "examples.js")
    out = subprocess.run(
        ["node", "-e", "global.window={};require(%r);console.log(JSON.stringify(window.EXAMPLES))" % js],
        capture_output=True, text=True, check=True).stdout
    for ex in json.loads(out):
        if "numpy" in ex["code"]:
            try:
                import numpy  # noqa: F401
            except ImportError:
                print("skip (no numpy):", ex["id"])
                continue
        r = run(ex["code"])
        assert r["error"] is None, (ex["id"], r["error"])
        assert not r["truncated"], ex["id"]
        for ln in ex["code"].split("\n"):  # every annotation must have both languages
            if "#:" in ln:
                assert "||" in ln, (ex["id"], ln)


def test_embedded_tracer_in_sync():
    src = open(os.path.join(ROOT, "py", "tracer.py"), encoding="utf-8").read()
    emb = open(os.path.join(ROOT, "js", "tracer_src.js"), encoding="utf-8").read()
    assert json.dumps(src) in emb, "run: python tools/embed_tracer.py"


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok ", name)
