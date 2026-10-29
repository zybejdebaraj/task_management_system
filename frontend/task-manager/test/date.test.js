import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toLocalDateTime } from '../src/utils/date.js';

test('task editing preserves local time instead of converting the input to UTC', () => {
  const previous = process.env.TZ;
  process.env.TZ = 'Europe/Budapest';
  try {
    assert.equal(toLocalDateTime('2026-11-01T14:00:00.000Z'), '2026-11-01T15:00');
    assert.equal(toLocalDateTime('2026-07-01T13:00:00.000Z'), '2026-07-01T15:00');
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test('empty and invalid due dates leave the date field empty', () => {
  assert.equal(toLocalDateTime(null), '');
  assert.equal(toLocalDateTime('not-a-date'), '');
});
