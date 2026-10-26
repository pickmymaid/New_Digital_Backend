// A maid's `location` and `option` are lists (the admin panel picks several).
// Older clients and profiles use a single string, so every shape is accepted:
// an array, a JSON array string (multipart forms), "Dubai,Sharjah" or "Dubai".

// Older profiles store both arrangements as this one value; saved as the two separate options.
const LIVE_IN_AND_OUT = 'Live In And Live Out';
const LIVE_IN = 'Live In';
const LIVE_OUT = 'Live Out';

const toStringList = (value) => {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return [...new Set(value.flatMap(toStringList))];
  const text = String(value).trim();
  if (text.startsWith('[')) {
    try {
      return toStringList(JSON.parse(text));
    } catch {
      // Not JSON after all; treat it as plain text below.
    }
  }
  return [...new Set(text.split(',').map((v) => v.trim()).filter(Boolean))];
};

const toOptionList = (value) => [
  ...new Set(toStringList(value).flatMap((v) => (v === LIVE_IN_AND_OUT ? [LIVE_IN, LIVE_OUT] : [v]))),
];

// Mongo filter for the website's Position filter. "Live In" also matches legacy
// "Live In And Live Out" profiles; "Live In And Live Out" matches maids who do both.
const optionFilter = (values) => {
  const plain = values.filter((v) => v !== LIVE_IN_AND_OUT);
  const conditions = [];
  if (plain.length) conditions.push({ option: { $in: [...plain, LIVE_IN_AND_OUT] } });
  if (values.includes(LIVE_IN_AND_OUT)) {
    conditions.push({ option: LIVE_IN_AND_OUT }, { option: { $all: [LIVE_IN, LIVE_OUT] } });
  }
  return conditions.length === 1 ? conditions[0] : { $or: conditions };
};

module.exports = { toStringList, toOptionList, optionFilter, LIVE_IN_AND_OUT };
