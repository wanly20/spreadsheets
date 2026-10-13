// GENERATED from spreadsheets_knowledge_list.xlsx by sync_knowledge.py — edit the spreadsheet, not this file.
// Loaded by spreadsheets_lesson_4_slides.html and later decks' Lesson 4 folder.
// { at: 1-based slide number IN THE LESSON 4 DECK, kind: 'identify'|'action', term, def, review? }
// [[…]] in def marks words blanked when the definition is the revision-mode prompt;
// review (optional) replaces that blanked prompt entirely.
const lesson4Knowledge = [
    { at: 3, kind: 'identify', term: 'relative reference', def: 'The normal kind of reference: when you fill a formula, it [[moves]] with the row — =A2*B2 becomes =A3*B3. Every reference is this kind unless you lock it.' },
    { at: 4, kind: 'action', term: 'percentage in a cell', def: 'Type 10% into a cell — it holds 0.1. Multiply by that cell to get 10% of a number: =200*B1 gives 20.' },
    { at: 5, kind: 'identify', term: 'absolute reference', def: 'A reference locked with a $ before the letter AND the number — like $B$13. It stays the same when you fill. $ is Shift + 4.' },
    { at: 6, kind: 'identify', term: 'when to lock a reference', def: 'When every row uses the same one cell — a rate, a price, a budget. Lock it with $, fill down, and changing that one cell updates every answer.' },
    { at: 7, kind: 'action', term: 'delete a row or column', def: 'Right-click (two-finger tap) the row number or column letter → [[Delete row]] / [[Delete column]]. Everything below moves up, or everything to the right moves left. The [[Delete]] key alone only empties the cells — the blank row stays.' },
];
