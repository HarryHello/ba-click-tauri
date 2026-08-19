import { emit } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  QUALITY_PRESETS,
} from './settings.js';

const $ = (id) => document.getElementById(id);
const statusEl = $('status');
let statusTimer = null;

function showStatus(message) {
  statusEl.textContent = message;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    statusEl.textContent = '';
  }, 1200);
}

function send(payload) {
  emit('panel-command', payload);
  persistSettings();
  showStatus('已应用');
}

function num(id) {
  return Number.parseFloat($(id).value);
}

function fmt(value, digits = 2) {
  return Number(value).toFixed(digits);
}

function collectSettings() {
  return {
    enabled: $('enabled').checked,
    scale: num('scale'),
    opacity: num('opacity'),
    clickTime: num('click-time'),
    trailAlways: $('trail-always').checked,
    trailWidth: num('trail-width'),
    bloom: num('bloom'),
    refreshRate: Number($('refresh-rate').value),
    quality: $('quality').value,
    vibrancyMaterial: $('vibrancy-material').value,
  };
}

function persistSettings() {
  saveSettings(collectSettings());
}

function applyToDom(settings) {
  $('enabled').checked = settings.enabled;
  $('scale').value = String(settings.scale);
  $('opacity').value = String(settings.opacity);
  $('click-time').value = String(settings.clickTime);
  $('trail-always').checked = settings.trailAlways;
  $('trail-width').value = String(settings.trailWidth);
  $('bloom').value = String(settings.bloom);
  $('refresh-rate').value = String(settings.refreshRate);
  $('quality').value = settings.quality;
  $('vibrancy-material').value = settings.vibrancyMaterial;

  $('scale-value').textContent = `${fmt(settings.scale)}×`;
  $('opacity-value').textContent = `${Math.round(settings.opacity * 100)}%`;
  $('click-time-value').textContent = `${fmt(settings.clickTime)}×`;
  $('trail-width-value').textContent = fmt(settings.trailWidth, 1);
  $('bloom-value').textContent = fmt(settings.bloom);
}

function sendEnabled() {
  const value = $('enabled').checked;
  send({
    type: 'updateConfig',
    payload: { clickEnabled: value, trailEnabled: value },
  });
}

function sendScale() {
  const value = num('scale');
  $('scale-value').textContent = `${fmt(value)}×`;
  send({ type: 'updateConfig', payload: { scale: value } });
}

function sendOpacity() {
  const value = num('opacity');
  $('opacity-value').textContent = `${Math.round(value * 100)}%`;
  send({
    type: 'setFxParams',
    payload: {
      'bloom.diskEmission': +(1.0 * value).toFixed(3),
      'bloom.diskEmissionAlpha': +(0.6 * value).toFixed(3),
      'shards.hdrIntensity': +(5.99 * value).toFixed(3),
    },
  });
}

function sendClickTime() {
  const value = num('click-time');
  $('click-time-value').textContent = `${fmt(value)}×`;
  send({ type: 'updateConfig', payload: { clickTimeScale: value } });
}

function sendTrailAlways() {
  send({ type: 'updateConfig', payload: { trailAlways: $('trail-always').checked } });
}

function sendTrailWidth() {
  const value = num('trail-width');
  $('trail-width-value').textContent = fmt(value, 1);
  send({
    type: 'setFxParams',
    payload: {
      'trail.width': value,
      'trail.geometryWidth': value,
    },
  });
}

function sendBloom() {
  const value = num('bloom');
  $('bloom-value').textContent = fmt(value);
  send({ type: 'setFxParams', payload: { 'bloom.intensity': value } });
}

function sendRefreshRate() {
  send({
    type: 'updateConfig',
    payload: { inputSamplingRate: Number($('refresh-rate').value) },
  });
}

function sendQuality() {
  const preset = QUALITY_PRESETS[$('quality').value];
  send({
    type: 'setFxParams',
    payload: { 'bloom.resolutionScale': preset.resolutionScale },
  });
  send({
    type: 'updateConfig',
    payload: { maxDpr: preset.maxDpr },
  });
}

async function sendVibrancyMaterial() {
  const material = $('vibrancy-material').value;
  persistSettings();
  try {
    await invoke('set_panel_material', { material });
    showStatus('毛玻璃已更新');
  } catch (error) {
    console.error('Failed to set panel material', error);
    showStatus('毛玻璃更新失败');
  }
}

function resetDefaults() {
  applyToDom(DEFAULT_SETTINGS);
  saveSettings(DEFAULT_SETTINGS);
  emit('panel-command', { type: 'reset' });
  invoke('set_panel_material', { material: DEFAULT_SETTINGS.vibrancyMaterial }).catch(
    (error) => {
      console.error('Failed to reset panel material', error);
    },
  );
  showStatus('已恢复默认');
}

// Restore the saved UI state and panel material on load.
applyToDom(loadSettings());
invoke('set_panel_material', { material: $('vibrancy-material').value }).catch(
  (error) => {
    console.error('Failed to restore panel material', error);
  },
);

$('enabled').addEventListener('change', sendEnabled);
$('scale').addEventListener('input', sendScale);
$('opacity').addEventListener('input', sendOpacity);
$('click-time').addEventListener('input', sendClickTime);
$('trail-always').addEventListener('change', sendTrailAlways);
$('trail-width').addEventListener('input', sendTrailWidth);
$('bloom').addEventListener('input', sendBloom);
$('refresh-rate').addEventListener('change', sendRefreshRate);
$('quality').addEventListener('change', sendQuality);
$('vibrancy-material').addEventListener('change', sendVibrancyMaterial);
$('reset').addEventListener('click', resetDefaults);
