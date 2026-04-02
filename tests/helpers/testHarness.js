const fs = require('node:fs');
const vm = require('node:vm');

class ClassList {
  constructor(element) {
    this.element = element;
    this.set = new Set();
  }

  _sync() {
    this.element._className = Array.from(this.set).join(' ');
  }

  add(...classes) {
    classes.forEach(cls => {
      if (cls) this.set.add(cls);
    });
    this._sync();
  }

  remove(...classes) {
    classes.forEach(cls => this.set.delete(cls));
    this._sync();
  }

  contains(cls) {
    return this.set.has(cls);
  }
}

class Element {
  constructor(tagName, document) {
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = document;
    this.parentElement = null;
    this.children = [];
    this.attributes = {};
    this.style = {};
    this.onclick = null;
    this.disabled = false;
    this._id = '';
    this._className = '';
    this.classList = new ClassList(this);
    this._textContent = '';
    this._innerHTML = '';
  }

  get id() {
    return this._id;
  }

  set id(value) {
    const next = String(value || '');
    if (this._id) this.ownerDocument._idMap.delete(this._id);
    this._id = next;
    if (next) this.ownerDocument._idMap.set(next, this);
  }

  get className() {
    return this._className;
  }

  set className(value) {
    const classes = String(value || '').trim().split(/\s+/).filter(Boolean);
    this.classList.set = new Set(classes);
    this.classList._sync();
  }

  get textContent() {
    return this._textContent;
  }

  set textContent(value) {
    this._textContent = String(value ?? '');
  }

  get innerText() {
    return this._textContent;
  }

  set innerText(value) {
    this._textContent = String(value ?? '');
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(value) {
    this.children.forEach(child => this.ownerDocument._removeIdsDeep(child));
    this.children = [];
    this._innerHTML = String(value ?? '');
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    this.ownerDocument._registerIdsDeep(child);
    return child;
  }

  remove() {
    if (!this.parentElement) return;
    const parent = this.parentElement;
    parent.children = parent.children.filter(child => child !== this);
    this.parentElement = null;
    this.ownerDocument._removeIdsDeep(this);
  }

  setAttribute(name, value) {
    const normalized = String(value ?? '');
    this.attributes[name] = normalized;
    if (name === 'id') this.id = normalized;
    if (name === 'class') this.className = normalized;
  }

  getAttribute(name) {
    return this.attributes[name];
  }
}

class Document {
  constructor() {
    this._idMap = new Map();
    this.body = new Element('body', this);
  }

  createElement(tagName) {
    return new Element(tagName, this);
  }

  getElementById(id) {
    return this._idMap.get(id) || null;
  }

  _registerIdsDeep(element) {
    if (element.id) this._idMap.set(element.id, element);
    element.children.forEach(child => this._registerIdsDeep(child));
  }

  _removeIdsDeep(element) {
    if (element.id) this._idMap.delete(element.id);
    element.children.forEach(child => this._removeIdsDeep(child));
  }

  querySelectorAll(selector) {
    if (!selector.startsWith('.')) return [];
    const className = selector.slice(1);
    const results = [];
    const visit = node => {
      if (node.classList.contains(className)) results.push(node);
      node.children.forEach(visit);
    };
    visit(this.body);
    return results;
  }
}

function append(parent, child) {
  parent.appendChild(child);
  return child;
}

function createAppDocument() {
  const document = new Document();

  const home = document.createElement('section');
  home.id = 'home-page';
  home.className = 'view';

  const grid = document.createElement('div');
  grid.id = 'element-grid';
  append(home, grid);

  const dock = document.createElement('div');
  const combineBtn = document.createElement('button');
  combineBtn.id = 'combine-btn';
  combineBtn.disabled = true;
  append(dock, combineBtn);
  append(home, dock);

  const result = document.createElement('section');
  result.id = 'result-page';
  result.className = 'view hidden';

  const reactionName = document.createElement('h2');
  reactionName.id = 'reaction-name';
  append(result, reactionName);

  const formulaText = document.createElement('span');
  formulaText.id = 'formula-text';
  append(result, formulaText);

  const reactionInfo = document.createElement('p');
  reactionInfo.id = 'reaction-info';
  append(result, reactionInfo);

  const reactionFact = document.createElement('span');
  reactionFact.id = 'reaction-fact';
  append(result, reactionFact);

  append(document.body, home);
  append(document.body, result);

  return document;
}

function createRulebookDocument() {
  const document = new Document();

  const home = document.createElement('section');
  home.id = 'home-page';
  home.className = 'view';

  const grid = document.createElement('div');
  grid.id = 'element-grid';
  append(home, grid);

  const dock = document.createElement('div');
  const combineBtn = document.createElement('button');
  combineBtn.id = 'combine-btn';
  combineBtn.disabled = true;
  append(dock, combineBtn);
  append(home, dock);

  const result = document.createElement('section');
  result.id = 'result-page';
  result.className = 'view hidden';

  const ids = ['reaction-name', 'formula-text', 'ex1-formula', 'reaction-info', 'ex2-formula', 'reaction-fact'];
  ids.forEach(id => {
    const el = document.createElement('div');
    el.id = id;
    append(result, el);
  });

  append(document.body, home);
  append(document.body, result);

  return document;
}

function loadScript(scriptPath, { document, fetchImpl }) {
  const context = {
    document,
    fetch: fetchImpl,
    console,
    setTimeout,
    clearTimeout
  };
  vm.createContext(context);
  const source = fs.readFileSync(scriptPath, 'utf8');
  vm.runInContext(source, context, { filename: scriptPath });
  return context;
}

function flushPromises() {
  return new Promise(resolve => setImmediate(resolve));
}

module.exports = {
  createAppDocument,
  createRulebookDocument,
  loadScript,
  flushPromises
};
