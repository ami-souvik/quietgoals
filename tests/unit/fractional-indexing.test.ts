import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';

describe('Fractional Indexing Logic', () => {
  it('generates a key when list is empty (both null)', () => {
    const key = generateKeyBetween(null, null);
    assert.ok(typeof key === 'string');
    assert.ok(key.length > 0);
  });

  it('generates a key after an existing key', () => {
    const first = 'a0';
    const second = generateKeyBetween(first, null);
    assert.ok(first.localeCompare(second) < 0, `Expected ${first} < ${second}`);
  });

  it('generates a key before an existing key', () => {
    const last = 'a1';
    const before = generateKeyBetween(null, last);
    assert.ok(before.localeCompare(last) < 0, `Expected ${before} < ${last}`);
  });

  it('generates a key strictly between two keys', () => {
    const start = 'a0';
    const end = 'a1';
    const middle = generateKeyBetween(start, end);

    assert.ok(start.localeCompare(middle) < 0, `Expected ${start} < ${middle}`);
    assert.ok(middle.localeCompare(end) < 0, `Expected ${middle} < ${end}`);
  });

  it('generates multiple keys in strict ascending order (generateNKeysBetween)', () => {
    const count = 10;
    const keys = generateNKeysBetween(null, null, count);

    assert.equal(keys.length, count);
    for (let i = 0; i < count - 1; i++) {
      assert.ok(
        keys[i].localeCompare(keys[i + 1]) < 0,
        `Expected keys[${i}] (${keys[i]}) < keys[${i + 1}] (${keys[i + 1]})`
      );
    }
  });

  it('handles deep consecutive insertions without precision loss', () => {
    let prev = 'a0';
    for (let i = 0; i < 25; i++) {
      const next = generateKeyBetween(prev, null);
      assert.ok(prev.localeCompare(next) < 0);
      prev = next;
    }
  });
});
