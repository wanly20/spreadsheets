#!/usr/bin/env python3
"""Crop the real Google Sheets screenshots into assets/screens/*.webp.

    python3 tools/crop_screens.py            # every picture
    python3 tools/crop_screens.py legend     # just one (by name)
    python3 tools/crop_screens.py --preview DIR   # also save PNGs with every region drawn on, to check them

Reads ../spreadsheets/screenshots/google_sheets/menus/*.jpg (1335×896, Oct 2026; 12 is 1372×876; 13-18 are in an Australia-locale file). First removes the
hover highlights (and the cursor) that would give an answer away, then crops, saves WebP, and prints
the regions (in the crop's own pixels) as JSON for content/screens.js. Needs Pillow (system python3).
Regions are written below in the ORIGINAL screenshot's pixels: x, y, width, height, label.

Lessons 1-2 use shots 13-18 (a file with the locale set to Australia, so the currency button shows $):
sheets-basic and fill-handle (13), the menus and the settings window (14-18), and single toolbar buttons
from 13 (ICONS: ic-bold, ic-fontcolour, ic-fontsize, ic-fontfamily). SCALE enlarges a crop (and its
regions) so it shows as big as before. TOOLBAR crops more single buttons (ic-halign, ic-valign, ic-wrap)
from ../spreadsheets/screenshots/google_sheets/rest_of_ribbon.png for the learn cards.
"""
import json, os, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

APP = Path(__file__).resolve().parent.parent
SRC = APP.parent / "spreadsheets/screenshots/google_sheets/menus"
SHEETS = APP.parent / "spreadsheets/screenshots/google_sheets"


# name: (file in google_sheets/, crop box or None for the whole picture, fix or None)
TOOLBAR = {
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
    if name == "18_row_menu":  # Cut has a light keyboard-focus highlight
        unhover(im, (21, 222, 311, 251))
    return im

# Single toolbar buttons from shot 13 for the learn cards (enlarged 1.6×, like the old ones).
ICONS = {
    "ic-bold": (586, 63, 613, 91), "ic-fontcolour": (674, 62, 701, 92),
    "ic-fontsize": (497, 62, 580, 92), "ic-fontfamily": (402, 62, 494, 92),
}
SCALE = {"sheets-basic": 1.5, "fill-handle": 1.5, "tab-menu": 1.3, "row-menu": 1.15}

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
 # ---- Lessons 1-2 (shots 13-18, Australia locale)
 "sheets-basic": ("13_toolbar_australia_locale", (0, 0, 704, 207), {
   "title": (52, 8, 232, 26, "the spreadsheet title"), "menuFile": (53, 32, 28, 20, "the File menu"), "menuFormat": (214, 32, 48, 20, "the Format menu"),
   "undo": (56, 64, 26, 26, "Undo"), "redo": (85, 64, 26, 26, "Redo"), "print": (115, 64, 26, 26, "Print"), "paintFormat": (144, 64, 26, 26, "Paint format (the paint roller)"),
   "currency": (249, 64, 26, 26, "Format as currency ($)"), "percent": (278, 64, 26, 26, "Format as percent (%)"),
   "decDecrease": (307, 64, 26, 26, "Decrease decimal places (.0 ←)"), "decIncrease": (337, 64, 26, 26, "Increase decimal places (.00 →)"),
   "fontSize": (498, 64, 82, 26, "Font size"), "bold": (586, 64, 26, 26, "Bold"), "fontColour": (674, 64, 26, 26, "Font colour"),
   "nameBox": (4, 103, 86, 23, "the Name Box"), "formulaBar": (100, 103, 300, 23, "the formula bar"),
   "colC": (226, 130, 90, 19, "the header of column C"), "colE": (409, 130, 90, 19, "the header of column E"), "row2": (0, 169, 40, 18, "the header of row 2"),
   "cellC2": (226, 170, 80, 16, "cell C2"), "fillHandle": (308, 180, 16, 16, "the fill handle")},
   "Google Sheets: the title, menus, toolbar (its currency button shows $), Name Box, formula bar and the top-left of the grid, with C2 selected"),
 "fill-handle": ("13_toolbar_australia_locale", (182, 129, 409, 226), {
   "fillHandle": (306, 178, 20, 20, "the fill handle"), "cell": (226, 170, 80, 16, "the selected cell"), "colC": (226, 130, 90, 19, "the header of column C")},
   "A selected cell in Google Sheets with the round fill handle at its bottom-right corner"),
 "view-freeze": ("14_view_freeze", (118, 28, 654, 356), {
   "View": (125, 31, 32, 22, "the View menu"),
   **{n: (122, y - 14, 288, 28, f"{n}") for n, y in [("Show", 72), ("Freeze", 101), ("Group", 130), ("Comments", 159), ("Zoom", 247), ("Full screen", 276)]},
   **{n: (412, y - 14, 234, 28, n) for n, y in [("No rows", 108), ("1 row", 137), ("2 rows", 166), ("Up to row 2", 195),
      ("No columns", 238), ("1 column", 267), ("2 columns", 296), ("Up to column C", 325)]}},
   "View → Freeze open: No rows, 1 row, 2 rows, Up to row 2, No columns, 1 column, 2 columns, Up to column C"),
 # Format → Number is too tall to tap on a Chromebook in one piece: the money part (with the path) and the dates part.
 "format-number": ("15_format_number", (206, 28, 760, 401), {
   "Format": (215, 31, 47, 22, "the Format menu"),
   **{n: (212, y - 14, 288, 28, "Number (in the Format menu)" if n == "Number" else n) for n, y in [("Theme", 72), ("Number", 117), ("Text", 146), ("Alignment", 175),
      ("Wrapping", 204), ("Rotation", 233), ("Smart chips", 262), ("Font size", 306)]},
   **{"Number → Number" if n == "Number" else n: (502, y - 14, 252, 28, "Number (1,000.12)" if n == "Number" else n) for n, y in [("Automatic", 123), ("Plain text", 152),
      ("Number", 197), ("Percent", 226), ("Scientific", 255), ("Accounting", 299), ("Financial", 328), ("Currency", 357), ("Currency rounded", 386)]}},
   "Format → Number open: Automatic, Plain text, Number, Percent, Scientific, Accounting, Financial, Currency ($1,000.12), Currency rounded ($1,000)"),
 "format-number-dates": ("15_format_number", (206, 349, 760, 720), {
   **{n: (212, y - 14, 288, 28, n) for n, y in [("Conditional formatting", 408), ("Alternating colours", 437), ("Clear formatting", 481)]},
   "Currency": (502, 349, 252, 22, "Currency"),
   **{n: (502, y - 14, 252, 28, n) for n, y in [("Currency rounded", 386), ("Date", 430), ("Time", 459), ("Date time", 488), ("Duration", 517),
      ("Friday, 26 September 2008", 561), ("26 September 2008", 590), ("Custom currency", 635), ("Custom date and time", 664), ("Custom number format", 693)]}},
   "The lower part of Format → Number: Currency, Currency rounded, Date (26/09/2008), Time, Date time, Duration, Friday, 26 September 2008, 26 September 2008, Custom currency, Custom date and time, Custom number format"),
 "settings-locale": ("16_settings_locale_australia", (342, 233, 993, 663), {
   "Close": (940, 253, 30, 30, "the close button (×)"), "General": (365, 297, 122, 32, "the General tab"), "Calculation": (500, 297, 124, 32, "the Calculation tab"),
   "Locale": (367, 373, 89, 36, "the Locale list"), "Time zone": (367, 472, 192, 37, "the Time zone list"),
   "Display language": (365, 548, 192, 32, "Display language"), "Cancel": (745, 607, 88, 34, "the Cancel button"), "Save settings": (843, 607, 128, 34, "the Save settings button")},
   "The settings window for this spreadsheet, General tab: Locale Australia, Time zone, Display language, Cancel and Save settings"),
 "tab-menu": ("17_sheet_tab_menu", (32, 543, 276, 896), {
   **{n: (122, y - 14, 147, 28, n) for n, y in [("Delete", 567), ("Duplicate", 596), ("Copy to", 625), ("Rename", 654), ("Change colour", 683),
      ("Protect the sheet", 712), ("Hide sheet", 741), ("Move right", 813), ("Move left", 842)]},
   "+": (42, 866, 26, 28, "the + button"), "Data tab": (122, 866, 72, 28, "the Data tab"), "Notes tab": (197, 866, 68, 28, "the Notes tab")},
   "The menu for the Data sheet tab, with the Notes tab beside it: Delete, Duplicate, Copy to, Rename, Change colour, Protect the sheet, Hide sheet, View comments, Move right, Move left (grey)"),
 "row-menu": ("18_row_menu", (0, 128, 316, 541), {  # down to Resize the row: the whole menu is too tall to tap on a Chromebook
   **{n: (21, y - 14, 289, 28, n) for n, y in [("Cut", 236), ("Copy", 265), ("Paste", 294), ("Paste special", 323), ("Insert 1 row above", 367),
      ("Insert 1 row below", 396), ("Delete row", 425), ("Clear row", 454), ("Hide row", 483), ("Resize the row", 512)]}},
   "The menu for row 4 (right-click its row number): Cut, Copy, Paste, Paste special, Insert 1 row above, Insert 1 row below, Delete row, Clear row, Hide row, Resize the row"),
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
for name, box in ICONS.items():
    if args and name not in args:
        continue
    im = source("13_toolbar_australia_locale").crop(box)
    im = im.resize((round(im.width * 1.6), round(im.height * 1.6)), Image.LANCZOS)
    im.save(OUT / f"{name}.webp", "WEBP", quality=90, method=6)
    print(f"saved {name}.webp ({im.width}×{im.height})", file=sys.stderr)
out = {}
for name, (src, box, regs, alt) in S.items():
    if args and name not in args:
        continue
    im = source(src).crop(box)
    k = SCALE.get(name, 1)
    if k != 1:
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    im.save(OUT / f"{name}.webp", "WEBP", quality=86, method=6)
    x0, y0 = box[0], box[1]
    rr = {}
    pv = im.copy() if preview else None
    for key, (x, y, w, h, label) in regs.items():
        r = [round((x - x0) * k), round((y - y0) * k), round(w * k), round(h * k)]
        assert r[0] >= 0 and r[1] >= 0 and r[0] + r[2] <= im.width and r[1] + r[3] <= im.height, (name, key, r, im.size)
        rr[key] = {"r": r, "label": label}
        if pv:
            ImageDraw.Draw(pv).rectangle([r[0], r[1], r[0] + r[2], r[1] + r[3]], outline=(255, 0, 255), width=2)
    if pv:
        pv.save(preview / f"{name}.png")
    out[name] = {"src": f"assets/screens/{name}.webp", "w": im.width, "h": im.height, "alt": alt, "regions": rr}
print(json.dumps(out, ensure_ascii=False, indent=1))
