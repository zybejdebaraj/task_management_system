import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toCsv } from '../src/utils/csv.js';

test('CSV quotes locale-formatted dates, commas, quotes and line breaks', () => {
  assert.equal(toCsv([
    ['ID', 'Title', 'Due Date'],
    [1, 'Review "A", then B', '11/1/2026, 3:00:00 PM'],
    [2, 'First line\nSecond line', null],
  ]), '"ID","Title","Due Date"\r\n"1","Review ""A"", then B","11/1/2026, 3:00:00 PM"\r\n"2","First line\nSecond line",""');
});

test('CSV treats formula-like user content as text', () => {
  assert.equal(toCsv([['=SUM(A1:A2)', '+1', '-text', '@example', -1]]), '"\'=SUM(A1:A2)","\'+1","\'-text","\'@example","-1"');
});
