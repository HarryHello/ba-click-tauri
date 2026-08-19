import test from 'node:test';
import assert from 'node:assert/strict';

// Node has no localStorage; provide a minimal in-memory shim before importing.
const store = new Map();
globalThis.localStorage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
};

const { DEFAULT_SETTINGS, loadSettings, saveSettings } = await import('../src/settings.js');

test('loadSettings returns defaults when nothing is stored', () => {
  store.clear();
  const settings = loadSettings();
  assert.deepEqual({ ...settings }, { ...DEFAULT_SETTINGS });
});

test('saveSettings + loadSettings round-trips partial settings', () => {
  store.clear();
  saveSettings({ ...DEFAULT_SETTINGS, opacity: 0.5, trailWidth: 6 });
  const settings = loadSettings();

  assert.equal(settings.opacity, 0.5);
  assert.equal(settings.trailWidth, 6);
  // unspecified fields fall back to defaults
  assert.equal(settings.bloom, DEFAULT_SETTINGS.bloom);
  assert.equal(settings.refreshRate, DEFAULT_SETTINGS.refreshRate);
});

test('loadSettings falls back to defaults on corrupted JSON', () => {
  store.clear();
  store.set('bafx-settings', '{not valid json');
  const settings = loadSettings();
  assert.deepEqual({ ...settings }, { ...DEFAULT_SETTINGS });
});

test('defaults are frozen', () => {
  assert.equal(Object.isFrozen(DEFAULT_SETTINGS), true);
});
