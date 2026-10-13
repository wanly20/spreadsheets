// GENERATED from spreadsheets_knowledge_list.xlsx by sync_knowledge.py — edit the spreadsheet, not this file.
// Loaded by spreadsheets_lesson_3_slides.html and later decks' Lesson 3 folder.
// { at: 1-based slide number IN THE LESSON 3 DECK, kind: 'identify'|'action', term, def, review? }
// [[…]] in def marks words blanked when the definition is the revision-mode prompt;
// review (optional) replaces that blanked prompt entirely.
const lesson3Knowledge = [
    { at: 3, kind: 'identify', term: 'formula', def: 'A calculation in a cell. It always starts with = . The cell shows the answer; the bar above the grid shows the [[formula]] itself. Leave out the = and it is just text.' },
    { at: 4, kind: 'identify', term: 'operators', def: 'The four calculation signs: + add, − subtract, * multiply (Shift + 8), / divide. Never x or ÷.' },
    { at: 5, kind: 'identify', term: 'why use a cell reference', def: 'Point the calculation at a cell (like B2) instead of typing the number in it. When that number changes, the answer updates by itself.' },
    { at: 6, kind: 'action', term: 'click to add a reference', def: 'While typing a formula, [[click]] a cell instead of typing its name — the name goes in for you, coloured to match the cell. Fewer typos.' },
    { at: 13, kind: 'action', term: 'fill a formula', def: 'Drag the fill handle from a [[formula]] cell. The [[formula]] copies down and its cell references move with it: =B2*C2 becomes =B3*C3 on the next row.' },
    { at: 14, kind: 'action', term: 'show formulas', def: 'Press Ctrl + ` (the key under Esc) to see every [[formula]] instead of its answer. Press it again to go back. Use it to check your work.' },
    { at: 27, kind: 'identify', term: 'function', def: 'A ready-made formula with a name, like SUM. It still starts with = , then the name, then a range in brackets.' },
    { at: 27, kind: 'action', term: 'SUM', def: '=[[SUM]](first:last) adds up every cell in a range — down a column (D2:D9) or across a row (C4:E4). Type =[[SUM]]( then drag over the cells.' },
    { at: 33, kind: 'identify', term: 'order when subtracting', def: 'With − the order matters: =B8-B7 and =B7-B8 give opposite answers. Put what you have first, then take away what you spend. A minus answer means over budget.' },
    { at: 34, kind: 'action', term: 'paint format', def: 'Copy the look of one cell onto others: click the cell that looks right, click the [[paint roller]], then click or drag over the cells to change. It copies the formatting, not what is in the cell.' },
];
