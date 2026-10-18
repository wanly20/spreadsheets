// Real Google Sheets screenshots used for "find it on screen" exercises.
// Regions are rectangles in the picture's own pixels: [x, y, width, height].
// Every region of a picture is a possible answer, so keep 5+ per picture.
// tools/check_content.mjs checks every region fits inside its picture.
//
// DRAWN STAND-INS (at the end): pictures we haven't photographed yet are drawn by the app
// from `drawn` (a visual spec, see js/visuals.js). To swap one for a real screenshot:
//   1. save it as assets/screens/<the entry's name>.webp (docs/SCREENSHOTS_WANTED.md lists them all),
//   2. replace that entry's `drawn: {…}` with src, w, h and regions, naming each region exactly
//      as the drawn picture names its parts (`hits` in the comment above the entry), e.g.
//        "chart-menu": { src: "assets/screens/chart-menu.webp", w: 400, h: 300, alt: "…",
//          regions: { "Edit chart": { r: [x, y, w, h], label: "Edit chart" }, … } },
//   3. run node tools/check_content.mjs: it says if an exercise names a region the picture lacks.
// Nothing in content/practice.js needs to change.
// The School Fair takings (as in the slides), for the drawn stand-ins below.
const FAIR = { cols: 5, rows: 9, widths: { A: 1.5, D: 1.2 }, style: { A1: { b: 1 }, A3: { b: 1 }, B3: { b: 1 }, C3: { b: 1 }, D3: { b: 1 }, E3: { b: 1 } }, cells: { A1: "School Fair Takings", A3: "Stall", B3: "Morning", C3: "Lunch", D3: "Afternoon", E3: "Total" } };
[["Book swap", 25, 10, 30, 65], ["Cake stall", 85, 40, 120, 245], ["Face painting", 40, 25, 55, 120], ["Lemonade", 70, 45, 95, 210], ["Plant stall", 20, 10, 20, 50], ["Raffle", 60, 30, 75, 165]]
  .forEach((r, i) => r.forEach((v, c) => { FAIR.cells[`${"ABCDE"[c]}${i + 4}`] = v; }));

export const screens = {
  "sheets-basic": {
    src: "assets/screens/sheets-basic.webp", w: 1088, h: 304,
    alt: "Google Sheets: the title, menus, toolbar, Name Box, formula bar and the top-left of the grid",
    regions: {
      title: { r: [80, 4, 206, 38], label: "the spreadsheet title" },
      menuFile: { r: [82, 36, 40, 32], label: "the File menu" },
      menuFormat: { r: [334, 36, 76, 32], label: "the Format menu" },
      undo: { r: [88, 90, 36, 38], label: "Undo" },
      print: { r: [176, 90, 38, 38], label: "Print" },
      paintFormat: { r: [220, 90, 38, 38], label: "Paint format (the paint roller)" },
      redo: { r: [132, 90, 36, 38], label: "Redo" },
      bold: { r: [910, 90, 38, 38], label: "Bold" },
      fontColour: { r: [1044, 90, 38, 38], label: "Font colour" },
      fontSize: { r: [766, 90, 132, 38], label: "Font size" },
      nameBox: { r: [2, 152, 140, 34], label: "the Name Box" },
      formulaBar: { r: [158, 152, 330, 34], label: "the formula bar" },
      colC: { r: [350, 190, 144, 32], label: "the header of column C" },
      colE: { r: [638, 190, 144, 32], label: "the header of column E" },
      row2: { r: [0, 253, 62, 31], label: "the header of row 2" },
      cellC2: { r: [352, 255, 128, 26], label: "cell C2" },
      fillHandle: { r: [482, 271, 24, 24], label: "the fill handle" },
      percent: { r: [430, 90, 38, 38], label: "Format as percent (%)" },
      decDecrease: { r: [475, 90, 38, 38], label: "Decrease decimal places (.0 ←)" },
      decIncrease: { r: [521, 90, 38, 38], label: "Increase decimal places (.00 →)" },
    },
  },
  "fill-handle": {
    src: "assets/screens/fill-handle.webp", w: 340, h: 146,
    alt: "A selected cell in Google Sheets with the round fill handle at its bottom-right corner",
    regions: {
      fillHandle: { r: [182, 112, 24, 24], label: "the fill handle" },
      cell: { r: [52, 96, 138, 26], label: "the selected cell" },
      colC: { r: [50, 30, 144, 32], label: "the header of column C" },
    },
  },
  "merge-button": {
    src: "assets/screens/merge-button.webp", w: 128, h: 68,
    alt: "The merge cells button, grey because fewer than two cells are selected",
    regions: { merge: { r: [10, 10, 70, 48], label: "Merge cells" }, menu: { r: [84, 14, 34, 40], label: "the merge menu arrow" } },
  },
  "sheets-ribbon": {
    src: "assets/screens/sheets-ribbon.webp", w: 700, h: 54,
    alt: "The right-hand end of the Google Sheets toolbar",
    regions: {
      fillColour: { r: [2, 4, 42, 46], label: "Fill colour" },
      borders: { r: [50, 4, 42, 46], label: "Borders" },
      merge: { r: [100, 4, 62, 46], label: "Merge cells" },
      hAlign: { r: [168, 4, 54, 46], label: "Horizontal align" },
      vAlign: { r: [228, 4, 54, 46], label: "Vertical align" },
      wrap: { r: [288, 4, 54, 46], label: "Text wrapping" },
      rotate: { r: [348, 4, 54, 46], label: "Text rotation" },
      link: { r: [410, 4, 40, 46], label: "Insert link" },
      chart: { r: [500, 4, 40, 46], label: "Insert chart" },
    },
  },
  "border-menu": {
    src: "assets/screens/border-menu.webp", w: 412, h: 210,
    alt: "The Google Sheets borders menu",
    regions: {
      all: { r: [64, 42, 40, 40], label: "All borders" },
      inner: { r: [119, 42, 40, 40], label: "Inner borders" },
      outer: { r: [277, 42, 40, 40], label: "Outer borders (the outer box)" },
      left: { r: [64, 94, 40, 40], label: "Left border" },
      bottom: { r: [222, 94, 40, 40], label: "Bottom border" },
      colour: { r: [346, 42, 56, 40], label: "Border colour (the pencil)" },
      style: { r: [346, 88, 56, 40], label: "Border style (thickness)" },
    },
  },

  // ================================================================ Lessons 6 and 7: menus, the sort window, charts
  // Cropped from ../spreadsheets/screenshots/google_sheets/menus/ by tools/crop_screens.py (Oct 2026,
  // UK/AU locale: "Customise", "Fill colour"). Anything that would give an answer away is cleaned
  // first: the hover on Insert → Chart and on ⋮ → Edit the chart, and the blue "chosen" border on the
  // column chart in the Chart type list. A question that asks which section to open uses
  // customise-pie or customise-column, where every section is still closed.
  "menu-bar": {
    src: "assets/screens/menu-bar.webp", w: 420, h: 28,
    alt: "The Google Sheets menu bar: File, Edit, View, Insert, Format, Data, Tools, Extensions, Help",
    regions: {
      "File": { r: [4, 3, 26, 22], label: "the File menu" },
      "Edit": { r: [38, 3, 28, 22], label: "the Edit menu" },
      "View": { r: [75, 3, 32, 22], label: "the View menu" },
      "Insert": { r: [117, 3, 40, 22], label: "the Insert menu" },
      "Format": { r: [165, 3, 47, 22], label: "the Format menu" },
      "Data": { r: [221, 3, 32, 22], label: "the Data menu" },
      "Tools": { r: [263, 3, 36, 22], label: "the Tools menu" },
      "Extensions": { r: [309, 3, 66, 22], label: "the Extensions menu" },
      "Help": { r: [385, 3, 32, 22], label: "the Help menu" },
    },
  },
  "data-menu": {
    src: "assets/screens/data-menu.webp", w: 565, h: 352,
    alt: "Google Sheets with the Data menu open: Sort sheet, Sort range, Create a filter and more",
    regions: {
      "Sort sheet": { r: [268, 31, 288, 28], label: "Sort sheet" },
      "Sort range": { r: [268, 60, 288, 28], label: "Sort range" },
      "Create a filter": { r: [268, 104, 288, 28], label: "Create a filter" },
      "Create group by view": { r: [268, 133, 288, 28], label: "Create group by view" },
      "Create filter view": { r: [268, 162, 288, 28], label: "Create filter view" },
      "Add a slicer": { r: [268, 191, 288, 28], label: "Add a slicer" },
      "Protect sheets and ranges": { r: [268, 235, 288, 28], label: "Protect sheets and ranges" },
      "Named ranges": { r: [268, 264, 288, 28], label: "Named ranges" },
      "Randomise range": { r: [268, 322, 288, 28], label: "Randomise range" },
    },
  },
  "data-menu-sort-range": {
    src: "assets/screens/data-menu-sort-range.webp", w: 538, h: 203,
    alt: "Data → Sort range open: sort by column A (A to Z), (Z to A), and Advanced range sorting options",
    regions: {
      "Sort sheet": { r: [6, 7, 288, 28], label: "Sort sheet" },
      "Sort range": { r: [6, 36, 288, 28], label: "Sort range" },
      "Create a filter": { r: [6, 80, 288, 28], label: "Create a filter" },
      "Create filter view": { r: [6, 138, 288, 28], label: "Create filter view" },
      "Add a slicer": { r: [6, 167, 288, 28], label: "Add a slicer" },
      "A to Z": { r: [297, 42, 234, 28], label: "Sort range by column A (A to Z)" },
      "Z to A": { r: [297, 71, 234, 28], label: "Sort range by column A (Z to A)" },
      "Advanced range sorting options": { r: [297, 114, 234, 30], label: "Advanced range sorting options" },
    },
  },
  "sort-window": {
    src: "assets/screens/sort-window.webp", w: 464, h: 349,
    alt: "The sort window: Sort range from A3 to E9, Data has header row ticked, Sort by Stall A to Z, then by Morning A to Z, Add another sort column, Cancel and Sort",
    regions: {
      "Close": { r: [410, 18, 32, 30], label: "the close button (×)" },
      "Data has header row": { r: [17, 57, 160, 26], label: "the Data has header row box" },
      "Sort by": { r: [69, 103, 61, 36], label: "the Sort by list" },
      "A to Z": { r: [188, 107, 66, 28], label: "A to Z (on the Sort by row)" },
      "Z to A": { r: [262, 107, 66, 28], label: "Z to A (on the Sort by row)" },
      "then by": { r: [69, 170, 82, 38], label: "the then by list" },
      "then A to Z": { r: [188, 175, 66, 28], label: "A to Z (on the then by row)" },
      "then Z to A": { r: [262, 175, 66, 28], label: "Z to A (on the then by row)" },
      "Delete": { r: [410, 175, 30, 30], label: "the bin (delete this sort column)" },
      "Add another sort column": { r: [20, 237, 199, 36], label: "Add another sort column" },
      "Cancel": { r: [270, 292, 90, 35], label: "the Cancel button" },
      "Sort": { r: [368, 292, 75, 35], label: "the Sort button" },
    },
  },
  "insert-menu": {
    src: "assets/screens/insert-menu.webp", w: 460, h: 352,
    alt: "Google Sheets with the Insert menu open: Cells, Rows, Columns, Sheet, Pre-built tables, Timeline, Chart, Pivot table, Image, Drawing",
    regions: {
      "Cells": { r: [165, 31, 288, 28], label: "Cells" },
      "Rows": { r: [165, 60, 288, 28], label: "Rows" },
      "Columns": { r: [165, 89, 288, 28], label: "Columns" },
      "Sheet": { r: [165, 118, 288, 28], label: "Sheet" },
      "Pre-built tables": { r: [165, 162, 288, 28], label: "Pre-built tables" },
      "Timeline": { r: [165, 205, 288, 28], label: "Timeline" },
      "Chart": { r: [165, 234, 288, 28], label: "Chart" },
      "Pivot table": { r: [165, 263, 288, 28], label: "Pivot table" },
      "Image": { r: [165, 292, 288, 28], label: "Image" },
      "Drawing": { r: [165, 321, 288, 28], label: "Drawing" },
    },
  },
  "chart-type": {
    src: "assets/screens/chart-type.webp", w: 278, h: 380,
    alt: "The chart editor, Setup tab, with the Chart type list open: suggested charts (column, pie, area, bar)",
    regions: {
      "Setup": { r: [30, 57, 76, 30], label: "the Setup tab" },
      "Customise": { r: [164, 57, 92, 30], label: "the Customise tab" },
      "Chart type": { r: [13, 126, 262, 40], label: "the Chart type list" },
      "column": { r: [14, 204, 122, 84], label: "the column chart" },
      "pie": { r: [139, 204, 122, 84], label: "the pie chart" },
      "area": { r: [14, 291, 122, 84], label: "the area chart" },
      "bar": { r: [139, 291, 122, 84], label: "the bar chart" },
    },
  },
  "setup-column": {
    src: "assets/screens/setup-column.webp", w: 1085, h: 685,
    alt: "A column chart of Morning, Lunch and Afternoon for each stall, and the chart editor's Setup tab with Switch rows/columns not ticked",
    regions: {
      "Setup": { r: [822, 7, 76, 30], label: "the Setup tab" },
      "Customise": { r: [956, 7, 92, 30], label: "the Customise tab" },
      "chart title": { r: [18, 225, 262, 28], label: "the chart title" },
      "legend": { r: [172, 254, 216, 22], label: "the legend" },
      "columns": { r: [48, 282, 488, 210], label: "the columns" },
      "Chart type": { r: [805, 76, 262, 40], label: "the Chart type list" },
      "Stacking": { r: [805, 152, 262, 40], label: "the Stacking list" },
      "Data range": { r: [805, 232, 262, 26], label: "the Data range box" },
      "X-axis": { r: [805, 302, 262, 34], label: "the X-axis box" },
      "Aggregate": { r: [805, 351, 120, 24], label: "the Aggregate tick box" },
      "Series": { r: [805, 421, 262, 114], label: "the Series list" },
      "Add Series": { r: [805, 541, 262, 34], label: "Add Series" },
      "Switch rows/columns": { r: [805, 594, 180, 24], label: "the Switch rows/columns tick box" },
      "Use row 3 as headers": { r: [805, 622, 180, 24], label: "the Use row 3 as headers tick box" },
      "Use column A as labels": { r: [805, 649, 180, 24], label: "the Use column A as labels tick box" },
    },
  },
  "setup-switched": {
    src: "assets/screens/setup-switched.webp", w: 1085, h: 742,
    alt: "The same chart with Switch rows/columns ticked: Morning, Lunch and Afternoon along the bottom, the stalls in the legend",
    regions: {
      "Setup": { r: [822, 7, 76, 30], label: "the Setup tab" },
      "Customise": { r: [956, 7, 92, 30], label: "the Customise tab" },
      "chart title": { r: [18, 225, 262, 28], label: "the chart title" },
      "legend": { r: [444, 254, 100, 120], label: "the legend" },
      "columns": { r: [60, 260, 378, 232], label: "the columns" },
      "Chart type": { r: [805, 76, 248, 40], label: "the Chart type list" },
      "Data range": { r: [805, 232, 248, 26], label: "the Data range box" },
      "Series": { r: [805, 421, 248, 236], label: "the Series list" },
      "Switch rows/columns": { r: [805, 713, 180, 24], label: "the Switch rows/columns tick box" },
    },
  },
  "titles": {
    src: "assets/screens/titles.webp", w: 293, h: 610,
    alt: "The chart editor's Customise tab with Chart and axis titles open: Chart title, Title text, font, size, format and colour",
    regions: {
      "Setup": { r: [30, 7, 76, 30], label: "the Setup tab" },
      "Customise": { r: [164, 7, 92, 30], label: "the Customise tab" },
      "Chart style": { r: [16, 50, 250, 30], label: "the Chart style section" },
      "Pie chart": { r: [16, 103, 250, 30], label: "the Pie chart section" },
      "Pie slice": { r: [16, 156, 250, 30], label: "the Pie slice section" },
      "Chart and axis titles": { r: [16, 210, 250, 30], label: "the Chart and axis titles section" },
      "title list": { r: [14, 257, 260, 40], label: "the list where you pick which title" },
      "Title text": { r: [14, 342, 260, 40], label: "the Title text box" },
      "Title font": { r: [14, 429, 131, 40], label: "the Title font list" },
      "Title font size": { r: [152, 429, 122, 40], label: "the Title font size list" },
      "Title format": { r: [14, 506, 94, 40], label: "the Title format buttons (bold, italic)" },
      "Title text colour": { r: [152, 506, 95, 40], label: "the Title text colour list" },
      "Legend": { r: [16, 572, 250, 30], label: "the Legend section" },
    },
  },
  "customise-pie": {
    src: "assets/screens/customise-pie.webp", w: 293, h: 258,
    alt: "The chart editor's Customise tab for a pie chart, every section closed: Chart style, Pie chart, Pie slice, Chart and axis titles",
    regions: {
      "Setup": { r: [30, 7, 76, 30], label: "the Setup tab" },
      "Customise": { r: [164, 7, 92, 30], label: "the Customise tab" },
      "Chart style": { r: [16, 50, 250, 30], label: "the Chart style section" },
      "Pie chart": { r: [16, 103, 250, 30], label: "the Pie chart section" },
      "Pie slice": { r: [16, 156, 250, 30], label: "the Pie slice section" },
      "Chart and axis titles": { r: [16, 210, 250, 30], label: "the Chart and axis titles section" },
    },
  },
  "customise-column": {
    src: "assets/screens/customise-column.webp", w: 278, h: 396,
    alt: "The chart editor's Customise tab for a column chart, every section closed: Chart style, Chart and axis titles, Series, Legend, Horizontal axis, Vertical axis, Gridlines and ticks",
    regions: {
      "Setup": { r: [30, 5, 76, 30], label: "the Setup tab" },
      "Customise": { r: [158, 5, 92, 30], label: "the Customise tab" },
      "Chart style": { r: [16, 46, 250, 30], label: "the Chart style section" },
      "Chart and axis titles": { r: [16, 96, 250, 30], label: "the Chart and axis titles section" },
      "Series": { r: [16, 148, 250, 30], label: "the Series section" },
      "Legend": { r: [16, 199, 250, 30], label: "the Legend section" },
      "Horizontal axis": { r: [16, 251, 250, 30], label: "the Horizontal axis section" },
      "Vertical axis": { r: [16, 301, 250, 30], label: "the Vertical axis section" },
      "Gridlines and ticks": { r: [16, 353, 250, 30], label: "the Gridlines and ticks section" },
    },
  },
  "pie-slice": {
    src: "assets/screens/pie-slice.webp", w: 293, h: 322,
    alt: "The chart editor's Customise tab with Pie slice open: the Cake stall slice is picked, with its Colour button",
    regions: {
      "Setup": { r: [30, 7, 76, 30], label: "the Setup tab" },
      "Customise": { r: [164, 7, 92, 30], label: "the Customise tab" },
      "Chart style": { r: [16, 50, 250, 30], label: "the Chart style section" },
      "Pie chart": { r: [16, 103, 250, 30], label: "the Pie chart section" },
      "Pie slice": { r: [16, 156, 250, 30], label: "the Pie slice section" },
      "slice list": { r: [14, 203, 260, 40], label: "the list where you pick the slice" },
      "Colour": { r: [14, 283, 60, 34], label: "the Colour button" },
    },
  },
  "series-colour": {
    src: "assets/screens/series-colour.webp", w: 293, h: 364,
    alt: "The chart editor's Customise tab with Series open: the Lunch series is picked, with its Fill colour button",
    regions: {
      "Setup": { r: [30, 7, 76, 30], label: "the Setup tab" },
      "Customise": { r: [164, 7, 92, 30], label: "the Customise tab" },
      "Chart style": { r: [16, 50, 250, 30], label: "the Chart style section" },
      "Chart and axis titles": { r: [16, 103, 250, 30], label: "the Chart and axis titles section" },
      "Series": { r: [16, 156, 250, 30], label: "the Series section" },
      "series list": { r: [14, 204, 247, 40], label: "the list where you pick the series" },
      "Fill colour": { r: [14, 321, 123, 40], label: "the Fill colour button" },
      "Fill opacity": { r: [145, 321, 115, 40], label: "the Fill opacity list" },
    },
  },
  "legend": {
    src: "assets/screens/legend.webp", w: 1080, h: 555,
    alt: "A pie chart, Fair Takings by Stall, with its legend on the right, and the chart editor's Customise tab with Legend open: Position, Legend font, Legend font size",
    regions: {
      "Setup": { r: [817, 7, 76, 30], label: "the Setup tab" },
      "Customise": { r: [951, 7, 92, 30], label: "the Customise tab" },
      "chart title": { r: [13, 225, 180, 28], label: "the chart title" },
      "chart legend": { r: [441, 254, 98, 120], label: "the legend" },
      "pie": { r: [85, 258, 278, 278], label: "the pie" },
      "Chart style": { r: [803, 50, 250, 30], label: "the Chart style section" },
      "Pie chart": { r: [803, 103, 250, 30], label: "the Pie chart section" },
      "Pie slice": { r: [803, 156, 250, 30], label: "the Pie slice section" },
      "Chart and axis titles": { r: [803, 210, 250, 30], label: "the Chart and axis titles section" },
      "Legend": { r: [803, 264, 250, 30], label: "the Legend section" },
      "Position": { r: [801, 334, 260, 40], label: "the Position list" },
      "Legend font": { r: [801, 419, 131, 40], label: "the Legend font list" },
      "Legend font size": { r: [939, 419, 122, 40], label: "the Legend font size list" },
      "Legend format": { r: [801, 496, 62, 40], label: "the Legend format buttons (bold, italic)" },
      "Text colour": { r: [939, 496, 95, 40], label: "the Text colour list" },
    },
  },
  "chart-menu": {
    src: "assets/screens/chart-menu.webp", w: 715, h: 349,
    alt: "A pie chart with its ⋮ menu open: Edit the chart, Delete chart, Download chart, Publish the chart, Copy chart, Move to own sheet, Alt text",
    regions: {
      "chart title": { r: [18, 19, 180, 28], label: "the chart title" },
      "Edit the chart": { r: [529, 36, 177, 28], label: "Edit the chart" },
      "Delete chart": { r: [529, 65, 177, 28], label: "Delete chart" },
      "Download chart": { r: [529, 94, 177, 28], label: "Download chart" },
      "Publish the chart": { r: [529, 123, 177, 28], label: "Publish the chart" },
      "Copy chart": { r: [529, 152, 177, 28], label: "Copy chart" },
      "Move to own sheet": { r: [529, 181, 177, 28], label: "Move to own sheet" },
      "Alt text": { r: [529, 210, 177, 28], label: "Alt text" },
    },
  },
  "chart-selected": {
    src: "assets/screens/chart-selected.webp", w: 573, h: 358,
    alt: "A selected pie chart with small square handles at its corners and edges, and ⋮ at the top right",
    regions: {
      "⋮": { r: [533, 12, 24, 26], label: "the ⋮ button (the chart's menu)" },
      "chart": { r: [68, 58, 360, 260], label: "the chart itself (grab it to move it)" },
      "corner": { r: [548, 335, 20, 20], label: "the bottom-right corner handle" },
      "top-left corner": { r: [6, 0, 20, 18], label: "the top-left corner handle" },
      "bottom-left corner": { r: [6, 335, 20, 20], label: "the bottom-left corner handle" },
      "right edge": { r: [548, 167, 20, 20], label: "the handle in the middle of the right edge" },
      "bottom edge": { r: [277, 335, 20, 20], label: "the handle in the middle of the bottom edge" },
    },
  },

  // ================================================================ drawn stand-ins
  // Not photographed yet (docs/SCREENSHOTS_WANTED.md). Shown in learn cards and questions only,
  // never tapped, so a screenshot needs no regions: just src, w, h and alt.
  // The School Fair takings with A3:A9 and E3:E9 both selected (Ctrl).
  "two-ranges": { drawn: { grid: { ...FAIR, sel: "E3:E9", also: ["A3:A9"] } }, alt: "The School Fair table with A3:A9 (the stalls) and E3:E9 (the totals) selected; B, C and D are not" },
  // The sheet tabs after ⋮ → Move to own sheet: the chart's new tab, Chart1, is open.
  "own-sheet-tab": { drawn: { tabs: { tabs: ["Takings", "Chart1"], active: 1 } }, alt: "The sheet tabs: Takings, and a new tab called Chart1, which is open" },
  // A new chart sitting on top of the table, hiding the numbers.
  "chart-over-data": { drawn: { chartOnSheet: { grid: { ...FAIR, cols: 3, widths: { A: 1.5 } }, at: "over" } }, alt: "A pie chart sitting on top of the table, covering the numbers" },
  "chart-beside-data": { drawn: { chartOnSheet: { grid: { ...FAIR, cols: 3, widths: { A: 1.5 } }, at: "beside" } }, alt: "The table, with the pie chart beside it" },
};
