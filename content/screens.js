// Real Google Sheets screenshots used for "find it on screen" exercises.
// Regions are rectangles in the picture's own pixels: [x, y, width, height].
// Every region of a picture is a possible answer, so keep 5+ per picture.
// tools/check_content.mjs checks every region fits inside its picture.
export const screens = {
  "sheets-basic": {
    src: "assets/screens/sheets-basic.webp", w: 1088, h: 304,
    alt: "Google Sheets: the title, menus, toolbar, Name Box, formula bar and the top-left of the grid",
    regions: {
      title: { r: [80, 4, 206, 38], label: "the spreadsheet title" },
      menuFile: { r: [82, 36, 40, 32], label: "the File menu" },
      menuFormat: { r: [334, 36, 76, 32], label: "the Format menu" },
      undo: { r: [88, 90, 36, 38], label: "Undo" },
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
};
