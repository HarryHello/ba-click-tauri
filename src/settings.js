// Shared settings persistence for the management panel.
// The Tauri webviews share the same origin, so localStorage works across the
// overlay window and the panel window.

export const STORAGE_KEY = 'bafx-settings';

export const DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  scale: 1,
  opacity: 0.35,
  clickTime: 1,
  trailAlways: true,
  trailWidth: 4,
  bloom: 1.7,
  refreshRate: 60,
  quality: 'balanced',
  vibrancyMaterial: 'hud',
});

export const QUALITY_PRESETS = Object.freeze({
  low: { resolutionScale: 0.2, maxDpr: 1 },
  balanced: { resolutionScale: 0.3, maxDpr: 2 },
  high: { resolutionScale: 0.5, maxDpr: 2 },
});

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings', error);
  }
}
