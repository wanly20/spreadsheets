#!/usr/bin/env python3
"""Crop the real Google Sheets screenshots into assets/screens/*.webp.

    python3 tools/crop_screens.py            # every picture
    python3 tools/crop_screens.py legend     # just one (by name)
    python3 tools/crop_screens.py --preview DIR   # also save PNGs with every region drawn on, to check them

Reads ../spreadsheets/screenshots/google_sheets/menus/*.jpg (1335×896, Oct 2026; 12 is 1372×876). First removes the
hover highlights (and the cursor) that would give an answer away, then crops, saves WebP, and prints
the regions (in the crop's own pixels) as JSON for content/screens.js. Needs Pillow (system python3).
Regions are written below in the ORIGINAL screenshot's pixels: x, y, width, height, label.

Also (TOOLBAR, below) the Lesson 1-2 toolbar pictures from ../spreadsheets/screenshots/google_sheets/*.png:
sheets-basic (with the UK-locale £ button repainted as the Australian $) and single toolbar buttons
(ic-halign, ic-valign, ic-wrap) for the learn cards. Their regions are in content/screens.js already.
"""
import json, os, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

APP = Path(__file__).resolve().parent.parent
SRC = APP.parent / "spreadsheets/screenshots/google_sheets/menus"
SHEETS = APP.parent / "spreadsheets/screenshots/google_sheets"


def dollar(im):
    """basic.png was taken in a UK-locale file: its currency button shows £. Lesson 2 sets the
    locale to Australia, where that button shows $, so paint the $ in the same grey."""
    d = ImageDraw.Draw(im)
    d.rectangle((394, 96, 414, 122), fill=(240, 244, 249))
    f = ImageFont.truetype("/usr/share/fonts/liberation/LiberationSans-Regular.ttf", 19)
    l, t, r, b = d.textbbox((0, 0), "$", font=f)
    d.text((404 - (r - l) / 2 - l, 109 - (b - t) / 2 - t), "$", font=f, fill=(95, 99, 104))
    return im


# name: (file in google_sheets/, crop box or None for the whole picture, fix or None)
TOOLBAR = {
    "sheets-basic": ("basic.png", None, dollar),
    "ic-halign": ("rest_of_ribbon.png", (168, 4, 222, 50), None),
    "ic-valign": ("rest_of_ribbon.png", (228, 4, 282, 50), None),
    "ic-wrap": ("rest_of_ribbon.png", (288, 4, 342, 50), None),
}
OUT = APP / "assets/screens"


def unhover(im, box, lo=222, hi=240):
    """Turn the grey hover background in box white."""
    px = im.load()
    for x in range(box[0], box[2]):
        for y in range(box[1], box[3]):
            r, g, b = px[x, y]
            if lo <= r <= hi and abs(r - g) < 6 and abs(g - b) < 6:
                px[x, y] = (255, 255, 255)


def source(name):
    im = Image.open(SRC / f"{name}.jpg").convert("RGB")
    if name == "04_insert_menu_chart":  # the Chart row is hovered and the cursor sits on the word
        unhover(im, (163, 262, 454, 292))
        d = ImageDraw.Draw(im)
        d.rectangle((196, 266, 250, 300), fill=(255, 255, 255))
        d.text((198, 270), "Chart", font=ImageFont.truetype("/usr/share/fonts/liberation/LiberationSans-Regular.ttf", 13), fill=(60, 64, 67))
    if name == "10_chart_menu_move_to_own_sheet":  # Edit the chart is hovered
        unhover(im, (769, 352, 946, 380))
    if name == "05_setup_chart_type_list":  # the column chart (the current type) has a blue "chosen" border
        px = im.load()
        x0, y0, x1, y1 = 1046, 264, 1169, 348  # copy the pie thumbnail's grey border, 125px to the right
        for x in range(x0, x1):
            for y in range(y0, y1):
                if min(x - x0, x1 - 1 - x, y - y0, y1 - 1 - y) <= 5:
                    px[x, y] = px[x + 125, y]
    return im

TABS = {"Setup": (1062, 117, 76, 30, "the Setup tab"), "Customise": (1196, 117, 92, 30, "the Customise tab")}
def sec(y, name): return (1048, y, 250, 30, f"the {name} section")
S = {
 "menu-bar": ("11_chart_selected_resize_handles", (50, 28, 470, 56), {m: (x, 31, w, 22, f"the {m} menu") for m, x, w in [("File", 54, 26), ("Edit", 88, 28), ("View", 125, 32), ("Insert", 167, 40), ("Format", 215, 47), ("Data", 271, 32), ("Tools", 313, 36), ("Extensions", 359, 66), ("Help", 435, 32)]},
   "The Google Sheets menu bar: File, Edit, View, Insert, Format, Data, Tools, Extensions, Help"),
 "data-menu": ("01_data_menu", (0, 28, 565, 380), {
   "Sort sheet": (268, 59, 288, 28, "Sort sheet"), "Sort range": (268, 88, 288, 28, "Sort range"), "Create a filter": (268, 132, 288, 28, "Create a filter"),
   "Create group by view": (268, 161, 288, 28, "Create group by view"), "Create filter view": (268, 190, 288, 28, "Create filter view"), "Add a slicer": (268, 219, 288, 28, "Add a slicer"),
   "Protect sheets and ranges": (268, 263, 288, 28, "Protect sheets and ranges"), "Named ranges": (268, 292, 288, 28, "Named ranges"), "Randomise range": (268, 350, 288, 28, "Randomise range")},
   "Google Sheets with the Data menu open: Sort sheet, Sort range, Create a filter and more"),
 "data-menu-sort-range": ("02_data_sort_range_submenu", (262, 52, 800, 255), {
   "Sort sheet": (268, 59, 288, 28, "Sort sheet"), "Sort range": (268, 88, 288, 28, "Sort range"), "Create a filter": (268, 132, 288, 28, "Create a filter"),
   "Create filter view": (268, 190, 288, 28, "Create filter view"), "Add a slicer": (268, 219, 288, 28, "Add a slicer"),
   "A to Z": (559, 94, 234, 28, "Sort range by column A (A to Z)"), "Z to A": (559, 123, 234, 28, "Sort range by column A (Z to A)"), "Advanced range sorting options": (559, 166, 234, 30, "Advanced range sorting options")},
   "Data → Sort range open: sort by column A (A to Z), (Z to A), and Advanced range sorting options"),
 "sort-window": ("03_advanced_range_sorting_options", (436, 308, 900, 657), {
   "Close": (846, 326, 32, 30, "the close button (×)"), "Data has header row": (453, 365, 160, 26, "the Data has header row box"),
   "Sort by": (505, 411, 61, 36, "the Sort by list"), "A to Z": (624, 415, 66, 28, "A to Z (on the Sort by row)"), "Z to A": (698, 415, 66, 28, "Z to A (on the Sort by row)"),
   "then by": (505, 478, 82, 38, "the then by list"), "then A to Z": (624, 483, 66, 28, "A to Z (on the then by row)"), "then Z to A": (698, 483, 66, 28, "Z to A (on the then by row)"),
   "Delete": (846, 483, 30, 30, "the bin (delete this sort column)"), "Add another sort column": (456, 545, 199, 36, "Add another sort column"),
   "Cancel": (706, 600, 90, 35, "the Cancel button"), "Sort": (804, 600, 75, 35, "the Sort button")},
   "The sort window: Sort range from A3 to E9, Data has header row ticked, Sort by Stall A to Z, then by Morning A to Z, Add another sort column, Cancel and Sort"),
 "insert-menu": ("04_insert_menu_chart", (0, 28, 460, 380), {
   "Cells": (165, 59, 288, 28, "Cells"), "Rows": (165, 88, 288, 28, "Rows"), "Columns": (165, 117, 288, 28, "Columns"), "Sheet": (165, 146, 288, 28, "Sheet"),
   "Pre-built tables": (165, 190, 288, 28, "Pre-built tables"), "Timeline": (165, 233, 288, 28, "Timeline"), "Chart": (165, 262, 288, 28, "Chart"),
   "Pivot table": (165, 291, 288, 28, "Pivot table"), "Image": (165, 320, 288, 28, "Image"), "Drawing": (165, 349, 288, 28, "Drawing")},
   "Google Sheets with the Insert menu open: Cells, Rows, Columns, Sheet, Pre-built tables, Timeline, Chart, Pivot table, Image, Drawing"),
 "chart-type": ("05_setup_chart_type_list", (1032, 60, 1310, 440), {**TABS,
   "Chart type": (1045, 186, 262, 40, "the Chart type list"), "column": (1046, 264, 122, 84, "the column chart"), "pie": (1171, 264, 122, 84, "the pie chart"),
   "area": (1046, 351, 122, 84, "the area chart"), "bar": (1171, 351, 122, 84, "the bar chart")},
   "The chart editor, Setup tab, with the Chart type list open: suggested charts (column, pie, area, bar)"),
 "setup-column": ("06a_setup_switch_rows_columns_off", (240, 110, 1325, 795), {**TABS,
   "chart title": (258, 335, 262, 28, "the chart title"), "legend": (412, 364, 216, 22, "the legend"), "columns": (288, 392, 488, 210, "the columns"),
   "Chart type": (1045, 186, 262, 40, "the Chart type list"), "Stacking": (1045, 262, 262, 40, "the Stacking list"), "Data range": (1045, 342, 262, 26, "the Data range box"),
   "X-axis": (1045, 412, 262, 34, "the X-axis box"), "Aggregate": (1045, 461, 120, 24, "the Aggregate tick box"), "Series": (1045, 531, 262, 114, "the Series list"),
   "Add Series": (1045, 651, 262, 34, "Add Series"), "Switch rows/columns": (1045, 704, 180, 24, "the Switch rows/columns tick box"),
   "Use row 3 as headers": (1045, 732, 180, 24, "the Use row 3 as headers tick box"), "Use column A as labels": (1045, 759, 180, 24, "the Use column A as labels tick box")},
   "A column chart of Morning, Lunch and Afternoon for each stall, and the chart editor's Setup tab with Switch rows/columns not ticked"),
 "setup-switched": ("06b_setup_switch_rows_columns_on", (240, 110, 1325, 852), {**TABS,
   "chart title": (258, 335, 262, 28, "the chart title"), "legend": (684, 364, 100, 120, "the legend"), "columns": (300, 370, 378, 232, "the columns"),
   "Chart type": (1045, 186, 248, 40, "the Chart type list"), "Data range": (1045, 342, 248, 26, "the Data range box"), "Series": (1045, 531, 248, 236, "the Series list"),
   "Switch rows/columns": (1045, 823, 180, 24, "the Switch rows/columns tick box")},
   "The same chart with Switch rows/columns ticked: Morning, Lunch and Afternoon along the bottom, the stalls in the legend"),
 "titles": ("07_customise_chart_axis_titles", (1032, 110, 1325, 720), {**TABS,
   "Chart style": sec(160, "Chart style"), "Pie chart": sec(213, "Pie chart"), "Pie slice": sec(266, "Pie slice"), "Chart and axis titles": sec(320, "Chart and axis titles"),
   "title list": (1046, 367, 260, 40, "the list where you pick which title"), "Title text": (1046, 452, 260, 40, "the Title text box"),
   "Title font": (1046, 539, 131, 40, "the Title font list"), "Title font size": (1184, 539, 122, 40, "the Title font size list"),
   "Title format": (1046, 616, 94, 40, "the Title format buttons (bold, italic)"), "Title text colour": (1184, 616, 95, 40, "the Title text colour list"), "Legend": sec(682, "Legend")},
   "The chart editor's Customise tab with Chart and axis titles open: Chart title, Title text, font, size, format and colour"),
 "customise-pie": ("09_customise_legend", (1032, 110, 1325, 368), {**TABS,
   "Chart style": sec(160, "Chart style"), "Pie chart": sec(213, "Pie chart"), "Pie slice": sec(266, "Pie slice"), "Chart and axis titles": sec(320, "Chart and axis titles")},
   "The chart editor's Customise tab for a pie chart, every section closed: Chart style, Pie chart, Pie slice, Chart and axis titles"),
 "customise-column": ("12_customise_column_chart_all_closed", (1082, 106, 1360, 502), {
   "Setup": (1112, 111, 76, 30, "the Setup tab"), "Customise": (1240, 111, 92, 30, "the Customise tab"),
   **{n: (1098, y - 15, 250, 30, f"the {n} section") for n, y in [("Chart style", 167), ("Chart and axis titles", 217), ("Series", 269), ("Legend", 320),
      ("Horizontal axis", 372), ("Vertical axis", 422), ("Gridlines and ticks", 474)]}},
   "The chart editor's Customise tab for a column chart, every section closed: Chart style, Chart and axis titles, Series, Legend, Horizontal axis, Vertical axis, Gridlines and ticks"),
 "pie-slice": ("08a_customise_pie_slice_colour", (1032, 110, 1325, 432), {**TABS,
   "Chart style": sec(160, "Chart style"), "Pie chart": sec(213, "Pie chart"), "Pie slice": sec(266, "Pie slice"),
   "slice list": (1046, 313, 260, 40, "the list where you pick the slice"), "Colour": (1046, 393, 60, 34, "the Colour button")},
   "The chart editor's Customise tab with Pie slice open: the Cake stall slice is picked, with its Colour button"),
 "series-colour": ("08b_customise_series_colour", (1032, 110, 1325, 474), {**TABS,
   "Chart style": sec(160, "Chart style"), "Chart and axis titles": sec(213, "Chart and axis titles"), "Series": sec(266, "Series"),
   "series list": (1046, 314, 247, 40, "the list where you pick the series"), "Fill colour": (1046, 431, 123, 40, "the Fill colour button"),
   "Fill opacity": (1177, 431, 115, 40, "the Fill opacity list")},
   "The chart editor's Customise tab with Series open: the Lunch series is picked, with its Fill colour button"),
 "legend": ("09_customise_legend", (245, 110, 1325, 665), {**TABS,
   "chart title": (258, 335, 180, 28, "the chart title"), "chart legend": (686, 364, 98, 120, "the legend"), "pie": (330, 368, 278, 278, "the pie"),
   "Chart style": sec(160, "Chart style"), "Pie chart": sec(213, "Pie chart"), "Pie slice": sec(266, "Pie slice"), "Chart and axis titles": sec(320, "Chart and axis titles"), "Legend": sec(374, "Legend"),
   "Position": (1046, 444, 260, 40, "the Position list"), "Legend font": (1046, 529, 131, 40, "the Legend font list"), "Legend font size": (1184, 529, 122, 40, "the Legend font size list"),
   "Legend format": (1046, 606, 62, 40, "the Legend format buttons (bold, italic)"), "Text colour": (1184, 606, 95, 40, "the Text colour list")},
   "A pie chart, Fair Takings by Stall, with its legend on the right, and the chart editor's Customise tab with Legend open: Position, Legend font, Legend font size"),
 "chart-menu": ("10_chart_menu_move_to_own_sheet", (240, 316, 955, 665), {
   "chart title": (258, 335, 180, 28, "the chart title"), "Edit the chart": (769, 352, 177, 28, "Edit the chart"), "Delete chart": (769, 381, 177, 28, "Delete chart"),
   "Download chart": (769, 410, 177, 28, "Download chart"), "Publish the chart": (769, 439, 177, 28, "Publish the chart"), "Copy chart": (769, 468, 177, 28, "Copy chart"),
   "Move to own sheet": (769, 497, 177, 28, "Move to own sheet"), "Alt text": (769, 526, 177, 28, "Alt text")},
   "A pie chart with its ⋮ menu open: Edit the chart, Delete chart, Download chart, Publish the chart, Copy chart, Move to own sheet, Alt text"),
 "chart-selected": ("11_chart_selected_resize_handles", (232, 314, 805, 672), {
   "⋮": (765, 326, 24, 26, "the ⋮ button (the chart's menu)"),  # no top-right corner region: its tap area would cover ⋮ "chart title": (258, 335, 180, 28, "the chart title"), "legend": (686, 364, 98, 120, "the legend"),
   "chart": (300, 372, 360, 260, "the chart itself (grab it to move it)"), "corner": (780, 649, 20, 20, "the bottom-right corner handle"),
   "top-left corner": (238, 314, 20, 18, "the top-left corner handle"),
   "bottom-left corner": (238, 649, 20, 20, "the bottom-left corner handle"),
   "right edge": (780, 481, 20, 20, "the handle in the middle of the right edge"), "bottom edge": (509, 649, 20, 20, "the handle in the middle of the bottom edge")},
   "A selected pie chart with small square handles at its corners and edges, and ⋮ at the top right"),
}
args = sys.argv[1:]
preview = None
if "--preview" in args:
    i = args.index("--preview"); preview = Path(args[i + 1]); del args[i:i + 2]
    preview.mkdir(parents=True, exist_ok=True)
for name, (src, box, fix) in TOOLBAR.items():
    if args and name not in args:
        continue
    im = Image.open(SHEETS / src).convert("RGB")
    if fix:
        im = fix(im)
    if box:
        im = im.crop(box)
    im.save(OUT / f"{name}.webp", "WEBP", quality=90, method=6)
    print(f"saved {name}.webp ({im.width}×{im.height})", file=sys.stderr)
out = {}
for name, (src, box, regs, alt) in S.items():
    if args and name not in args:
        continue
    im = source(src).crop(box)
    im.save(OUT / f"{name}.webp", "WEBP", quality=86, method=6)
    x0, y0 = box[0], box[1]
    rr = {}
    pv = im.copy() if preview else None
    for k, (x, y, w, h, label) in regs.items():
        r = [x - x0, y - y0, w, h]
        assert r[0] >= 0 and r[1] >= 0 and r[0] + w <= im.width and r[1] + h <= im.height, (name, k, r, im.size)
        rr[k] = {"r": r, "label": label}
        if pv:
            ImageDraw.Draw(pv).rectangle([r[0], r[1], r[0] + w, r[1] + h], outline=(255, 0, 255), width=2)
    if pv:
        pv.save(preview / f"{name}.png")
    out[name] = {"src": f"assets/screens/{name}.webp", "w": im.width, "h": im.height, "alt": alt, "regions": rr}
print(json.dumps(out, ensure_ascii=False, indent=1))
