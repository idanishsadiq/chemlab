
let selectedElements = [];
let labData = { elements: [], reactions: {} };

const grid = document.getElementById('element-grid');
const combineBtn = document.getElementById('combine-btn');

function setTextById(id, value, fallback = 'Not specified in current database.') {
    const el = document.getElementById(id);
    if (el) el.innerText = value || fallback;
}

function setListById(id, items) {
    const list = document.getElementById(id);
    if (!list) return;
    list.innerHTML = '';
    const safeItems = Array.isArray(items) && items.length ? items : ['No extra notes yet for this reaction.'];
    safeItems.forEach(item => {
        const li = document.createElement('li');
        li.innerText = item;
        list.appendChild(li);
    });
}

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

fetch('elements.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to load elements.json (${response.status})`);
        }
        return response.json();
    })
    .then(data => {
        labData = data;
        renderGrid();
    })
    .catch(err => {
        console.error(err);
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
            setTextById('reaction-name', result.name, 'Reaction');
            setTextById('formula-text', result.formula);
            setTextById('reaction-info', result.info);
            setTextById('reaction-fact', result.fact);
            setTextById('reaction-conditions', result.conditions);
            setTextById('reaction-mechanism', result.mechanism);
            setTextById('reaction-applications', result.applications);
            setTextById('reaction-safety', result.safety);
            setListById('reaction-mistakes', result.common_mistakes);
            setListById('reaction-checklist', result.revision_checklist);

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
