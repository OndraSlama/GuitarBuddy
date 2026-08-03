const STORAGE_KEY = "guitarbuddy.viewPreferences";

export const FONT_SIZE_MIN = 12;
export const FONT_SIZE_MAX = 32;

export const defaultViewPreferences = {
	fontSizePx: 16,
	notation: "German (A H C D E F G)",
	multipleColumns: true,
	showTabs: true,
	scrollSpeed: 40,
};

export function loadViewPreferences() {
	try {
		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
		const preferences = { ...defaultViewPreferences, ...(stored || {}) };
		preferences.fontSizePx = Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, Number(preferences.fontSizePx) || defaultViewPreferences.fontSizePx));
		return preferences;
	} catch {
		return { ...defaultViewPreferences };
	}
}

export function saveViewPreferences(preferences) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
	} catch {
		// localStorage unavailable (private mode, quota); preferences stay session-only
	}
}
