
let selectedElements = [];
let labData = { elements: [], reactions: {} };
let dataSourceLabel = 'local';

const grid = document.getElementById('element-grid');
const combineBtn = document.getElementById('combine-btn');

const ONLINE_DATA_SOURCES = [
    'https://raw.githubusercontent.com/idanishsadiq/chemlab/main/elements.json',
    'https://cdn.jsdelivr.net/gh/idanishsadiq/chemlab@main/elements.json'
];

function setStatusMessage(message, isError = false) {
    const existing = document.getElementById('status-message');
    if (existing) existing.remove();

    const status = document.createElement('p');
    status.id = 'status-message';
    status.textContent = message;
    status.style.textAlign = 'center';
    status.style.marginTop = '1rem';
    status.style.fontWeight = '600';
    status.style.color = isError ? '#b91c1c' : '#1e3a8a';

    combineBtn.parentElement.appendChild(status);
}

async function fetchJsonOrThrow(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load ${url} (${response.status})`);
    }
    return response.json();
}

function normalizeReactionMap(reactions = {}) {
    const normalized = {};
    Object.entries(reactions).forEach(([key, value]) => {
        const parts = key.split('-');
        if (parts.length !== 2) return;
        const normalizedKey = getReactionKey(parts);
        normalized[normalizedKey] = value;
    });
    return normalized;
}

function updateSourceText() {
    const sourceText = document.getElementById('data-source');
    if (sourceText) {
        sourceText.textContent = `Data source: ${dataSourceLabel}`;
    }
}

async function loadLabData() {
    let localData = null;
    let remoteData = null;
    let successfulRemoteSource = '';

    try {
        localData = await fetchJsonOrThrow('elements.json');
        dataSourceLabel = 'local database';
    } catch (localErr) {
        console.warn(localErr);
    }

    for (const url of ONLINE_DATA_SOURCES) {
        try {
            remoteData = await fetchJsonOrThrow(url);
            successfulRemoteSource = url;
            break;
        } catch (remoteErr) {
            console.warn(remoteErr);
        }
    }

    if (!localData && remoteData) {
        const sourceName = successfulRemoteSource.includes('jsdelivr') ? 'CDN' : 'GitHub';
        dataSourceLabel = `online backup (${sourceName})`;
    }

    if (localData && remoteData) {
        dataSourceLabel = 'local database (online backup available)';
        console.info(`Online backup source available: ${successfulRemoteSource}`);
    }

    if (!localData && !remoteData) {
        throw new Error('Could not load reaction data from local or online sources.');
    }

    const base = localData || remoteData;
    const localReactions = localData ? normalizeReactionMap(localData.reactions) : {};
    const remoteReactions = remoteData ? normalizeReactionMap(remoteData.reactions) : {};
    const mergedReactions = { ...remoteReactions, ...localReactions };

    labData = {
        elements: base.elements || [],
        reactions: mergedReactions
    };
}

loadLabData()
    .then(() => {
        updateSourceText();
        renderGrid();
    })
    .catch(err => {
        console.error(err);
        updateSourceText();
        if (grid) {
            grid.innerHTML = '<div class="result-card"><p>Could not load the reaction database.</p></div>';
        }
        if (combineBtn) combineBtn.disabled = true;
    });

function renderGrid() {
    if (!grid) return;
    grid.innerHTML = '';

    labData.elements.forEach(el => {
        const card = document.createElement('div');
        card.className = 'element-card';
        card.setAttribute('data-id', el.id);
        card.innerHTML = `
            <img src="${el.img}" alt="${el.symbol}" loading="lazy">
            <h3>${el.symbol}</h3>
            <p>${el.name}</p>
        `;
        card.onclick = () => handleSelection(el.id, card);
        grid.appendChild(card);
    });
}

function handleSelection(id, cardElement) {
    const existingMessage = document.getElementById('status-message');
    if (existingMessage) existingMessage.remove();

    if (selectedElements.includes(id)) {
        selectedElements = selectedElements.filter(item => item !== id);
        cardElement.classList.remove('selected');
    } else if (selectedElements.length < 2) {
        selectedElements.push(id);
        cardElement.classList.add('selected');
    } else {
        setStatusMessage('Select only two functional groups at a time.', true);
    }

    if (combineBtn) combineBtn.disabled = selectedElements.length !== 2;
}

function getReactionKey(ids) {
    return ids.slice().sort().join('-');
}

if (combineBtn) {
    combineBtn.onclick = () => {
        const reactionKey = getReactionKey(selectedElements);
        const result = labData.reactions?.[reactionKey];

        if (result) {
            const reactionName = document.getElementById('reaction-name');
            const formulaText = document.getElementById('formula-text');
            const info = document.getElementById('reaction-info');
            const fact = document.getElementById('reaction-fact');

            if (reactionName) reactionName.innerText = result.name;
            if (formulaText) formulaText.innerText = result.formula;
            if (info) info.innerText = result.info;
            if (fact) fact.innerText = result.fact;

            switchView('result-page');
        } else {
            setStatusMessage("These functional groups don't react in the current database. Try another pair.", true);
        }
    };
}

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    const target = document.getElementById(viewId);
    if (target) target.classList.remove('hidden');
}

function goToHome() {
    selectedElements = [];
    document.querySelectorAll('.element-card').forEach(c => c.classList.remove('selected'));
    if (combineBtn) combineBtn.disabled = true;
    const message = document.getElementById('status-message');
    if (message) message.remove();
    switchView('home-page');
}
