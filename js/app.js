/* DL Code Visualizer — front end.
 * Python runs in the browser through Pyodide; py/tracer.py records every executed line.
 */
(() => {
"use strict";

/* ---------- tiny helpers ---------- */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const md = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
};

/* ---------- translations ---------- */
const T = {
  bn: {
    tagline: "লাইন বাই লাইন", run: "▶ চালাও ও দেখাও", edit: "✎ এডিট", blank: "＋ ফাঁকা", share: "🔗 লিংক",
    explainTitle: "এই ধাপে কী ঘটছে", varsTitle: "ভেরিয়েবল (লাইন চলার পরের অবস্থা)", chartTitle: "চার্ট (loss ইত্যাদি)", outTitle: "আউটপুট (print)",
    footer: "ওপেন সোর্স — কোড বদলে নিজের মতো করে চালান",
    loadingPy: "Python লোড হচ্ছে (প্রথমবার একটু সময় লাগে)", loadingPkg: "লাইব্রেরি লোড হচ্ছে", ready: "প্রস্তুত", running: "চলছে",
    steps: "ধাপ", noRun: "‘চালাও ও দেখাও’ চাপুন — তারপর ◀ ▶ বা কিবোর্ডের ← → দিয়ে ধাপ বদলান।",
    line: "লাইন", stack: "Stack", returns: "ফেরত", was: "আগে:", newVar: "নতুন:", noVars: "এখনো কোনো ভেরিয়েবল নেই",
    truncated: "⚠ ধাপ সংখ্যা সীমা (৩০০০) ছাড়িয়েছে, তাই এখানেই থামানো হয়েছে।", copied: "লিংক কপি হয়েছে", hidden: "বড় অ্যারে — প্রিভিউ লুকানো",
    pyFail: "Python লোড করা যায়নি — ইন্টারনেট সংযোগ দেখুন।", dlMLP: "নিউরাল নেটওয়ার্ক", dlConv: "Convolution",
    img: "ইনপুট ছবি", ker: "কার্নেল", fmap: "ফিচার ম্যাপ", input: "ইনপুট", sum: "বর্তমান যোগফল",
    done: "শেষ", error: "ত্রুটি", syntax: "সিনট্যাক্স ত্রুটি",
    a_import: "একটি মডিউল/লাইব্রেরি ইমপোর্ট করা হচ্ছে।", a_def: "ফাংশন `{0}` সংজ্ঞায়িত হচ্ছে — এখনো চলছে না, শুধু নামটি মনে রাখা হলো।",
    a_for: "লুপ: `{0}` প্রতিবার `{1}` থেকে পরের মান নেয়।", a_while: "যতক্ষণ শর্ত `{0}` সত্য, লুপ চলতে থাকবে।",
    a_if: "শর্ত `{0}` পরীক্ষা হচ্ছে — সত্য হলে নিচের ব্লক চলবে।", a_else: "আগের শর্ত মেলেনি, তাই বিকল্প ব্লক।",
    a_ret: "ফাংশন থেকে মান ফেরত যাচ্ছে।", a_print: "আউটপুটে কিছু ছাপা হচ্ছে।", a_aug: "`{0}`-এর মান `{2}` দিয়ে আপডেট হচ্ছে (`{1}`)।",
    a_assign: "`{0}`-এ ডান পাশের হিসাবের ফল রাখা হচ্ছে।", a_other: "লাইনটি চলছে।",
  },
  en: {
    tagline: "line by line", run: "▶ Run & visualize", edit: "✎ Edit", blank: "＋ Blank", share: "🔗 Link",
    explainTitle: "What happens in this step", varsTitle: "Variables (state after the line ran)", chartTitle: "Chart (loss etc.)", outTitle: "Output (print)",
    footer: "Open source — change the code and run your own",
    loadingPy: "Loading Python (a little slow the first time)", loadingPkg: "Loading libraries", ready: "Ready", running: "Running",
    steps: "steps", noRun: "Press “Run & visualize”, then step with ◀ ▶ or the ← → keys.",
    line: "Line", stack: "Stack", returns: "returns", was: "was:", newVar: "new:", noVars: "No variables yet",
    truncated: "⚠ Hit the step limit (3000) — execution was stopped here.", copied: "Link copied", hidden: "large array — preview hidden",
    pyFail: "Could not load Python — check your internet connection.", dlMLP: "Neural network", dlConv: "Convolution",
    img: "Input image", ker: "Kernel", fmap: "Feature map", input: "Input", sum: "Running sum",
    done: "Done", error: "Error", syntax: "Syntax error",
    a_import: "Importing a module / library.", a_def: "Defining function `{0}` — it does not run yet, only its name is stored.",
    a_for: "Loop: `{0}` takes the next value from `{1}` on every pass.", a_while: "Keep looping as long as `{0}` is true.",
    a_if: "Checking the condition `{0}` — the block below runs only if it is true.", a_else: "The earlier condition failed, so the fallback block runs.",
    a_ret: "Returning a value from the function.", a_print: "Printing to the output.", a_aug: "Updating `{0}` using `{2}` (`{1}`).",
    a_assign: "Storing the result of the right-hand side in `{0}`.", a_other: "Running this line.",
  },
};

/* ---------- state ---------- */
const S = {
  lang: store.get("dlv.lang") || "bn",
  exId: null, lines: [], notes: {}, run: null, step: 0,
  mode: "edit", timer: null, py: null, tracer: null, pyPromise: null,
};
const t = (k, ...a) => (T[S.lang][k] || k).replace(/\{(\d)\}/g, (_, i) => (a[i] === undefined ? "" : a[i]));

/* ---------- code parsing & highlighting ---------- */
function parseCode(src) {
  S.lines = src.replace(/\r\n?/g, "\n").split("\n");
  S.notes = {};
  S.lines.forEach((ln, i) => {
    const k = ln.indexOf("#:");
    if (k >= 0) {
      const parts = ln.slice(k + 2).split("||").map((s) => s.trim());
      S.notes[i + 1] = { bn: parts[0], en: parts[1] || parts[0] };
    }
  });
}
const KW = new Set("False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield".split(" "));
const BI = new Set("print range len sum max min abs float int str list dict set tuple zip enumerate round sorted map filter isinstance type bool pow divmod".split(" "));
function highlight(line) {
  const cut = line.indexOf("#:");
  const code = cut >= 0 ? line.slice(0, cut).replace(/\s+$/, "") : line;   // annotations are shown in the explanation card
  const re = /(#.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|([A-Za-z_]\w*)|(\s+|[\s\S])/g;
  let out = "", m;
  while ((m = re.exec(code))) {
    if (m[1]) out += `<span class="t-com">${esc(m[1])}</span>`;
    else if (m[2]) out += `<span class="t-str">${esc(m[2])}</span>`;
    else if (m[3]) out += `<span class="t-num">${esc(m[3])}</span>`;
    else if (m[4]) {
      const w = m[4], next = code[re.lastIndex];
      if (KW.has(w)) out += `<span class="t-kw">${w}</span>`;
      else if (BI.has(w) && next === "(") out += `<span class="t-bi">${w}</span>`;
      else if (next === "(") out += `<span class="t-fn">${w}</span>`;
      else out += esc(w);
    } else out += esc(m[5]);
  }
  return out || " ";
}
function autoExplain(raw) {
  const c = raw.replace(/#.*$/, "").trim();
  let m;
  if (!c) return t("a_other");
  if (/^(import|from)\s/.test(c)) return t("a_import");
  if ((m = c.match(/^def\s+(\w+)/))) return t("a_def", m[1]);
  if ((m = c.match(/^for\s+(.+?)\s+in\s+(.+?):?$/))) return t("a_for", m[1], m[2].replace(/:$/, ""));
  if ((m = c.match(/^while\s+(.+?):?$/))) return t("a_while", m[1].replace(/:$/, ""));
  if ((m = c.match(/^(?:if|elif)\s+(.+?):?$/))) return t("a_if", m[1].replace(/:$/, ""));
  if (/^else\b/.test(c)) return t("a_else");
  if (/^return\b/.test(c)) return t("a_ret");
  if (/^print\s*\(/.test(c)) return t("a_print");
  if ((m = c.match(/^([\w.\[\], ]+?)\s*([+\-*/%@]|\*\*|\/\/)=\s*(.+)$/))) return t("a_aug", m[1], m[2] + "=", m[3]);
  if ((m = c.match(/^([\w.\[\], ()]+?)\s*=(?!=)\s*(.+)$/))) return t("a_assign", m[1]);
  return t("a_other");
}

/* ---------- number / array rendering ---------- */
const POS = "255,140,60", NEG = "70,150,255";
const fmt = (x) => {
  if (x === null || x === undefined) return "NaN";
  if (typeof x === "boolean") return x ? "1" : "0";
  if (typeof x !== "number") return String(x);
  if (Number.isInteger(x)) return String(x);
  const a = Math.abs(x);
  if (a !== 0 && (a < 1e-3 || a >= 1e5)) return x.toExponential(1);
  return String(Number(x.toPrecision(3)));
};
const rgba = (v, m) => {
  if (typeof v === "boolean") v = v ? 1 : 0;
  if (typeof v !== "number" || !isFinite(v)) return "transparent";
  const k = Math.max(-1, Math.min(1, v / m));
  return `rgba(${k >= 0 ? POS : NEG},${(Math.abs(k) * 0.8).toFixed(3)})`;
};
const maxAbs = (d) => {
  let m = 0;
  (function walk(x) {
    if (Array.isArray(x)) x.forEach(walk);
    else if (typeof x === "number" && isFinite(x)) m = Math.max(m, Math.abs(x));
    else if (x === true) m = Math.max(m, 1);
  })(d);
  return m || 1;
};
const cell = (v, m, extra = "") => `<span class="cell ${extra}" style="background:${rgba(v, m)}" title="${esc(fmt(v))}">${esc(fmt(v))}</span>`;
function gridHTML(d, shape, m) {
  m = m || maxAbs(d);
  const dense = shape[shape.length - 1] > 10 ? " dense" : "";
  if (shape.length === 1) return `<div class="grid1${dense}">${d.map((v) => cell(v, m)).join("")}</div>`;
  if (shape.length === 2) return `<div class="${dense.trim()}">${d.map((r) => `<div class="grow">${r.map((v) => cell(v, m)).join("")}</div>`).join("")}</div>`;
  return d.map((ch, k) => `<div class="chan"><div class="chan-l">[${k}]</div>${gridHTML(ch, shape.slice(1), m)}</div>`).join("");
}
function compact(desc) {
  if (!desc) return "";
  if (desc.d !== undefined && desc.shape && desc.shape.length) {
    const s = JSON.stringify(desc.d, (k, v) => (typeof v === "number" && !Number.isInteger(v) ? Number(v.toPrecision(3)) : v));
    return s.length > 80 ? s.slice(0, 79) + "…" : s;
  }
  return desc.r;
}
function varCard(name, desc, changedOld) {
  const isChanged = changedOld !== undefined;
  const shape = desc.shape ? `(${desc.shape.join("×")})` : desc.len !== undefined && desc.ty !== "str" ? `len ${desc.len}` : "";
  let body;
  if (desc.d !== undefined && desc.shape && desc.shape.length) body = gridHTML(desc.d, desc.shape);
  else if (desc.tr) body = `<code class="val">${esc(desc.r)}</code><div class="was">${t("hidden")}</div>`;
  else body = `<code class="val">${esc(desc.d !== undefined ? fmt(desc.d) : desc.r)}</code>`;
  let was = "";
  if (isChanged && !(desc.shape && desc.shape.length)) was = changedOld ? `<div class="was">${t("was")} <code>${esc(compact(changedOld))}</code></div>` : "";
  return `<div class="var${isChanged ? " changed" : ""}"><div class="vh"><span class="vn">${esc(name)}</span><span class="vt">${esc(desc.ty)}${desc.dt ? " " + esc(desc.dt) : ""} ${shape}</span></div>${body}${was}</div>`;
}

/* ---------- Python / Pyodide ---------- */
function setStatus(msg, err) { const s = $("#status"); s.textContent = msg || ""; s.classList.toggle("err", !!err); }
const PYODIDE_BASES = [
  "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
  "https://pyodide-cdn2.iodide.io/v0.26.4/full/",
];
function loadScript(src) {
  return new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = src; s.onload = ok; s.onerror = () => { s.remove(); fail(new Error("cannot load " + src)); };
    document.head.appendChild(s);
  });
}
async function loadPyodideAny() {
  const errs = [];
  for (const base of PYODIDE_BASES) {
    try {
      if (typeof loadPyodide !== "function") await loadScript(base + "pyodide.js");
      return await loadPyodide({ indexURL: base });
    } catch (e) { errs.push(String(e.message || e)); }
  }
  throw new Error(errs.join(" | "));
}
async function getTracerSource() {
  if (window.TRACER_SRC) return window.TRACER_SRC;           // embedded copy: works from file:// too
  return (await fetch("py/tracer.py", { cache: "no-cache" })).text();
}
function ensurePython() {
  if (S.pyPromise) return S.pyPromise;
  S.pyPromise = (async () => {
    setStatus(t("loadingPy") + "…");
    const py = await loadPyodideAny();
    const ns = py.globals.get("dict")();
    py.runPython(await getTracerSource(), { globals: ns });
    S.py = py;
    S.tracer = ns.get("run");
    setStatus(t("ready"));
    return py;
  })().catch((e) => {
    S.pyPromise = null;
    console.error(e);
    setStatus(t("pyFail") + " (" + String(e.message || e).slice(0, 160) + ")", true);
    throw e;
  });
  return S.pyPromise;
}

async function runCode() {
  stopPlay();
  const code = $("#editor").value;
  $("#runBtn").disabled = true;
  try {
    await ensurePython();
    if (/^\s*(import|from)\s+(numpy|scipy|pandas|matplotlib)/m.test(code)) {
      setStatus(t("loadingPkg") + "…");
      await S.py.loadPackagesFromImports(code);
    }
    setStatus(t("running") + "…");
    await new Promise((r) => setTimeout(r, 20));
    const res = JSON.parse(S.tracer(code, 3000));
    S.run = res;
    parseCode(code);
    S.step = 0;
    setMode("view");
    buildCodeView();
    setStatus(`${res.steps.length} ${t("steps")}`);
    updateSliderBounds();
    render();
  } catch (e) {
    console.error(e);
    if (S.py) setStatus(String(e.message || e), true);
  } finally {
    $("#runBtn").disabled = false;
  }
}

/* ---------- modes ---------- */
function setMode(m) {
  S.mode = m;
  $("#editWrap").classList.toggle("hidden", m !== "edit");
  $("#codeView").classList.toggle("hidden", m !== "view");
  $("#editBtn").disabled = m === "edit";
}
function buildCodeView() {
  $("#codeView").innerHTML = S.lines.map((ln, i) =>
    `<div class="ln" role="listitem" data-n="${i + 1}"><span class="no">${i + 1}</span><span class="src">${highlight(ln)}</span><span class="cnt"></span></div>`).join("");
}
function updateGutter() {
  const n = $("#editor").value.split("\n").length;
  $("#gut").textContent = Array.from({ length: n }, (_, i) => i + 1).join("\n");
}

/* ---------- playback ---------- */
function stepCount() { return S.run ? S.run.steps.length : 0; }
function updateSliderBounds() {
  const sl = $("#slider");
  sl.max = Math.max(0, stepCount() - 1);
  sl.value = S.step;
}
function go(i) {
  if (!stepCount()) return;
  S.step = Math.max(0, Math.min(stepCount() - 1, i));
  render();
}
function stopPlay() {
  if (S.timer) { clearInterval(S.timer); S.timer = null; }
  $("#playBtn").textContent = "Auto ▶";
}
function togglePlay() {
  if (S.timer) return stopPlay();
  if (!stepCount()) return;
  if (S.step >= stepCount() - 1) S.step = 0;
  $("#playBtn").textContent = "Auto ⏸";
  S.timer = setInterval(() => {
    if (S.step >= stepCount() - 1) return stopPlay();
    go(S.step + 1);
  }, +$("#speed").value);
}

/* ---------- rendering of one step ---------- */
const resolveVars = (st) => { const V = {}; for (const k in st.vars) V[k] = S.run.pool[st.vars[k]]; return V; };

function render() {
  const el = $("#explain");
  if (!S.run || !stepCount()) {
    if (S.run && S.run.error) { renderError(el); return; }
    el.innerHTML = `<p class="hint">${esc(t("noRun"))}</p>`;
    $("#vars").innerHTML = `<span class="hint">${esc(t("noVars"))}</span>`;
    $("#dlCard").classList.add("hidden"); $("#chartCard").classList.add("hidden"); $("#stdout").textContent = "";
    return;
  }
  const run = S.run, st = run.steps[S.step], V = resolveVars(st);
  const last = S.step === run.steps.length - 1;

  /* code view: current line + visit counts */
  const counts = {};
  for (let i = 0; i <= S.step; i++) counts[run.steps[i].line] = (counts[run.steps[i].line] || 0) + 1;
  document.querySelectorAll("#codeView .ln").forEach((row) => {
    const n = +row.dataset.n;
    row.classList.toggle("cur", n === st.line);
    row.classList.toggle("errline", !!(run.error && last && run.error.line === n));
    row.querySelector(".cnt").textContent = counts[n] > 1 ? "×" + counts[n] : "";
  });
  const cur = document.querySelector("#codeView .ln.cur");
  if (cur) cur.scrollIntoView({ block: "nearest" });

  /* controls */
  $("#slider").value = S.step;
  $("#stepNo").textContent = `${S.step + 1} / ${run.steps.length}`;

  /* explanation */
  const raw = S.lines[st.line - 1] || "";
  const note = S.notes[st.line];
  const text = note ? note[S.lang] : autoExplain(raw);
  let html = `<div class="exp-head"><span class="badge">${esc(t("line"))} ${st.line}</span><span class="exp-code">${esc(raw.replace(/\s*#:.*$/, "").trim())}</span></div><p class="exp-text">${md(text)}</p>`;
  const ch = Object.keys(st.changed || {});
  if (ch.length) {
    html += `<div class="effects">` + ch.map((k) => {
      const nw = V[k], old = st.changed[k] >= 0 ? run.pool[st.changed[k]] : null;
      return `<div class="eff"><code>${esc(k)}</code> ${old ? esc(compact(old)) + " → " : esc(t("newVar")) + " "}<b>${esc(compact(nw))}</b></div>`;
    }).join("") + `</div>`;
  }
  if (st.stack && st.stack.length > 1 || st.ret !== undefined) {
    html += `<div class="meta">`;
    if (st.stack && st.stack.length > 1) html += `${esc(t("stack"))}: ${st.stack.map((n) => esc(n === "<module>" ? "main" : n)).join(" › ")}`;
    if (st.ret !== undefined) html += ` <span class="ret">↩ ${esc(t("returns"))} ${esc(compact(run.pool[st.ret]))}</span>`;
    html += `</div>`;
  }
  if (last && run.error) html += errorHTML(run.error);
  if (last && run.truncated) html += `<div class="warn">${esc(t("truncated"))}</div>`;
  el.innerHTML = html;

  /* variables */
  const names = Object.keys(V);
  $("#vars").innerHTML = names.length
    ? names.map((k) => varCard(k, V[k], st.changed && k in st.changed ? (st.changed[k] >= 0 ? run.pool[st.changed[k]] : null) : undefined)).join("")
    : `<span class="hint">${esc(t("noVars"))}</span>`;

  /* output */
  const so = $("#stdout");
  so.textContent = run.out.slice(0, st.out);
  so.scrollTop = so.scrollHeight;

  renderViz(V, run, st);
  renderChart(run);
}
function errorHTML(e) { return `<div class="errbox">${esc(e.type)}${e.line ? " — " + esc(t("line")) + " " + e.line : ""}\n${esc(e.msg)}</div>`; }
function renderError(el) {
  const e = S.run.error;
  el.innerHTML = errorHTML(e);
  document.querySelectorAll("#codeView .ln").forEach((row) => row.classList.toggle("errline", e.line === +row.dataset.n));
  $("#vars").innerHTML = ""; $("#dlCard").classList.add("hidden"); $("#chartCard").classList.add("hidden");
}

/* ---------- deep-learning pictures ---------- */
function currentViz() { const ex = (window.EXAMPLES || []).find((e) => e.id === S.exId); return ex && ex.viz; }

function renderViz(V) {
  const cfg = currentViz(), card = $("#dlCard"), box = $("#dlviz");
  let html = "";
  if (cfg && cfg.type === "mlp") { html = mlpViz(cfg, V); $("#dlTitle").textContent = t("dlMLP"); }
  if (cfg && cfg.type === "conv") { html = convViz(cfg, V); $("#dlTitle").textContent = t("dlConv"); }
  card.classList.toggle("hidden", !html);
  box.innerHTML = html;
}

function mlpViz(cfg, V) {
  const first = V[cfg.layers[0].W];
  if (!first || !first.d || first.shape.length !== 2) return "";
  const Ws = cfg.layers.map((l) => V[l.W]);
  const sizes = [first.shape[1]];
  Ws.forEach((w) => sizes.push(w && w.shape ? w.shape[0] : 1));
  const vec = (n) => { const d = V[n]; return d && d.shape && d.shape.length === 1 && d.d ? d.d : null; };
  const acts = [vec(cfg.x)].concat(cfg.layers.map((l) => vec(l.a)));
  const names = [cfg.x].concat(cfg.layers.map((l) => l.a));
  const W = 640, H = 270, padX = 80, colW = (W - 2 * padX) / (sizes.length - 1);
  const pos = sizes.map((n, l) => {
    const gap = Math.min(52, (H - 80) / Math.max(n, 1)), y0 = H / 2 - (gap * (n - 1)) / 2 + 6;
    return Array.from({ length: n }, (_, i) => ({ x: padX + l * colW, y: y0 + i * gap }));
  });
  let wmax = 0;
  Ws.forEach((w) => { if (w && w.d) wmax = Math.max(wmax, maxAbs(w.d)); });
  wmax = wmax || 1;
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="neural network">`;
  for (let l = 1; l < sizes.length; l++) {
    const w = Ws[l - 1];
    if (!w || !w.d) continue;
    for (let j = 0; j < sizes[l]; j++) for (let i = 0; i < sizes[l - 1]; i++) {
      const v = w.d[j] && w.d[j][i];
      if (typeof v !== "number") continue;
      svg += `<line x1="${pos[l - 1][i].x}" y1="${pos[l - 1][i].y}" x2="${pos[l][j].x}" y2="${pos[l][j].y}" stroke="rgb(${v >= 0 ? POS : NEG})" stroke-opacity="${(0.25 + 0.6 * Math.abs(v) / wmax).toFixed(2)}" stroke-width="${(0.6 + 3.2 * Math.abs(v) / wmax).toFixed(2)}"><title>${esc(cfg.layers[l - 1].W)}[${j}][${i}] = ${esc(fmt(v))}</title></line>`;
    }
  }
  sizes.forEach((n, l) => {
    const a = acts[l], m = a ? maxAbs(a) : 1, b = l > 0 ? V[cfg.layers[l - 1].b] : null;
    svg += `<text class="lbl" x="${pos[l][0].x}" y="16" text-anchor="middle">${esc(names[l])}${l > 0 ? " · " + esc(cfg.layers[l - 1].W) : ""}</text>`;
    pos[l].forEach((p, i) => {
      const v = a ? a[i] : undefined;
      svg += `<circle cx="${p.x}" cy="${p.y}" r="17" fill="${v === undefined ? "var(--panel2)" : rgba(v, m)}" stroke="var(--line)" stroke-width="1.5"><title>${esc(names[l])}[${i}]${v !== undefined ? " = " + esc(fmt(v)) : ""}${b && b.d ? "  bias=" + esc(fmt(b.d[i])) : ""}</title></circle>`;
      if (v !== undefined) svg += `<text x="${p.x}" y="${p.y + 3.5}" text-anchor="middle">${esc(fmt(v))}</text>`;
    });
  });
  return svg + `</svg>`;
}

function convViz(cfg, V) {
  const img = V[cfg.image], ker = V[cfg.kernel], out = V[cfg.out];
  if (!img || !img.d || img.shape.length !== 2 || !ker || !ker.d) return "";
  const [pi, pj] = cfg.pos.map((n) => (V[n] && typeof V[n].n === "number" ? V[n].n : null));
  const kh = ker.shape[0], kw = ker.shape[1];
  const block = (title, d, m, cls) => `<div class="blk"><h4>${esc(title)}</h4>${d.map((r, a) => `<div class="row">${r.map((v, b) => cell(v, m, cls(a, b))).join("")}</div>`).join("")}</div>`;
  const mi = maxAbs(img.d);
  let html = `<div class="convviz">`;
  html += block(t("img"), img.d, mi, (a, b) => (pi !== null && pj !== null && a >= pi && a < pi + kh && b >= pj && b < pj + kw ? "win" : ""));
  html += block(t("ker"), ker.d, maxAbs(ker.d), () => "");
  if (out && out.d && out.shape.length === 2) html += block(t("fmap"), out.d, maxAbs(out.d), (a, b) => (a === pi && b === pj ? "here" : ""));
  html += `</div>`;
  const acc = V[cfg.acc];
  if (acc && typeof acc.n === "number") html += `<div class="acc">${esc(t("sum"))} <code>${esc(cfg.acc)}</code> = <b>${esc(fmt(acc.n))}</b></div>`;
  return html;
}

function renderChart(run) {
  const card = $("#chartCard"), st = run.steps[S.step], V = resolveVars(st);
  const series = Object.keys(V).filter((k) => /loss|cost|history|error|acc/i.test(k) && V[k].shape && V[k].shape.length === 1 && V[k].d && V[k].d.length >= 2 && V[k].d.every((x) => typeof x === "number")).slice(0, 3);
  if (!series.length) { card.classList.add("hidden"); return; }
  card.classList.remove("hidden");
  const colors = ["#ffb454", "#4fd1c5", "#c3a6ff"], W = 600, H = 170, L = 38, B = 22, Tp = 10, R = 10;
  const all = series.flatMap((k) => V[k].d), lo = Math.min(...all, 0), hi = Math.max(...all) || 1;
  const n = Math.max(...series.map((k) => V[k].d.length));
  const X = (i) => L + (n === 1 ? 0 : (i / (n - 1)) * (W - L - R)), Y = (v) => H - B - ((v - lo) / (hi - lo || 1)) * (H - B - Tp);
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="chart">`;
  [lo, (lo + hi) / 2, hi].forEach((v) => { svg += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${L - 4}" y="${Y(v) + 3}" text-anchor="end">${esc(fmt(v))}</text>`; });
  series.forEach((k, s) => {
    const d = V[k].d;
    svg += `<polyline fill="none" stroke="${colors[s]}" stroke-width="2" points="${d.map((v, i) => `${X(i)},${Y(v)}`).join(" ")}"/>`;
    svg += `<circle cx="${X(d.length - 1)}" cy="${Y(d[d.length - 1])}" r="4" fill="${colors[s]}"/>`;
  });
  svg += `<text x="${L}" y="${H - 5}">1</text><text x="${W - R}" y="${H - 5}" text-anchor="end">${n}</text></svg>`;
  $("#chart").innerHTML = svg + `<div class="legend">${series.map((k, s) => `<span><i style="background:${colors[s]}"></i>${esc(k)}</span>`).join("")}</div>`;
}

/* ---------- examples, i18n, sharing ---------- */
function applyI18n() {
  document.documentElement.lang = S.lang === "bn" ? "bn" : "en";
  document.querySelectorAll("[data-i18n]").forEach((n) => { n.textContent = t(n.dataset.i18n); });
  $("#langBtn").textContent = S.lang === "bn" ? "EN" : "বাং";
  const sel = $("#exSelect"), cur = sel.value;
  sel.innerHTML = (window.EXAMPLES || []).map((e) => `<option value="${e.id}">${esc(e.title[S.lang])}</option>`).join("") + `<option value="__custom">✎ ${S.lang === "bn" ? "আমার কোড" : "My code"}</option>`;
  sel.value = cur || S.exId || "";
  const ex = (window.EXAMPLES || []).find((e) => e.id === S.exId);
  $("#exDesc").textContent = ex ? ex.desc[S.lang] : (S.lang === "bn" ? "নিজের Python কোড লিখে ‘চালাও’ চাপুন। লাইনের শেষে `#: ব্যাখ্যা` লিখলে সেটি ব্যাখ্যা হিসেবে দেখাবে।" : "Write your own Python and press Run. Add `#: explanation` at the end of a line to have it shown as the explanation.");
}
function loadExample(id) {
  stopPlay();
  const ex = (window.EXAMPLES || []).find((e) => e.id === id);
  S.exId = ex ? ex.id : null;
  $("#editor").value = ex ? ex.code : "";
  S.run = null; S.step = 0;
  parseCode($("#editor").value); updateGutter(); setMode("edit"); updateSliderBounds();
  $("#exSelect").value = ex ? ex.id : "__custom";
  applyI18n(); render();
  if (ex) { store.set("dlv.ex", ex.id); try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* ignore */ } }
}
const enc = (s) => btoa(unescape(encodeURIComponent(s)));
const dec = (s) => decodeURIComponent(escape(atob(s)));
function copyLink() {
  const url = location.origin + location.pathname + "#code=" + enc($("#editor").value);
  try { history.replaceState(null, "", url); } catch (e) { /* ignore */ }
  const done = () => setStatus(t("copied"));
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, done); else done();
}

/* ---------- architecture explorer + image testing lab ---------- */
const ARCH_PRESETS = {
  cnn: [["Input image", "1 × 3 × 224 × 224", "RGB image tensor"], ["Conv2D + ReLU", "1 × 32 × 112 × 112", "Learn local edges and textures"], ["Pooling / Conv blocks", "1 × 128 × 28 × 28", "Build richer feature maps"], ["Global average pool", "1 × 128", "Compress spatial dimensions"], ["Linear classifier", "1 × 1000", "Class scores / logits"]],
  mlp: [["Input features", "1 × 128", "Numerical feature vector"], ["Linear + ReLU", "1 × 256", "Learn feature combinations"], ["Linear + ReLU", "1 × 128", "Hidden representation"], ["Output layer", "1 × 10", "Class scores / logits"]],
  autoencoder: [["Input image", "1 × 3 × 128 × 128", "Image tensor"], ["Encoder", "1 × 256 × 16 × 16", "Compress to a latent representation"], ["Latent vector", "1 × 128", "Compact learned representation"], ["Decoder", "1 × 3 × 128 × 128", "Reconstruct the image"], ["Reconstruction", "RGB image", "Compare against the input"]]
};
function drawArchitecture(rows) {
  $("#archDiagram").innerHTML = rows.map((r, i) => `<article class="arch-stage"><span class="stage-num">STAGE ${i + 1}</span><h3>${esc(r[0])}</h3><span class="shape">${esc(r[1])}</span><p>${esc(r[2] || "Custom stage")}</p></article>`).join("");
}
function selectArchitecture() {
  const preset = $("#archPreset").value;
  $("#archCustom").classList.toggle("hidden", preset !== "custom");
  if (preset !== "custom") drawArchitecture(ARCH_PRESETS[preset] || ARCH_PRESETS.cnn);
}
function drawCustomArchitecture() {
  const rows = $("#archLayers").value.split(/\r?\n/).map(x => x.trim()).filter(Boolean).map(line => {
    const parts = line.split("|").map(x => x.trim());
    return [parts[0] || "Layer", parts[1] || "shape not specified", parts[2] || "User-defined layer"];
  });
  if (!rows.length) { $("#archDiagram").innerHTML = '<p class="hint">Add at least one layer.</p>'; return; }
  drawArchitecture(rows);
}
let uploadedImage = null, onnxModelFile = null, classLabels = [], ortSession = null, ortLoading = null, cocoModel = null, cocoLoading = null;
function imageMetric(label, value) { return `<div class="metric"><span>${esc(label)}</span><b>${esc(value)}</b></div>`; }
function showImageMetrics(img) {
  const c = document.createElement("canvas"); c.width = 64; c.height = 64;
  const ctx = c.getContext("2d", { willReadFrequently: true }); ctx.drawImage(img, 0, 0, 64, 64);
  const px = ctx.getImageData(0, 0, 64, 64).data; let r = 0, g = 0, b = 0;
  for (let i = 0; i < px.length; i += 4) { r += px[i]; g += px[i + 1]; b += px[i + 2]; }
  const n = px.length / 4;
  $("#imageMetrics").innerHTML = imageMetric("Original size", `${img.naturalWidth} × ${img.naturalHeight}`) + imageMetric("Aspect ratio", (img.naturalWidth / img.naturalHeight).toFixed(3)) + imageMetric("Mean red", (r / n).toFixed(1)) + imageMetric("Mean green", (g / n).toFixed(1)) + imageMetric("Mean blue", (b / n).toFixed(1));
}
function loadImageFile(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) { $("#inferenceResult").textContent = "Please choose a valid image file."; return; }
  const url = URL.createObjectURL(file), img = new Image();
  img.onload = () => {
    uploadedImage = img;
    const canvas = $("#imageCanvas"), ctx = canvas.getContext("2d");
    const scale = Math.min(1, 640 / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height); canvas.style.display = "block";
    $("#imagePlaceholder").classList.add("hidden"); showImageMetrics(img);
    $("#runInferenceBtn").disabled = !onnxModelFile;
    $("#detectPeopleBtn").disabled = false;
    $("#inferenceResult").innerHTML = '<span class="hint">Image ready. Detect common objects with AI, or load a compatible ONNX model for custom predictions.</span>';
    URL.revokeObjectURL(url);
  };
  img.onerror = () => { URL.revokeObjectURL(url); $("#inferenceResult").textContent = "Could not read this image."; };
  img.src = url;
}

async function ensureCocoModel() {
  if (cocoModel) return cocoModel;
  if (!cocoLoading) cocoLoading = new Promise((resolve, reject) => {
    const addScript = (src) => new Promise((res, rej) => {
      const existing = [...document.scripts].find(s => s.src === src);
      if (existing) { if (window.cocoSsd) res(); else { existing.addEventListener("load", res, { once: true }); existing.addEventListener("error", rej, { once: true }); } return; }
      const script = document.createElement("script"); script.src = src; script.onload = res; script.onerror = () => rej(new Error("Could not load AI libraries. Check your internet connection.")); document.head.appendChild(script);
    });
    (async () => {
      await addScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js");
      await addScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js");
      if (!window.cocoSsd) throw new Error("Object detection model library did not load.");
      cocoModel = await window.cocoSsd.load({ base: "lite_mobilenet_v2" }); resolve(cocoModel);
    })().catch(reject);
  }).catch(e => { cocoLoading = null; throw e; });
  return cocoLoading;
}
async function detectPeople() {
  if (!uploadedImage) return;
  const btn = $("#detectPeopleBtn"); btn.disabled = true;
  $("#inferenceResult").textContent = "Loading pretrained object-detection AI model… first run may take a little while.";
  try {
    const model = await ensureCocoModel();
    $("#inferenceResult").textContent = "Analyzing image…";
    const predictions = (await model.detect(uploadedImage, 40, 0.35)).sort((a,b) => b.score-a.score);
    const canvas = $("#imageCanvas"), ctx = canvas.getContext("2d");
    const scale = Math.min(1, 640 / Math.max(uploadedImage.naturalWidth, uploadedImage.naturalHeight));
    canvas.width = Math.max(1, Math.round(uploadedImage.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(uploadedImage.naturalHeight * scale));
    ctx.drawImage(uploadedImage, 0, 0, canvas.width, canvas.height);
    ctx.lineWidth = Math.max(2, canvas.width / 250); ctx.font = `bold ${Math.max(12, canvas.width / 32)}px sans-serif`;
    const palette = ["#20c997", "#ffb020", "#5b9dff", "#ff6b8a", "#b28dff", "#43c6ac", "#ff875e", "#e6d84f"];
    predictions.forEach((p, i) => {
      const [x,y,w,h] = p.bbox.map(v => v * scale);
      const color = palette[i % palette.length];
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.strokeRect(x,y,w,h);
      const objectName = p.class.charAt(0).toUpperCase() + p.class.slice(1);
      const label = `${objectName} · ${(p.score*100).toFixed(1)}%`;
      const th = Math.max(20, canvas.width / 24), tw = ctx.measureText(label).width + 12;
      ctx.fillRect(x, Math.max(0,y-th), tw, th); ctx.fillStyle = "#06251b"; ctx.fillText(label, x+6, Math.max(14,y-6));
    });
    if (!predictions.length) {
      $("#inferenceResult").innerHTML = `<b>No objects detected</b><p class="hint">The model did not find supported objects above the 35% confidence threshold. Try a clearer image or an object from the COCO dataset.</p>`;
    } else {
      const counts = {}; predictions.forEach(p => { counts[p.class] = (counts[p.class] || 0) + 1; });
      const summary = Object.entries(counts).map(([name,count]) => `${name} × ${count}`).join(" · ");
      const rows = predictions.map((p,i) => `<div class="prediction-row"><span>${i+1}. ${p.class.charAt(0).toUpperCase() + p.class.slice(1)} <span class="hint">· box ${p.bbox.map(v=>Math.round(v)).join(", ")}</span></span><b>${(p.score*100).toFixed(2)}%</b></div>`).join("");
      $("#inferenceResult").innerHTML = `<b>Detected ${predictions.length} ${predictions.length===1?"object":"objects"}</b><p class="hint">${summary}</p><p class="hint">Colored boxes show object locations. Confidence is the model score. The built-in COCO-SSD model recognizes common classes such as people, cars, bicycles, dogs, cats, bottles, chairs and more.</p>${rows}`;
    }
  } catch (e) { $("#inferenceResult").textContent = `Object detection failed: ${e.message || e}. Please check your internet connection and try again.`; }
  finally { btn.disabled = !uploadedImage; }
}

async function ensureOrt() {
  if (window.ort) return window.ort;
  if (!ortLoading) ortLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script"); script.src = "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js";
    script.onload = () => window.ort ? resolve(window.ort) : reject(new Error("ONNX Runtime loaded but unavailable."));
    script.onerror = () => reject(new Error("Could not load ONNX Runtime. Check your internet connection."));
    document.head.appendChild(script);
  }).catch(e => { ortLoading = null; throw e; });
  return ortLoading;
}
async function loadOnnxFile(file) {
  onnxModelFile = file || null; ortSession = null;
  $("#runInferenceBtn").disabled = !(uploadedImage && onnxModelFile);
  if (!file) { $("#inferenceResult").innerHTML = '<span class="hint">No ONNX model selected.</span>'; return; }
  $("#inferenceResult").textContent = "Loading ONNX model in your browser…";
  try {
    const ort = await ensureOrt();
    ortSession = await ort.InferenceSession.create(await file.arrayBuffer(), { executionProviders: ["wasm"] });
    $("#inferenceResult").innerHTML = `<b>Model loaded.</b><div class="hint">Input: ${esc(ortSession.inputNames.join(", "))} · Output: ${esc(ortSession.outputNames.join(", "))}</div>`;
    $("#runInferenceBtn").disabled = !uploadedImage;
  } catch (e) {
    ortSession = null; $("#runInferenceBtn").disabled = true;
    $("#inferenceResult").textContent = `Model load failed: ${e.message || e}`;
  }
}
async function runOnnxInference() {
  const btn = $("#runInferenceBtn");
  if (!uploadedImage || !onnxModelFile) return;
  btn.disabled = true; $("#inferenceResult").textContent = "Preparing image and running inference…";
  try {
    if (!ortSession) { await loadOnnxFile(onnxModelFile); if (!ortSession) return; }
    const ort = await ensureOrt(), w = Math.max(1, Math.min(1024, Number($("#modelWidth").value) || 224)), h = Math.max(1, Math.min(1024, Number($("#modelHeight").value) || 224));
    const temp = document.createElement("canvas"); temp.width = w; temp.height = h;
    const ctx = temp.getContext("2d", { willReadFrequently: true }); ctx.drawImage(uploadedImage, 0, 0, w, h);
    const rgbaData = ctx.getImageData(0, 0, w, h).data, norm = $("#modelNorm").value, layout = $("#modelLayout").value;
    const data = new Float32Array(w * h * 3);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) {
      let v = rgbaData[(y * w + x) * 4 + c];
      if (norm === "zeroone") v /= 255; else if (norm === "minusone") v = v / 127.5 - 1;
      data[layout === "nchw" ? c * w * h + y * w + x : (y * w + x) * 3 + c] = v;
    }
    const dims = layout === "nchw" ? [1, 3, h, w] : [1, h, w, 3];
    const feeds = { [ortSession.inputNames[0]]: new ort.Tensor("float32", data, dims) };
    const output = await ortSession.run(feeds), tensor = output[ortSession.outputNames[0]];
    const vals = Array.from(tensor.data).filter(v => Number.isFinite(Number(v))).map(Number);
    if (!vals.length) throw new Error("The model returned no numeric outputs.");
    const maxV = Math.max(...vals), exps = vals.map(v => Math.exp(Math.max(-80, Math.min(80, v - maxV)))), total = exps.reduce((a, b) => a + b, 0) || 1;
    const probs = exps.map(v => v / total), top = probs.map((score, index) => ({ score, index })).sort((a, b) => b.score - a.score).slice(0, 5);
    const rows = top.map(x => `<div class="prediction-row"><span>${esc(classLabels[x.index] || `Class ${x.index}`)} <span class="hint">(#${x.index})</span></span><b>${(x.score * 100).toFixed(2)}%</b></div>`).join("");
    $("#inferenceResult").innerHTML = `<b>Top output scores</b><div class="hint">Output tensor: ${esc(tensor.dims.join(" × "))}. Softmax ranking is illustrative; confirm your model's preprocessing and output semantics.</div>${rows}`;
  } catch (e) {
    $("#inferenceResult").textContent = `Inference failed: ${e.message || e}. Check model input shape, layout, normalization, and whether it expects float32 RGB input.`;
  } finally { btn.disabled = !(uploadedImage && onnxModelFile); }
}

/* ---------- boot ---------- */
function init() {
  $("#archPreset").addEventListener("change", selectArchitecture);
  $("#drawArchBtn").addEventListener("click", drawCustomArchitecture);
  $("#imageFile").addEventListener("change", (e) => loadImageFile(e.target.files && e.target.files[0]));
  $("#onnxFile").addEventListener("change", (e) => loadOnnxFile(e.target.files && e.target.files[0]));
  $("#labelsFile").addEventListener("change", async (e) => {
    const f = e.target.files && e.target.files[0]; classLabels = f ? (await f.text()).split(/\r?\n/).map(x => x.trim()) : [];
  });
  $("#runInferenceBtn").addEventListener("click", runOnnxInference);
  $("#detectPeopleBtn").addEventListener("click", detectPeople);
  selectArchitecture();
  const ed = $("#editor");
  ed.addEventListener("input", updateGutter);
  ed.addEventListener("scroll", () => { $("#gut").scrollTop = ed.scrollTop; });
  ed.addEventListener("keydown", (e) => {
    if (e.key === "Tab") { e.preventDefault(); const s = ed.selectionStart; ed.setRangeText("    ", s, ed.selectionEnd, "end"); updateGutter(); }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runCode(); }
  });
  $("#runBtn").onclick = runCode;
  $("#editBtn").onclick = () => { stopPlay(); setMode("edit"); ed.focus(); };
  $("#newBtn").onclick = () => { loadExample("__none__"); $("#exSelect").value = "__custom"; applyI18n(); ed.focus(); };
  $("#linkBtn").onclick = copyLink;
  $("#exSelect").onchange = (e) => { if (e.target.value === "__custom") { loadExample("__none__"); $("#exSelect").value = "__custom"; applyI18n(); } else loadExample(e.target.value); };
  $("#langBtn").onclick = () => { S.lang = S.lang === "bn" ? "en" : "bn"; store.set("dlv.lang", S.lang); applyI18n(); if (S.run) setStatus(`${stepCount()} ${t("steps")}`); render(); };
  $("#themeBtn").onclick = () => {
    const root = document.documentElement, dark = getComputedStyle(root).getPropertyValue("--bg").trim() === "#0e1319";
    root.dataset.theme = dark ? "light" : "dark"; store.set("dlv.theme", root.dataset.theme);
  };
  $("#firstBtn").onclick = () => go(0);
  $("#prevBtn").onclick = () => go(S.step - 1);
  $("#nextBtn").onclick = () => go(S.step + 1);
  $("#lastBtn").onclick = () => go(stepCount() - 1);
  $("#playBtn").onclick = togglePlay;
  $("#slider").oninput = (e) => go(+e.target.value);
  $("#speed").onchange = () => { if (S.timer) { stopPlay(); togglePlay(); } };
  $("#codeView").addEventListener("click", (e) => {
    const row = e.target.closest(".ln"); if (!row || !S.run) return;
    const n = +row.dataset.n, steps = S.run.steps;
    let j = steps.findIndex((s, i) => i >= S.step && s.line === n);
    if (j < 0) j = steps.findIndex((s) => s.line === n);
    if (j >= 0) go(j);
  });
  document.addEventListener("keydown", (e) => {
    if (/^(TEXTAREA|SELECT|INPUT)$/.test(e.target.tagName) && e.target.type !== "range") return;
    if (e.key === "ArrowRight") { go(S.step + 1); e.preventDefault(); }
    else if (e.key === "ArrowLeft") { go(S.step - 1); e.preventDefault(); }
    else if (e.key === " " && S.run) { togglePlay(); e.preventDefault(); }
    else if (e.key === "Home") go(0); else if (e.key === "End") go(stepCount() - 1);
  });
  const th = store.get("dlv.theme"); if (th) document.documentElement.dataset.theme = th;

  /* repo link for GitHub Pages: https://USER.github.io/REPO/ -> https://github.com/USER/REPO */
  const m = location.hostname.match(/^([^.]+)\.github\.io$/), repo = location.pathname.split("/")[1];
  if (m && repo) $("#ghLink").href = `https://github.com/${m[1]}/${repo}`;

  applyI18n();
  const hash = location.hash.match(/^#code=(.+)$/);
  if (hash) {
    try { loadExample("__none__"); $("#editor").value = dec(hash[1]); parseCode($("#editor").value); updateGutter(); $("#exSelect").value = "__custom"; applyI18n(); }
    catch (e) { loadExample(window.EXAMPLES[0].id); }
  } else loadExample(store.get("dlv.ex") && (window.EXAMPLES || []).some((x) => x.id === store.get("dlv.ex")) ? store.get("dlv.ex") : window.EXAMPLES[0].id);
  ensurePython().catch(() => {});      // warm up in the background
}
init();
})();
