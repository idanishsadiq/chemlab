const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const {
  createAppDocument,
  loadScript,
  flushPromises
} = require('./helpers/testHarness');

const scriptPath = path.join(__dirname, '..', 'script.js');

const sampleData = {
  elements: [
    { id: 'alkene', symbol: 'C=C', name: 'Alkene', img: 'alkene.jpg' },
    { id: 'hbr', symbol: 'HBr', name: 'Hydrobromic Acid', img: 'hbr.jpg' },
    { id: 'h2', symbol: 'H2', name: 'Hydrogen', img: 'h2.jpg' }
  ],
  reactions: {
    'alkene-hbr': {
      name: 'Hydrohalogenation',
      formula: 'C=C + HBr -> Alkyl Bromide',
      info: 'Electrophilic addition to the double bond.',
      fact: 'Follows Markovnikov conditions without peroxides.'
    }
  }
};

function okFetch(data) {
  return () => Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data)
  });
}

test('script.js renders elements from fetch data and keeps combine disabled initially', async () => {
  const document = createAppDocument();
  loadScript(scriptPath, { document, fetchImpl: okFetch(sampleData) });
  await flushPromises();

  const grid = document.getElementById('element-grid');
  const cards = grid.children.filter(child => child.classList.contains('element-card'));
  const combineBtn = document.getElementById('combine-btn');

  assert.equal(cards.length, 3);
  assert.equal(combineBtn.disabled, true);
});

test('script.js supports select, deselect, and enforces two-card selection limit', async () => {
  const document = createAppDocument();
  loadScript(scriptPath, { document, fetchImpl: okFetch(sampleData) });
  await flushPromises();

  const grid = document.getElementById('element-grid');
  const cards = grid.children.filter(child => child.classList.contains('element-card'));
  const combineBtn = document.getElementById('combine-btn');

  cards[0].onclick();
  assert.equal(combineBtn.disabled, true);
  assert.equal(cards[0].classList.contains('selected'), true);

  cards[1].onclick();
  assert.equal(combineBtn.disabled, false);
  assert.equal(cards[1].classList.contains('selected'), true);

  cards[2].onclick();
  const status = document.getElementById('status-message');
  assert.ok(status);
  assert.equal(status.textContent, 'Select only two functional groups at a time.');
  assert.equal(cards[2].classList.contains('selected'), false);

  cards[1].onclick();
  assert.equal(cards[1].classList.contains('selected'), false);
  assert.equal(combineBtn.disabled, true);
});

test('script.js combines a valid pair, writes result content, and switches to result view', async () => {
  const document = createAppDocument();
  loadScript(scriptPath, { document, fetchImpl: okFetch(sampleData) });
  await flushPromises();

  const grid = document.getElementById('element-grid');
  const cards = grid.children.filter(child => child.classList.contains('element-card'));
  const combineBtn = document.getElementById('combine-btn');

  cards[0].onclick();
  cards[1].onclick();
  combineBtn.onclick();

  assert.equal(document.getElementById('reaction-name').innerText, 'Hydrohalogenation');
  assert.equal(document.getElementById('formula-text').innerText, 'C=C + HBr -> Alkyl Bromide');
  assert.equal(document.getElementById('reaction-info').innerText, 'Electrophilic addition to the double bond.');
  assert.equal(document.getElementById('reaction-fact').innerText, 'Follows Markovnikov conditions without peroxides.');

  assert.equal(document.getElementById('result-page').classList.contains('hidden'), false);
  assert.equal(document.getElementById('home-page').classList.contains('hidden'), true);
});

test('script.js shows error for unknown reaction and keeps current view', async () => {
  const document = createAppDocument();
  loadScript(scriptPath, { document, fetchImpl: okFetch(sampleData) });
  await flushPromises();

  const grid = document.getElementById('element-grid');
  const cards = grid.children.filter(child => child.classList.contains('element-card'));
  const combineBtn = document.getElementById('combine-btn');

  cards[0].onclick();
  cards[2].onclick();
  combineBtn.onclick();

  const status = document.getElementById('status-message');
  assert.ok(status);
  assert.equal(status.textContent, "These functional groups don't react in the current database. Try another pair.");
  assert.equal(document.getElementById('home-page').classList.contains('hidden'), false);
});

test('script.js goToHome clears selections, status, disables button, and returns home view', async () => {
  const document = createAppDocument();
  const context = loadScript(scriptPath, { document, fetchImpl: okFetch(sampleData) });
  await flushPromises();

  const grid = document.getElementById('element-grid');
  const cards = grid.children.filter(child => child.classList.contains('element-card'));
  const combineBtn = document.getElementById('combine-btn');

  cards[0].onclick();
  cards[1].onclick();
  combineBtn.onclick();

  const dock = combineBtn.parentElement;
  const fakeStatus = document.createElement('p');
  fakeStatus.id = 'status-message';
  dock.appendChild(fakeStatus);

  context.goToHome();

  assert.equal(combineBtn.disabled, true);
  assert.equal(document.getElementById('status-message'), null);
  cards.forEach(card => assert.equal(card.classList.contains('selected'), false));
  assert.equal(document.getElementById('home-page').classList.contains('hidden'), false);
  assert.equal(document.getElementById('result-page').classList.contains('hidden'), true);
});

test('script.js handles fetch failure by disabling combine button and rendering fallback message', async () => {
  const document = createAppDocument();
  loadScript(scriptPath, {
    document,
    fetchImpl: () => Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })
  });
  await flushPromises();

  const grid = document.getElementById('element-grid');
  const combineBtn = document.getElementById('combine-btn');
  assert.equal(grid.innerHTML.includes('Could not load the reaction database.'), true);
  assert.equal(combineBtn.disabled, true);
});
