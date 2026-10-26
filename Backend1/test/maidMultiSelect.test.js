const { test } = require('node:test');
const assert = require('node:assert/strict');
const { toStringList, toOptionList, optionFilter } = require('../src/utils/maids/multiSelect');
const { maidFilterGenerator } = require('../src/utils/maidFilterGenerator/maidFilterGenerator');

test('toStringList accepts every shape clients send', () => {
  assert.deepEqual(toStringList('Dubai'), ['Dubai']);
  assert.deepEqual(toStringList(' Dubai , Sharjah '), ['Dubai', 'Sharjah']);
  assert.deepEqual(toStringList('["Dubai","Sharjah","Dubai"]'), ['Dubai', 'Sharjah']);
  assert.deepEqual(toStringList(['Dubai', ['Ajman']]), ['Dubai', 'Ajman']);
  assert.deepEqual(toStringList(''), []);
  assert.deepEqual(toStringList(null), []);
});

test('toOptionList splits the legacy combined arrangement', () => {
  assert.deepEqual(toOptionList('Live In And Live Out'), ['Live In', 'Live Out']);
  assert.deepEqual(toOptionList(['Live Out', 'Live In And Live Out']), ['Live Out', 'Live In']);
  assert.deepEqual(toOptionList('["Live In"]'), ['Live In']);
});

test('optionFilter matches new lists and legacy single values', () => {
  assert.deepEqual(optionFilter(['Live In']), { option: { $in: ['Live In', 'Live In And Live Out'] } });
  assert.deepEqual(optionFilter(['Live In And Live Out']), {
    $or: [{ option: 'Live In And Live Out' }, { option: { $all: ['Live In', 'Live Out'] } }],
  });
});

test('maidFilterGenerator filters several locations', () => {
  const { filter } = maidFilterGenerator({ location: ['Dubai', 'Sharjah'], option: ['Live Out'] });
  assert.deepEqual(filter.location, { $in: ['Dubai', 'Sharjah'] });
  assert.deepEqual(filter.$and, [{ option: { $in: ['Live Out', 'Live In And Live Out'] } }]);
});
