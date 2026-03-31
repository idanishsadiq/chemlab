
let selectedRule = null;
let rulesData = {};

const grid = document.getElementById('element-grid');
const combineBtn = document.getElementById('combine-btn');

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
        const formulaText = document.getElementById('formula-text');
        const ex1Formula = document.getElementById('ex1-formula');
        const reactionInfo = document.getElementById('reaction-info');
        const ex2Formula = document.getElementById('ex2-formula');
        const reactionFact = document.getElementById('reaction-fact');

        if (reactionName) reactionName.innerText = rule.name;
        if (formulaText) formulaText.innerText = rule.theory;
        if (ex1Formula) ex1Formula.innerText = rule.example1.formula;
        if (reactionInfo) reactionInfo.innerText = rule.example1.desc;
        if (ex2Formula) ex2Formula.innerText = rule.example2.formula;
        if (reactionFact) reactionFact.innerText = rule.example2.desc;

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
