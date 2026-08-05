// Scroll positions are shared between session clients as a semantic anchor
// (section index, line index, fraction within that line) instead of pixels,
// so they survive different viewports, font sizes and layouts. Both sides
// render the same song structure, so DOM indices always agree.
const LINE_SELECTOR = ".line-with-chords, .line-without-chords";

// Viewport y-coordinate treated as the shared "reading position"; roughly
// below the session banner on all devices.
const READING_LINE_PX = 90;

export function computeScrollAnchor(sheetEl) {
	if (!sheetEl) return null;
	const sections = sheetEl.querySelectorAll(".section");
	for (let s = 0; s < sections.length; s++) {
		const lines = sections[s].querySelectorAll(LINE_SELECTOR);
		for (let l = 0; l < lines.length; l++) {
			const rect = lines[l].getBoundingClientRect();
			if (rect.height > 0 && rect.bottom > READING_LINE_PX) {
				const offset = Math.min(1, Math.max(0, (READING_LINE_PX - rect.top) / rect.height));
				return { section: s, line: l, offset: Math.round(offset * 100) / 100 };
			}
		}
	}
	return null;
}

// Returns how many pixels the local view must scroll by so the anchored line
// sits at the reading position, or null when the anchor cannot be resolved.
export function resolveScrollDelta(sheetEl, anchor) {
	if (!sheetEl || !anchor) return null;
	const sections = sheetEl.querySelectorAll(".section");
	const section = sections[anchor.section];
	if (!section) return null;
	const lines = section.querySelectorAll(LINE_SELECTOR);
	if (!lines.length) return null;
	const line = lines[Math.min(anchor.line ?? 0, lines.length - 1)];
	const rect = line.getBoundingClientRect();
	return rect.top + (anchor.offset ?? 0) * rect.height - READING_LINE_PX;
}
