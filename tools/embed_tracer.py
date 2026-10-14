"""Regenerates js/tracer_src.js from py/tracer.py (so the site also works when index.html is opened by double-click).
Run after editing py/tracer.py:   python tools/embed_tracer.py
"""
import json, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(root, "py", "tracer.py"), encoding="utf-8").read()
open(os.path.join(root, "js", "tracer_src.js"), "w", encoding="utf-8").write(
    "/* AUTO-GENERATED from py/tracer.py by tools/embed_tracer.py — do not edit */\nwindow.TRACER_SRC = " + json.dumps(src) + ";\n")
print("ok")
