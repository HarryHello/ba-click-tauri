import { emit } from '@tauri-apps/api/event';

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
  showStatus('已应用');
}

function num(id) {
  return Number.parseFloat($(id).value);
}

function fmt(value, digits = 2) {
  return Number(value).toFixed(digits);
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
      'bloom.diskEmission': +(0.7 * value).toFixed(3),
      'bloom.diskEmissionAlpha': +(0.5 * value).toFixed(3),
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

const QUALITY = Object.freeze({
  low: { 'bloom.resolutionScale': 0.2, maxDpr: 1 },
  balanced: { 'bloom.resolutionScale': 0.3, maxDpr: 1 },
  high: { 'bloom.resolutionScale': 0.45, maxDpr: 2 },
});

function sendQuality() {
  const preset = QUALITY[$('quality').value];
  send({
    type: 'setFxParams',
    payload: { 'bloom.resolutionScale': preset['bloom.resolutionScale'] },
  });
  send({
    type: 'updateConfig',
    payload: { maxDpr: preset.maxDpr },
  });
}

function resetDefaults() {
  $('enabled').checked = true;
  $('scale').value = '1';
  $('opacity').value = '1';
  $('click-time').value = '1';
  $('trail-always').checked = true;
  $('trail-width').value = '4';
  $('bloom').value = '1.7';
  $('refresh-rate').value = '60';
  $('quality').value = 'balanced';

  $('scale-value').textContent = '1.00×';
  $('opacity-value').textContent = '100%';
  $('click-time-value').textContent = '1.00×';
  $('trail-width-value').textContent = '4.0';
  $('bloom-value').textContent = '1.70';

  emit('panel-command', { type: 'reset' });
  showStatus('已恢复默认');
}

$('enabled').addEventListener('change', sendEnabled);
$('scale').addEventListener('input', sendScale);
$('opacity').addEventListener('input', sendOpacity);
$('click-time').addEventListener('input', sendClickTime);
$('trail-always').addEventListener('change', sendTrailAlways);
$('trail-width').addEventListener('input', sendTrailWidth);
$('bloom').addEventListener('input', sendBloom);
$('refresh-rate').addEventListener('change', sendRefreshRate);
$('quality').addEventListener('change', sendQuality);
$('reset').addEventListener('click', resetDefaults);