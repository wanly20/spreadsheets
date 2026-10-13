#!/usr/bin/env python3
"""Print WCAG contrast ratios for the colour pairs the app actually uses.

    python3 tools/contrast.py

Reads the hex values straight from css/tokens.css so the table never drifts.
"""
import re
from pathlib import Path

TOKENS = Path(__file__).resolve().parent.parent / "css" / "tokens.css"


def load():
    css = TOKENS.read_text()
    root = css.split("}")[0]  # first :root block = light theme
    return dict(re.findall(r"--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})", root))


def lum(h):
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


# (foreground token, background token, what it is, minimum)
PAIRS = [
    ("ink", "paper", "body text on page", 4.5),
    ("ink", "white", "body text on cards", 4.5),
    ("ink-soft", "paper", "secondary text on page", 4.5),
    ("ink-soft", "white", "secondary text on cards", 4.5),
    ("white", "green-600", "primary button label", 4.5),
    ("white", "blue-600", "blue button label", 4.5),
    ("white", "green-600", "correct button label", 4.5),
    ("white", "coral-600", "incorrect button label", 4.5),
    ("yellow-ink", "yellow-400", "label on yellow", 4.5),
    ("green-700", "green-50", "correct sheet text", 4.5),
    ("coral-700", "coral-50", "incorrect sheet text", 4.5),
    ("green-700", "green-50", "selected option text", 4.5),
    ("green-700", "white", "link / accent text", 4.5),
    ("blue-700", "white", "blue accent text", 4.5),
    ("blue-600", "blue-50", "selected option text (blue)", 4.5),
    ("white", "blue-500", "focus/selection blue on white (UI, 3:1)", 3.0),
    ("sheet-head-sel-text", "sheet-head-sel", "selected sheet header", 4.5),
    ("ink-soft", "line-100", "secondary text on tinted rows", 4.5),
    ("ink", "line-100", "fill-the-gaps: text in a gap", 4.5),
    ("ink", "blue-50", "fill-the-gaps: text in the active gap", 4.5),
    ("yellow-ink", "yellow-50", "tip text on yellow", 4.5),
    ("ink-faint", "white", "disabled label (exempt, shown for info)", 0),
]

if __name__ == "__main__":
    c = load()
    bad = 0
    print(f"{'foreground':16s} {'background':16s} {'ratio':>6s}  use")
    for fg, bg, use, need in PAIRS:
        r = ratio(c[fg], c[bg])
        ok = "ok" if r >= need else "FAIL"
        bad += r < need
        print(f"{fg:16s} {bg:16s} {r:6.2f}  {use} [{ok}]")
    raise SystemExit(1 if bad else 0)
