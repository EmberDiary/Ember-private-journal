const fs = require('fs');
const vm = require('vm');

const script = fs.readFileSync('./script.js', 'utf8');

const context = {
  console,
  window: { setTimeout: (fn) => fn(), clearTimeout: () => {} },
  document: {
    querySelectorAll: () => [],
    getElementById: () => null,
    addEventListener: () => {},
    documentElement: { style: { setProperty: () => {} } },
    body: { dataset: {} }
  },
  navigator: { language: 'en-US' },
  localStorage: {
    store: {},
    getItem: function (key) { return this.store[key] ?? null; },
    setItem: function (key, value) { this.store[key] = String(value); },
    removeItem: function (key) { delete this.store[key]; }
  },
  Date,
  Intl,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  Array,
  Object,
  String,
  Number,
  Boolean,
  Math,
  RegExp
};

vm.createContext(context);
vm.runInContext(script, context);

const historyA = [
  { role: 'user', text: 'I had a weird day.' },
  { role: 'assistant', text: 'That sounds odd. What happened?' },
  { role: 'user', text: 'My teacher accidentally called me by the wrong name.' }
];

const historyB = [
  { role: 'user', text: 'My friend ignored me.' },
  { role: 'assistant', text: 'That sounds frustrating. What happened?' },
  { role: 'user', text: 'Actually, it was not my friend. It was someone from my class.' }
];

const historyC = [
  { role: 'user', text: 'I had an argument today.' },
  { role: 'assistant', text: 'That sounds rough. Want to unpack it?' },
  { role: 'user', text: 'Anyway, I want to buy a new keyboard.' }
];

const responseA = generateCompanionResponse(historyA, 'My teacher accidentally called me by the wrong name.');
const responseB = generateCompanionResponse(historyB, 'Actually, it was not my friend. It was someone from my class.');
const responseC = generateCompanionResponse(historyC, 'Anyway, I want to buy a new keyboard.');

if (!responseA || !responseB || !responseC) {
  throw new Error('Missing companion response generation.');
}
if (!/teacher|wrong name|class|keyboard|friend/i.test(responseA + responseB + responseC)) {
  throw new Error('Conversation responses do not reflect the actual user context.');
}
if (responseA.toLowerCase().includes('weird day') && responseA.toLowerCase().includes('what happened')) {
  throw new Error('The assistant repeated its earlier response instead of continuing the new thread.');
}

console.log('Conversation checks passed.');
