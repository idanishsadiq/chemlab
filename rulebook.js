
let selectedRule = null;
let rulesData = {};

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
    const safeItems = Array.isArray(items) && items.length ? items : ['No extra notes yet for this rule.'];
    safeItems.forEach(item => {
        const li = document.createElement('li');
        li.innerText = item;
        list.appendChild(li);
    });
}

fetch('rules.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to load rules.json (${response.status})`);
        }
        return response.json();
    })
    .then(data => {
        rulesData = data.rules || {};
        renderGrid();
    })
    .catch(err => {
        console.error(err);
        if (grid) {
            grid.innerHTML = '<div class="result-card"><p>Could not load the rulebook database.</p></div>';
        }
        if (combineBtn) combineBtn.disabled = true;
    });

function renderGrid() {
    if (!grid) return;
    grid.innerHTML = '';
    grid.className = 'rule-groups';

    const ruleGroups = [
        {
            category: 'Regioselective Rules (Position Pickers)',
            rules: ['markovnikov', 'anti_markovnikov', 'zaitsev', 'hofmann', 'kharasch']
        },
        {
            category: 'Stereochemical Rules (Shape Shifters)',
            rules: ['walden', 'bredt']
        },
        {
            category: 'Electronic & Structural Rules',
            rules: ['huckel', 'hammond', 'le_chatelier']
        }
    ];

    ruleGroups.forEach(group => {
        const heading = document.createElement('h3');
        heading.className = 'rule-group-title';
        heading.textContent = group.category;
        grid.appendChild(heading);

        group.rules.forEach(ruleId => {
            const rule = rulesData[ruleId];
            if (!rule) return;

            const item = document.createElement('div');
            item.className = 'rule-card';
            item.id = `rule-${ruleId}`;
            item.innerHTML = `<h3>${rule.name}</h3>`;
            item.onclick = () => handleSelection(ruleId, item);
            grid.appendChild(item);
        });
    });
}

function handleSelection(id, item) {
    document.querySelectorAll('.rule-card').forEach(el => el.classList.remove('selected'));
    selectedRule = id;
    item.classList.add('selected');
    if (combineBtn) combineBtn.disabled = false;
}

if (combineBtn) {
    combineBtn.onclick = () => {
        const rule = rulesData[selectedRule];
        if (!rule) return;

        const reactionName = document.getElementById('reaction-name');
        if (reactionName) reactionName.innerText = rule.name || 'Rule';
        setTextById('formula-text', rule.theory);
        setTextById('rule-keypoint', rule.keypoint);
        setTextById('rule-exam-tip', rule.exam_tip);
        setTextById('rule-when-to-apply', rule.when_to_apply);
        setTextById('ex1-formula', rule.example1?.formula);
        setTextById('reaction-info', rule.example1?.desc);
        setTextById('ex2-formula', rule.example2?.formula);
        setTextById('reaction-fact', rule.example2?.desc);
        setListById('rule-mistakes', rule.common_mistakes);
        setListById('rule-checklist', rule.revision_checklist);

        switchView('result-page');
    };
}

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    const target = document.getElementById(viewId);
    if (target) target.classList.remove('hidden');
}

function goToHome() {
    selectedRule = null;
    document.querySelectorAll('.rule-card').forEach(c => c.classList.remove('selected'));
    if (combineBtn) combineBtn.disabled = true;
    switchView('home-page');
}
