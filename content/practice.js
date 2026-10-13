// Extra practice for each knowledge item, keyed by its exact `term`.
//
// The term and definition always come from knowledge_lessonN.js (never copied
// here). This file adds: a picture for the learn card, and exercises beyond the
// automatic "term ↔ definition" questions every item gets.
//
// Every exercise names a `fact`: a short phrase that must appear in the item's
// definition. tools/check_content.mjs stops if it doesn't, so an exercise can
// never drift away from (or contradict) the definition when the spreadsheet changes.
//
// Exercise types (see js/exercises.js):
//   choice     prompt + visual? + correct + wrong[]           (options are shuffled)
//   gridClick  click a cell / column header / row header / the fill handle
//   gridName   a cell is highlighted: type its reference
//   gridRange  drag to select a range
//   rangeName  a range is highlighted: type it
//   fill       predict what the fill handle makes (answers are worked out, then animated)
//   gridMove   drag a cell to a new place
//   keys       press the real shortcut (multiple choice on touch screens)
//   hotspot    tap something on a real screenshot (`screen`) or a drawn part of Sheets (`ui`)
//   order      put the steps in order
// Grid targets can be a list: one is picked at random each time.

const shop = { A1: "Item", B1: "Price", C1: "Qty", D1: "Total", A2: "Pen", B2: 2, C2: 3, D2: 6, A3: "Ruler", B3: 3, C3: 2, D3: 6 };

export const practice = {
  // ======================================================= Lesson 1
  spreadsheet: {
    learn: { visual: { grid: { cols: 4, rows: 4, cells: shop, sel: "D2", nameBox: true, formula: "=B2*C2" } }, note: "You typed the Price and the Qty. The spreadsheet worked out the Total in D2 by itself." },
    exercises: [
      { type: "choice", fact: "calculates for you", prompt: "The Pen costs $2 and you buy 3. You didn't type anything in D2. What does the spreadsheet show there?",
        visual: { grid: { cols: 4, rows: 3, cells: { ...shop, D2: "?", A3: "", B3: "", C3: "", D3: "" }, sel: "D2" } },
        correct: "6: it calculates it for you", wrong: ["Nothing: you have to type it", "23", "5"] },
    ],
  },
  cell: {
    learn: { visual: { grid: { cols: 5, rows: 5, sel: "C3" } } },
    exercises: [
      { type: "choice", fact: "One box", prompt: "What is one box in the grid called?", visual: { grid: { cols: 5, rows: 5, sel: "B4" } },
        correct: "A cell", wrong: ["A row", "A column", "A range"] },
    ],
  },
  column: {
    learn: { visual: { grid: { cols: 5, rows: 5, sel: "C:C" } }, note: "Columns go down. Their letters are along the top." },
    exercises: [
      { type: "choice", fact: "going down", prompt: "What is highlighted?", visual: { grid: { cols: 5, rows: 5, sel: "B:B" } },
        correct: "A column", wrong: ["A row", "A cell", "A sheet"] },
      { type: "gridClick", fact: "Named with a letter", target: ["col:D", "col:B", "col:E"] },
      { type: "choice", fact: "Named with a letter", prompt: "How are columns named?", correct: "With letters: A, B, C…", wrong: ["With numbers: 1, 2, 3…", "With colours", "With cell references, like C5"] },
    ],
  },
  row: {
    learn: { visual: { grid: { cols: 5, rows: 5, sel: "3:3" } }, note: "Rows go across. Their numbers are down the side." },
    exercises: [
      { type: "choice", fact: "going across", prompt: "What is highlighted?", visual: { grid: { cols: 5, rows: 5, sel: "4:4" } },
        correct: "A row", wrong: ["A column", "A cell", "A range of columns"] },
      { type: "gridClick", fact: "Named with a number", target: ["row:4", "row:2", "row:5"] },
    ],
  },
  "cell reference": {
    learn: { visual: { grid: { cols: 5, rows: 6, sel: "C5", nameBox: true } }, note: "Across the top first, then down: like a grid reference on a map." },
    exercises: [
      { type: "gridClick", fact: "column letter first", target: ["C5", "B3", "E2", "D6", "A4"] },
      { type: "gridName", fact: "column letter first", target: ["D3", "B5", "E2", "C4", "A6"] },
      { type: "choice", fact: "Never 5C", prompt: "Column C, row 5. Which is the right way to write it?", correct: "C5", wrong: ["5C", "C-5", "5:C"] },
    ],
  },
  // ------------------------------------------------------- level 2
  range: {
    learn: { visual: { grid: { cols: 5, rows: 7, sel: "C2:C7", nameBox: true } }, note: "Say it as “C2 to C7”." },
    exercises: [
      { type: "gridRange", fact: "first cell : last cell", target: ["C2:C6", "B2:B5", "B3:E3", "A2:D2"] },
      { type: "rangeName", fact: "first cell : last cell", target: ["B2:B6", "B4:E4", "C2:C5", "A3:D3"] },
      { type: "choice", fact: "The colon means \"to\"", prompt: "In C2:C7, what does the colon ( : ) mean?",
        correct: "“to”: C2 to C7, and every cell between", wrong: ["“and”: just C2 and C7", "“times”: C2 × C7", "“minus”: C2 − C7"] },
    ],
  },
  "Name Box": {
    learn: { visual: { image: "sheets-basic", highlight: "nameBox" }, note: "Type E2 in the Name Box, press Enter, and you jump straight to E2." },
    exercises: [
      { type: "hotspot", fact: "top-left", screen: "sheets-basic", target: "nameBox", prompt: "Tap the Name Box." },
      { type: "order", fact: "press Enter to jump there", prompt: "Put the steps in order to jump to cell E2.",
        steps: ["Click in the Name Box", "Type E2", "Press Enter"] },
      { type: "keys", fact: "press Enter", prompt: "You typed F10 in the Name Box. Press the key that jumps there!", combo: "enter", label: "Enter", wrong: ["Delete", "Ctrl + Z", "Space"],
        scene: { grid: { cols: 5, rows: 4, sel: "B2", nameBox: "F10" } } },
    ],
  },
  "fill handle": {
    learn: { visual: { image: "fill-handle" }, note: "In Google Sheets it is a small blue circle. Excel and LibreOffice use a small square." },
    exercises: [
      { type: "hotspot", fact: "bottom-right corner", screen: "sheets-basic", target: "fillHandle", prompt: "Tap the fill handle." },
      { type: "gridClick", fact: "bottom-right corner", target: "handle", prompt: "Grab the fill handle of the selected cell.", grid: { cols: 5, rows: 5, sel: "B2", cells: { B2: 5 } } },
      { type: "choice", fact: "a circle in Google Sheets", prompt: "What does the fill handle look like in Google Sheets?",
        correct: "A small circle", wrong: ["A small triangle", "A plus sign at the top-left", "A paint bucket"] },
    ],
  },
  "fill to copy": {
    learn: { visual: { fillDemo: { start: [5], end: 5 } }, note: "One cell selected → the same value, again and again." },
    exercises: [
      { type: "fill", fact: "the same value repeats", start: [7], end: 5 },
      { type: "fill", fact: "the same value repeats", start: ["Hall"], end: 5 },
      { type: "choice", fact: "Select one cell", prompt: "You want the same value in every cell. How many cells do you select before you drag the fill handle?",
        correct: "One cell", wrong: ["Two cells", "The whole column", "None"] },
    ],
  },
  "fill a pattern": {
    learn: { visual: { fillDemo: { start: [5, 10], end: 6 } }, note: "Two cells selected → it works out the pattern and keeps it going." },
    exercises: [
      { type: "fill", fact: "Select two cells", start: [5, 10], end: 6 },
      { type: "fill", fact: "Select two cells", start: [10, 20], end: 6 },
      { type: "fill", fact: "continue in the same way", start: [1, 2], end: 7 },
      { type: "order", fact: "Select two cells", prompt: "Put the steps in order to fill 5, 10, 15, 20… down column C.",
        steps: ["Type 5 in C1 and 10 in C2", "Select C1 and C2", "Drag the fill handle down"] },
    ],
  },
  // ------------------------------------------------------- level 3
  "move cells": {
    learn: { visual: { moveDemo: { from: "B2", to: "D4", value: "hello" } }, note: "The edge, not the fill handle: the fill handle fills, the edge moves." },
    exercises: [
      { type: "gridMove", fact: "drag it to a new place", from: ["B2", "B3", "C2"], to: ["D4", "E5", "D2"], value: ["hello", "42", "Pen"] },
      { type: "choice", fact: "hover the edge", prompt: "You want to move a cell. Where do you hover first?",
        correct: "Its edge, until the cursor is a hand", wrong: ["Its fill handle", "The Name Box", "The column letter"] },
      { type: "order", fact: "hover the edge", prompt: "Put the steps in order to move a cell.",
        steps: ["Select the cell", "Hover the edge until the cursor is a hand", "Drag it to the new place"] },
    ],
  },
  "clear cell contents": {
    learn: { visual: { keys: ["Delete"] }, note: "On a Chromebook, Backspace clears a cell too." },
    exercises: [
      { type: "keys", fact: "press Delete", prompt: "B2 is selected. Clear what's in it!", combo: "delete", label: "Delete", wrong: ["Ctrl + Y", "Enter", "Ctrl + Z"],
        scene: { grid: { cols: 4, rows: 4, sel: "B2", cells: { B2: 42 } }, after: { cells: { B2: "" } } } },
      { type: "choice", fact: "not any formatting", prompt: "B2 holds 42 and has a green fill. You click it and press Delete. What is left?",
        visual: { grid: { cols: 4, rows: 3, sel: "B2", cells: { B2: 42 }, style: { B2: { bg: "#b7e1c5" } } } },
        correct: "An empty cell that still has its green fill", wrong: ["An empty white cell: the fill is gone too", "42 is still there", "The cell is deleted and C2 moves into its place"] },
    ],
  },
  undo: {
    learn: { visual: { keys: ["Ctrl", "Z"] }, note: "Your safety net: you can't break anything." },
    exercises: [
      { type: "keys", fact: "Ctrl + Z", prompt: "Oops! You cleared 42 from B2 by mistake. Undo it!", combo: "ctrl+z", label: "Ctrl + Z", wrong: ["Ctrl + Y", "Ctrl + X", "Ctrl + U"],
        scene: { grid: { cols: 4, rows: 4, sel: "B2", cells: { B2: "" } }, after: { cells: { B2: 42 } } } },
      { type: "choice", fact: "Press it again to go further back", prompt: "You made three mistakes in a row. Ctrl + Z took back the last one. How do you take back the other two?",
        correct: "Press Ctrl + Z two more times", wrong: ["Press Ctrl + Y two more times", "You can't: Ctrl + Z only works once", "Close the spreadsheet and open it again"] },
    ],
  },
  redo: {
    learn: { visual: { keys: ["Ctrl", "Y"] }, note: "Ctrl + Z goes back. Ctrl + Y comes forward again." },
    exercises: [
      { type: "keys", fact: "Ctrl + Y", prompt: "You pressed Ctrl + Z one time too many and 42 disappeared. Bring it back!", combo: "ctrl+y", label: "Ctrl + Y", wrong: ["Ctrl + Z", "Ctrl + B", "Delete"],
        scene: { grid: { cols: 4, rows: 4, sel: "B2", cells: { B2: "" } }, after: { cells: { B2: 42 } } } },
      { type: "choice", fact: "bring back what Ctrl + Z just took away", prompt: "What does Ctrl + Y do?",
        correct: "Brings back what Ctrl + Z just took away", wrong: ["Takes back your last action", "Clears the selected cell", "Copies the cell"] },
    ],
  },
  // ------------------------------------------------------- level 4
  "select, then apply": {
    learn: { visual: { steps: ["Select the cells", "Choose a tool"] }, note: "Nothing changes until the cells are selected." },
    exercises: [
      { type: "gridRange", fact: "Select the cells first", target: ["A1:D1"], prompt: "You want to make the headings bold. Do the first step: select A1:D1.", grid: { cols: 4, rows: 3, cells: shop } },
      { type: "choice", fact: "only works on selected cells", prompt: "Mia clicks Bold, but nothing in her table changes. What went wrong?",
        correct: "She didn't select any cells first", wrong: ["Bold only works on numbers", "She needed to press Delete first", "She should have used fill colour"] },
      { type: "order", fact: "Select the cells first, then choose a tool", prompt: "Put the steps in order to make A1:D1 bold.",
        steps: ["Click A1", "Drag across to D1", "Click Bold"] },
    ],
  },
  "text formatting": {
    learn: { visual: { icons: [["ic-fontfamily", "Font"], ["ic-fontsize", "Size"], ["ic-bold", "Bold"], ["ic-fontcolour", "Font colour"]] } },
    exercises: [
      { type: "choice", fact: "Changing the writing itself", prompt: "Which one is NOT text formatting?",
        correct: "Fill colour: the cell's background", wrong: ["Bold", "Font size", "Font colour"] },
      { type: "hotspot", fact: "bold", screen: "sheets-basic", target: "bold", prompt: "Tap the Bold button." },
      { type: "hotspot", fact: "colour", screen: "sheets-basic", target: "fontColour", prompt: "Tap the button that changes the colour of the writing." },
    ],
  },
  "fill colour": {
    learn: { visual: { icons: [["ic-fill", "Fill colour"]], grid: { cols: 4, rows: 2, cells: { A1: "Item", B1: "Price", C1: "Qty", D1: "Total" }, style: { A1: { bg: "#137a3c", color: "#fff", b: 1 }, B1: { bg: "#137a3c", color: "#fff", b: 1 }, C1: { bg: "#137a3c", color: "#fff", b: 1 }, D1: { bg: "#137a3c", color: "#fff", b: 1 } } } } },
    exercises: [
      { type: "hotspot", fact: "paint bucket", screen: "sheets-ribbon", target: "fillColour", prompt: "Tap the fill colour button." },
      { type: "choice", fact: "background colour", prompt: "What does fill colour change?",
        correct: "The background of the selected cells", wrong: ["The colour of the writing", "The lines around the cells", "The colour of the sheet tab"] },
    ],
  },
  borders: {
    learn: { visual: { image: "border-menu" }, note: "Where · Colour (the pencil) · Thickness. A thick red box: red → thick → outer box." },
    exercises: [
      { type: "choice", fact: "where", prompt: "The borders menu lets you set three things. Which three?",
        correct: "Where, colour and thickness", wrong: ["Font, size and bold", "Width, height and wrap", "Where, size and font"] },
      { type: "hotspot", fact: "outer box", screen: "border-menu", target: "outer", prompt: "Tap the button for a box around the outside only." },
      { type: "hotspot", fact: "colour (the pencil)", screen: "border-menu", target: "colour", prompt: "Tap where you choose the border's colour." },
    ],
  },
  // ------------------------------------------------------- level 5
  sheet: {
    learn: { visual: { tabs: { tabs: ["Sheet1", "Sheet2", "Sheet3"], active: 0 } }, note: "Like the pages in a ring binder: one file, many pages." },
    exercises: [
      { type: "choice", fact: "The whole file is the spreadsheet", prompt: "Fill the gaps: the whole file is the ____. Each tab is a ____.",
        visual: { tabs: { tabs: ["Sheet1", "Sheet2", "Sheet3"], active: 0 } },
        correct: "spreadsheet · sheet", wrong: ["sheet · spreadsheet", "cell · range", "range · column"] },
      { type: "choice", fact: "worksheet", prompt: "What is another name for a sheet?", correct: "A worksheet", wrong: ["A cell", "A range", "A Name Box"] },
    ],
  },
  "insert a sheet": {
    learn: { visual: { tabs: { tabs: ["Sheet1"], active: 0, highlight: "+" } } },
    exercises: [
      { type: "hotspot", fact: "Click the +", ui: { tabs: { tabs: ["Data", "Notes"], active: 0 } }, target: "+", prompt: "Add a new sheet." },
      { type: "choice", fact: "bottom-left", prompt: "Where is the + that adds a new sheet?", correct: "At the bottom-left", wrong: ["At the top-right", "In the Name Box", "In the Format menu"] },
    ],
  },
  "rename a sheet": {
    learn: { visual: { tabs: { tabs: ["Data", "Sheet2"], active: 1, editing: 1 } }, note: "Double-click Sheet2, type Data, press Enter." },
    exercises: [
      { type: "order", fact: "Double-click the tab", prompt: "Put the steps in order to rename Sheet1 to Data.",
        steps: ["Double-click the Sheet1 tab", "Type Data", "Press Enter"] },
      { type: "choice", fact: "Double-click the tab", prompt: "How do you start renaming a sheet?", correct: "Double-click its tab", wrong: ["Click the +", "Select A1 and type", "Press Delete"] },
    ],
  },
  "duplicate a sheet": {
    learn: { visual: { tabmenu: { tab: "Data", highlight: "Duplicate" } }, note: "Two-finger tap on a Chromebook = right-click." },
    exercises: [
      { type: "hotspot", fact: "Duplicate", ui: { tabmenu: { tab: "Term 1" } }, target: "Duplicate", prompt: "Make a copy of the Term 1 sheet." },
      { type: "choice", fact: "Makes a copy", prompt: "What does Duplicate do to a sheet?", correct: "Makes a copy of it", wrong: ["Deletes it", "Moves it to the right", "Renames it"] },
    ],
  },
  "move a sheet": {
    learn: { visual: { tabs: { tabs: ["Notes", "Data"], active: 1, dragging: 1 } }, note: "Drag a tab along the row, or use Move right / Move left in the tab menu." },
    exercises: [
      { type: "hotspot", fact: "Move right", ui: { tabmenu: { tab: "Notes" } }, target: "Move right", prompt: "Move the Notes sheet one place to the right." },
      { type: "choice", fact: "Drag the tab", prompt: "Which of these moves a sheet tab to a new place?",
        correct: "Drag the tab along the row", wrong: ["Double-click the tab", "Click the +", "Press Ctrl + Y"] },
    ],
  },
  "colour a sheet tab": {
    learn: { visual: { tabs: { tabs: ["Data", "Notes"], active: 0, colours: ["#1f9a4f", "#fbbc04"] } } },
    exercises: [
      { type: "hotspot", fact: "Change colour", ui: { tabmenu: { tab: "Data" } }, target: "Change colour", prompt: "Make the Data tab green. What do you choose?" },
    ],
  },
  // ======================================================= Lesson 2
  "column width": {
    learn: { visual: { grid: { cols: 3, rows: 2, widths: { A: 0.7, B: 1.3 }, cells: { A1: "Stall", B1: "Date", A2: "Face Painting", B2: "12 Nov" } }, colheads: { n: 3, highlight: "A|B" } },
      note: "Column A is too narrow: “Face Painting” is cut off. Drag the line between A and B to the right, or double-click it." },
    exercises: [
      { type: "choice", fact: "Drag the line between two column letters", prompt: "You drag the line between columns B and C to the right. Which column gets wider?",
        visual: { colheads: { n: 4, highlight: "B|C" } }, correct: "Column B", wrong: ["Column C", "Both B and C", "Neither: row 1 gets taller"] },
      { type: "hotspot", fact: "Drag the line between two column letters", ui: { colheads: { n: 4 } }, target: "B|C", prompt: "Tap the line you'd drag to make column B wider." },
      { type: "choice", fact: "Double-click it to fit the widest cell automatically", prompt: "What happens when you double-click the line between two column letters?",
        correct: "The column fits its widest cell automatically", wrong: ["The column is deleted", "A new column is inserted", "The column is selected"] },
    ],
  },
  "row height": {
    learn: { visual: { grid: { cols: 3, rows: 3, heights: { 2: 58 }, cells: { A1: "Stall", A2: "Raffle" } }, rowheads: { n: 3, highlight: "2|3" } }, note: "The same trick as columns, on the line under a row number." },
    exercises: [
      { type: "hotspot", fact: "Drag the line between two row numbers", ui: { rowheads: { n: 4 } }, target: "2|3", prompt: "Tap the line you'd drag to make row 2 taller." },
      { type: "choice", fact: "Drag the line between two row numbers", prompt: "How do you make a row taller?",
        correct: "Drag the line under its row number down", wrong: ["Drag the line between two column letters", "Press Enter in the row", "Merge the row's cells"] },
    ],
  },
  "vertical alignment": {
    learn: { visual: { grid: { cols: 3, rows: 1, heights: { 1: 72 }, cells: { A1: "Top", B1: "Middle", C1: "Bottom" }, style: { A1: { valign: "top" }, B1: { valign: "middle" } } } }, note: "Bottom is the default. You only notice it when a row is taller than its text." },
    exercises: [
      { type: "choice", fact: "Bottom is the default", prompt: "Row 1 is now three lines tall. Nobody has touched vertical alignment. Where does the word sit?",
        visual: { grid: { cols: 3, rows: 2, heights: { 1: 78 }, cells: { A1: "Stall" }, sel: "A1", handle: false } }, correct: "At the bottom", wrong: ["At the top", "In the middle", "It stretches to fill the cell"] },
      { type: "choice", fact: "top, middle, or bottom", prompt: "Which cell is set to Middle?",
        visual: { grid: { cols: 3, rows: 1, heights: { 1: 72 }, cells: { A1: "Aa", B1: "Aa", C1: "Aa" }, style: { A1: { valign: "middle" }, B1: { valign: "top" } } } }, correct: "A1", wrong: ["B1", "C1", "None of them"] },
      { type: "hotspot", fact: "top, middle, or bottom", screen: "sheets-ribbon", target: "vAlign", prompt: "Tap the vertical align button." },
    ],
  },
  "text wrap": {
    learn: { visual: { grid: { cols: 3, rows: 3, heights: { 2: "auto" }, widths: { A: 1.1 }, cells: { A1: "Face Painting today", A2: "Face Painting today", A3: "Face Painting today", B3: "Hall" }, style: { A2: { wrap: "wrap" }, A3: { wrap: "clip" } } } },
      note: "Row 1: overflow (the default) spills into B1. Row 2: wrap grows the row. Row 3: clip cuts it off at the edge." },
    exercises: [
      { type: "choice", fact: "grow the row to fit it all", prompt: "A cell is set to Wrap and its text is longer than the column. What happens?",
        correct: "The row grows taller to fit all the text", wrong: ["The text spills into the next cell", "The text is cut off at the edge", "The column gets wider"] },
      { type: "choice", fact: "cut it off at the edge", prompt: "A1 is set to Clip. What happens to the end of the text?",
        visual: { grid: { cols: 3, rows: 2, widths: { A: 1.1 }, cells: { A1: "Face Painting today" }, style: { A1: { wrap: "clip" } }, sel: "A1", handle: false } },
        correct: "It's cut off at the cell's edge (still there, just hidden)", wrong: ["It's deleted", "It spills into B1", "The row grows to fit it"] },
      { type: "choice", fact: "spill into an empty cell next door (the default)", prompt: "Nobody changed the text wrapping and B1 is empty. What does the long text in A1 do?",
        visual: { grid: { cols: 3, rows: 2, widths: { A: 1.1 }, cells: { A1: "Face Painting today" } } },
        correct: "It spills into the empty cell next door", wrong: ["It wraps onto a second line", "It's cut off at the edge", "It shrinks to fit"] },
      { type: "hotspot", fact: "three choices on one toolbar button", screen: "sheets-ribbon", target: "wrap", prompt: "Tap the text wrapping button." },
    ],
  },
  "merge cells": {
    learn: { visual: { grid: { cols: 4, rows: 3, merges: ["A1:D1"], cells: { A1: "Fair Stalls", A2: "Stall", B2: "Date", C2: "Location", D2: "Notes" }, style: { A1: { b: 1, align: "center" }, A2: { b: 1 }, B2: { b: 1 }, C2: { b: 1 }, D2: { b: 1 } } }, image: "merge-button" },
      note: "The merge button stays grey until you select two or more cells." },
    exercises: [
      { type: "choice", fact: "the whole selection becomes one cell", prompt: "You select A1:E1 and choose Merge all. How many cells is A1:E1 now?", correct: "One", wrong: ["Five", "Two", "None: they're deleted"] },
      { type: "order", fact: "then centre it", prompt: "Put the steps in order to make a heading across A1:D1.",
        steps: ["Select A1:D1", "Click the merge button", "Choose Merge all", "Centre it"] },
      { type: "hotspot", fact: "merge button", screen: "sheets-ribbon", target: "merge", prompt: "Tap the merge cells button." },
      { type: "gridRange", fact: "Select two or more cells", target: ["A1:D1"], prompt: "Select the cells to merge for a heading across the table: A1:D1.",
        grid: { cols: 4, rows: 3, cells: { A1: "Fair Stalls", A2: "Stall", B2: "Date", C2: "Location", D2: "Notes" } } },
    ],
  },
  "horizontal alignment": {
    learn: { visual: { grid: { cols: 3, rows: 2, cells: { A1: "Stall", B1: "Stall", C1: "Stall", A2: "Left", B2: "Centre", C2: 42 }, style: { B1: { align: "center" }, C1: { align: "right" }, B2: { align: "center" } } } }, note: "Text sits on the left, numbers on the right, until you change it." },
    exercises: [
      { type: "choice", fact: "numbers default to the right", prompt: "You type the number 42 into a cell. Nobody changed the alignment. Where does it sit?", correct: "On the right", wrong: ["On the left", "In the centre", "At the top"] },
      { type: "choice", fact: "Text defaults to the left", prompt: "Nobody changed the alignment. Where does the word “Raffle” sit in its cell?", correct: "On the left", wrong: ["On the right", "In the centre", "It depends on the font"] },
      { type: "hotspot", fact: "left, centre, or right", screen: "sheets-ribbon", target: "hAlign", prompt: "Tap the horizontal align button." },
    ],
  },
  locale: {
    learn: { visual: { grid: { cols: 2, rows: 2, widths: { A: 1.2 }, cells: { A1: "Locale", B1: "03/04/2026 is…", A2: "Australia", B2: "3 April 2026" }, style: { A1: { b: 1 }, B1: { b: 1 } } } }, note: "In the United States, 03/04/2026 is March 4. Set the locale (File → Settings) before you type dates." },
    exercises: [
      { type: "choice", fact: "day-first vs month-first", prompt: "The locale is Australia. You type 03/04/2026. Which date is it?", correct: "3 April 2026", wrong: ["4 March 2026", "3 March 2026", "4 April 2026"] },
      { type: "choice", fact: "File → Settings", prompt: "Where do you change a spreadsheet's locale?", correct: "File → Settings", wrong: ["Format → Number", "View → Freeze", "Format → Conditional formatting"] },
      { type: "choice", fact: "controls how dates, currency, and numbers are read and written", prompt: "What does the locale control?",
        correct: "How dates, currency and numbers are read and written", wrong: ["The font and its size", "How wide the columns are", "Which sheets you can see"] },
    ],
  },
  "format vs value": {
    learn: { visual: { grid: { cols: 3, rows: 2, cells: { A1: "Item", B1: "Cost", A2: "Pen", B2: "$7.50" }, style: { B2: { align: "right" } }, sel: "B2", nameBox: true, formula: "7.5" } }, note: "The cell shows $7.50, but the formula bar shows what it really holds: 7.5." },
    exercises: [
      { type: "choice", fact: "never changes what the cell actually holds", prompt: "B2 shows $7.50. What does B2 actually hold?",
        visual: { grid: { cols: 3, rows: 2, cells: { A1: "Item", B1: "Cost", A2: "Pen", B2: "$7.50" }, style: { B2: { align: "right" } }, sel: "B2", nameBox: true, formula: "?" } },
        correct: "7.5", wrong: ["$7.50", "7.50 $", "The text “$7.50”"] },
      { type: "choice", fact: "never changes what the cell actually holds", prompt: "A cell holds 18. You apply Currency format. Has the cell's value changed?",
        correct: "No: it shows $18.00 but still holds 18", wrong: ["Yes: it now holds $18.00", "Yes: it now holds 18.00", "Yes: the 18 is replaced with text"] },
    ],
  },
  "date format": {
    learn: { visual: { grid: { cols: 2, rows: 2, widths: { B: 1.6 }, cells: { A1: "Typed", B1: "Custom date with the day name", A2: "9/11/2026", B2: "Mon, 9 Nov 2026" }, style: { A1: { b: 1 }, B1: { b: 1 }, A2: { align: "right" }, B2: { align: "right" } } } }, note: "Format → Number → Date for a clean date. Custom date and time for the day name in front." },
    exercises: [
      { type: "choice", fact: "Custom date and time to include things like the day name", prompt: "You want “Mon, 9 Nov 2026”, with the day name. Which do you choose?",
        correct: "Format → Number → Custom date and time", wrong: ["Format → Number → Date", "Format → Number → Currency", "File → Settings"] },
      { type: "choice", fact: "day name", prompt: "The locale is Australia. A cell holds 9/11/2026. You apply a custom format with the day name in front. What appears?",
        correct: "Mon, 9 Nov 2026", wrong: ["Fri, 11 Sep 2026", "9/11/2026 Monday", "Monday"] },
      { type: "order", fact: "Custom date and time", prompt: "Put the steps in order to show the day name in front of some dates.",
        steps: ["Select the date cells", "Open Format → Number", "Choose Custom date and time", "Pick a pattern with the day name"] },
    ],
  },
  "currency format": {
    learn: { visual: { grid: { cols: 2, rows: 2, cells: { A1: "Typed", B1: "Currency", A2: 18, B2: "$18.00" }, style: { A1: { b: 1 }, B1: { b: 1 }, B2: { align: "right" } } } }, note: "Never type the $ yourself: the format adds it." },
    exercises: [
      { type: "choice", fact: "two decimal places", prompt: "A cell holds 18. You apply Currency format. What do you see?", correct: "$18.00", wrong: ["18", "$18", "18.00 $"] },
      { type: "choice", fact: "Adds the $ sign", prompt: "After applying Currency format, do you need to type the $ sign yourself?", correct: "No: Currency format adds it automatically", wrong: ["Yes, before the number", "Yes, after the number", "Only for whole numbers"] },
      { type: "choice", fact: "Format → Number → Currency", prompt: "Where is the Currency format?", correct: "Format → Number → Currency", wrong: ["File → Settings → Currency", "View → Currency", "Insert → Currency"] },
    ],
  },
  "insert row/column": {
    learn: { visual: { grid: { cols: 3, rows: 5, cells: { A1: "Name", B1: "Stall", A2: "Priya", A3: "Jordan", A5: "Sam" }, style: { A4: { bg: "#d3e3fd" }, B4: { bg: "#d3e3fd" }, C4: { bg: "#d3e3fd" }, A1: { b: 1 }, B1: { b: 1 } } } }, note: "A new row was inserted above Sam: Sam moved down from row 4 to row 5. Nothing was overwritten." },
    exercises: [
      { type: "choice", fact: "Everything shifts to make room", prompt: "Your data is in rows 2 to 5. You right-click row 4 and choose Insert row above. Which row is the old row 4 in now?", correct: "Row 5", wrong: ["Row 4", "Row 3", "It's gone: the new row replaced it"] },
      { type: "gridClick", fact: "Right-click a row number", target: "row:3", prompt: "You want a new row above row 3. Which do you right-click? Click it." },
      { type: "choice", fact: "nothing is overwritten", prompt: "You insert a column in the middle of your table. What happens to the data?", correct: "It shifts across to make room: nothing is overwritten", wrong: ["The column there is overwritten", "The data is deleted", "The table is split into two sheets"] },
      { type: "choice", fact: "Insert column left/right", prompt: "You right-click column D and choose Insert 1 column left. Where does the new column appear?", correct: "On the left of the old column D", wrong: ["On the right of column D", "At the end of the sheet", "In a new sheet"] },
    ],
  },
  "freeze panes": {
    learn: { visual: { grid: { cols: 3, rows: 4, frozen: 1, rowLabels: [1, 14, 15, 16], cells: { A1: "Name", B1: "Stall", C1: "Hours", A2: "Leo", B2: "Cake Stall", C2: 3, A3: "Mia", B3: "Raffle", C3: 2, A4: "Sam", B4: "Photo Booth", C4: 4 }, style: { A1: { b: 1 }, B1: { b: 1 }, C1: { b: 1 } } } }, note: "Scrolled down to row 14, and the headers in row 1 are still there." },
    exercises: [
      { type: "choice", fact: "stay visible at the top", prompt: "Row 1 is frozen. You scroll far down the sheet. What stays visible at the top?", correct: "Row 1, the headers", wrong: ["Nothing: everything scrolls", "The last row", "Column A"] },
      { type: "choice", fact: "View → Freeze", prompt: "Which menu freezes rows?", correct: "View → Freeze", wrong: ["Format → Freeze", "File → Settings", "Insert → Freeze"] },
    ],
  },
  "conditional formatting": {
    learn: { visual: { grid: { cols: 2, rows: 5, cells: { A1: "Name", B1: "Hours", A2: "Priya", B2: 2, A3: "Jordan", B3: 3, A4: "Sam", B4: 4, A5: "Mia", B5: 2 }, style: { A1: { b: 1 }, B1: { b: 1 }, B3: { bg: "#b7e1c5" }, B4: { bg: "#b7e1c5" } } } }, note: "The rule: Hours of 3 or more → green. Change Mia's 2 to a 3 and it turns green by itself." },
    exercises: [
      { type: "choice", fact: "keeps checking itself as values change", prompt: "The rule is “3 or more → green”. A cell holds 2, so it isn't green. Later you type 3 into it. What happens?",
        correct: "It turns green by itself", wrong: ["Nothing until you apply the rule again", "It turns red", "The rule is deleted"] },
      { type: "choice", fact: "applies formatting automatically whenever it is true", prompt: "The rule is “3 or more → green”. Which values turn green?",
        visual: { grid: { cols: 2, rows: 5, cells: { A1: "Name", B1: "Hours", A2: "Priya", B2: 2, A3: "Jordan", B3: 3, A4: "Sam", B4: 5, A5: "Mia", B5: 1 }, style: { A1: { b: 1 }, B1: { b: 1 } } } },
        correct: "3 and 5", wrong: ["Only 5", "2, 3 and 5", "All of them"] },
      { type: "choice", fact: "Format → Conditional formatting", prompt: "Where do you set up conditional formatting?", correct: "Format → Conditional formatting", wrong: ["View → Conditional formatting", "File → Settings", "Data → Freeze"] },
    ],
  },
};
