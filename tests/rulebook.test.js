const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const {
  createRulebookDocument,
  loadScript,
  flushPromises
} = require('./helpers/testHarness');

const rulebookPath = path.join(__dirname, '..', 'rulebook.js');

const sampleRules = {
  rules: {
    markovnikov: {
      name: "Markovnikov's Rule",
      theory: 'Hydrogen adds to carbon with more hydrogens.',
      example1: { formula: 'A + B -> C', desc: 'Primary example description.' },
      example2: { formula: 'D + E -> F', desc: 'Secondary example description.' }
    },
    huckel: {
      name: "Hückel's Rule",
      theory: 'Aromatic if 4n+2 pi electrons.',
      example1: { formula: 'C6H6', desc: 'Benzene aromatic.' },
      example2: { formula: 'C10H8', desc: 'Naphthalene aromatic.' }
    }
  }
};

function okFetch(data) {
  return () => Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data)
  });
}

test('rulebook.js renders grouped rule cards from fetched data', async () => {
  const document = createRulebookDocument();
  loadScript(rulebookPath, { document, fetchImpl: okFetch(sampleRules) });
  await flushPromises();

  const grid = document.getElementById('element-grid');
  const titles = grid.children.filter(child => child.classList.contains('rule-group-title'));
  const cards = grid.children.filter(child => child.classList.contains('rule-card'));

  assert.equal(grid.className, 'rule-groups');
  assert.equal(titles.length, 3);
  assert.equal(cards.length, 2);
});

test('rulebook.js selects a rule card and enables the action button', async () => {
  const document = createRulebookDocument();
  loadScript(rulebookPath, { document, fetchImpl: okFetch(sampleRules) });
  await flushPromises();

  const grid = document.getElementById('element-grid');
  const combineBtn = document.getElementById('combine-btn');
  const cards = grid.children.filter(child => child.classList.contains('rule-card'));

  cards[0].onclick();
  assert.equal(combineBtn.disabled, false);
  assert.equal(cards[0].classList.contains('selected'), true);

  cards[1].onclick();
  assert.equal(cards[0].classList.contains('selected'), false);
  assert.equal(cards[1].classList.contains('selected'), true);
});

test('rulebook.js populates detail view and switches page on combine', async () => {
  const document = createRulebookDocument();
  loadScript(rulebookPath, { document, fetchImpl: okFetch(sampleRules) });
  await flushPromises();

  const grid = document.getElementById('element-grid');
  const cards = grid.children.filter(child => child.classList.contains('rule-card'));
  const combineBtn = document.getElementById('combine-btn');

  cards[0].onclick();
  combineBtn.onclick();

  assert.equal(document.getElementById('reaction-name').innerText, "Markovnikov's Rule");
  assert.equal(document.getElementById('formula-text').innerText, 'Hydrogen adds to carbon with more hydrogens.');
  assert.equal(document.getElementById('ex1-formula').innerText, 'A + B -> C');
  assert.equal(document.getElementById('reaction-info').innerText, 'Primary example description.');
  assert.equal(document.getElementById('ex2-formula').innerText, 'D + E -> F');
  assert.equal(document.getElementById('reaction-fact').innerText, 'Secondary example description.');

  assert.equal(document.getElementById('result-page').classList.contains('hidden'), false);
  assert.equal(document.getElementById('home-page').classList.contains('hidden'), true);
});

test('rulebook.js combine click is a no-op when no rule is selected', async () => {
  const document = createRulebookDocument();
  loadScript(rulebookPath, { document, fetchImpl: okFetch(sampleRules) });
  await flushPromises();

  const combineBtn = document.getElementById('combine-btn');
  combineBtn.onclick();

  assert.equal(document.getElementById('reaction-name').innerText, '');
  assert.equal(document.getElementById('home-page').classList.contains('hidden'), false);
});

test('rulebook.js goToHome resets state and returns to home view', async () => {
  const document = createRulebookDocument();
  const context = loadScript(rulebookPath, { document, fetchImpl: okFetch(sampleRules) });
  await flushPromises();

  const grid = document.getElementById('element-grid');
  const cards = grid.children.filter(child => child.classList.contains('rule-card'));
  const combineBtn = document.getElementById('combine-btn');

  cards[0].onclick();
  combineBtn.onclick();
  context.goToHome();

  assert.equal(combineBtn.disabled, true);
  cards.forEach(card => assert.equal(card.classList.contains('selected'), false));
  assert.equal(document.getElementById('home-page').classList.contains('hidden'), false);
  assert.equal(document.getElementById('result-page').classList.contains('hidden'), true);
});

test('rulebook.js handles fetch failure by disabling action and showing fallback message', async () => {
  const document = createRulebookDocument();
  loadScript(rulebookPath, {
    document,
    fetchImpl: () => Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) })
  });
  await flushPromises();

  const grid = document.getElementById('element-grid');
  const combineBtn = document.getElementById('combine-btn');
  assert.equal(grid.innerHTML.includes('Could not load the rulebook database.'), true);
  assert.equal(combineBtn.disabled, true);
});
