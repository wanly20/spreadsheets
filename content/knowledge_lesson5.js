// GENERATED from spreadsheets_knowledge_list.xlsx by sync_knowledge.py — edit the spreadsheet, not this file.
// Loaded by spreadsheets_lesson_5_slides.html and later decks' Lesson 5 folder.
// { at: 1-based slide number IN THE LESSON 5 DECK, kind: 'identify'|'action', term, def, review? }
// [[…]] in def marks words blanked when the definition is the revision-mode prompt;
// review (optional) replaces that blanked prompt entirely.
const lesson5Knowledge = [
    { at: 3, kind: 'action', term: 'MAX', def: '=[[MAX]](range) gives the highest value in the range. Same shape as SUM: = , the name, the range in brackets.' },
    { at: 3, kind: 'action', term: 'MIN', def: '=[[MIN]](range) gives the lowest value in the range.' },
    { at: 3, kind: 'action', term: 'AVERAGE', def: '=[[AVERAGE]](range) gives the mean: every value added up, then divided by how many there are.' },
    { at: 4, kind: 'action', term: 'fill across', def: 'Drag the fill handle to the right: the formula copies and its column letters move — =MAX(B2:B10) becomes =MAX(C2:C10). Filling down moves the numbers instead.' },
    { at: 5, kind: 'action', term: 'decimal places buttons', def: 'Two toolbar buttons that change how many [[decimal places]] a number shows: 26.666667 → 27. Only the look changes — the cell still holds every decimal.' },
    { at: 5, kind: 'action', term: 'percentage format', def: 'The [[%]] button (Format → Number → [[Percent]]) shows a number as a [[percentage]]: 0.25 shows as [[25%]]. The cell still holds 0.25.' },
    { at: 10, kind: 'identify', term: 'order of operations', def: 'In a formula, brackets go first, then × and ÷, then + and −: =2+3*4 is 14, =(2+3)*4 is 20.' },
    { at: 11, kind: 'identify', term: 'a fixed number in a formula', def: 'A number that never changes — 2 to halve, 12 months in a year, a game\'s points rule — can be typed straight into the formula. Anything that might change goes in a cell (locked with $ if every row uses it).' },
];
