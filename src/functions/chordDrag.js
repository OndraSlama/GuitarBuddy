import { EditorView } from "@codemirror/view";

const DRAG_THRESHOLD_PX = 5;
const EDGE_ZONE_PX = 36;
const EDGE_STEP_PX = 14;
const EDGE_INTERVAL_MS = 50;

// Drag-and-drop for chord tokens inside the CodeMirror editor. Implemented
// with manual pointer tracking instead of HTML5 drag events because those do
// not work on touch devices, where moving a chord is the most painful.
//
// In brackets mode a [Chord] token can be dropped anywhere in the text. In
// chords-above mode a bare chord moves between chord lines by column;
// dropping it on a lyrics line targets the chord line above it (creating one
// when missing). Chord lines emptied by the move are removed entirely, since
// a leftover blank line would split the song into two sections when parsed.
export function chordDrag({ chordsAbove, bracketRegex, bareRegex, isChordLine }) {
	const session = {
		view: null,
		token: null,
		startX: 0,
		startY: 0,
		lastX: 0,
		lastY: 0,
		dragging: false,
		ghost: null,
		scrollTimer: null,
		unbind: null,
	};

	function findToken(view, pos) {
		const line = view.state.doc.lineAt(pos);
		if (chordsAbove && !isChordLine(line.text)) return null;
		const regex = chordsAbove ? bareRegex : bracketRegex;
		for (const match of line.text.matchAll(regex)) {
			const from = line.from + match.index;
			const to = from + match[0].length;
			if (pos >= from && pos <= to) return { from, to, text: match[0] };
		}
		return null;
	}

	// Keeps a drop position in brackets mode from landing inside another token
	function snapOutOfTokens(view, pos) {
		const line = view.state.doc.lineAt(pos);
		for (const match of line.text.matchAll(bracketRegex)) {
			const from = line.from + match.index;
			const to = from + match[0].length;
			if (pos > from && pos < to) return to;
		}
		return pos;
	}

	function start(view, x, y) {
		const pos = view.posAtCoords({ x, y });
		if (pos == null) return false;
		const token = findToken(view, pos);
		if (!token) return false;

		session.view = view;
		session.token = token;
		session.startX = session.lastX = x;
		session.startY = session.lastY = y;
		return true;
	}

	function beginDrag() {
		session.dragging = true;

		const ghost = document.createElement("div");
		ghost.textContent = session.token.text;
		Object.assign(ghost.style, {
			position: "fixed",
			zIndex: "10000",
			pointerEvents: "none",
			transform: "translate(-50%, -150%)",
			fontFamily: '"Roboto Mono", monospace',
			fontSize: "14px",
			fontWeight: "500",
			color: "#d32f2f",
			background: "rgba(255, 255, 255, 0.95)",
			border: "1px solid rgba(211, 47, 47, 0.4)",
			borderRadius: "4px",
			padding: "2px 6px",
			boxShadow: "0 2px 6px rgba(0, 0, 0, 0.25)",
		});
		document.body.appendChild(ghost);
		session.ghost = ghost;

		document.body.style.userSelect = "none";
		document.body.style.webkitUserSelect = "none";
		document.body.style.cursor = "grabbing";

		session.scrollTimer = setInterval(() => {
			const rect = session.view.scrollDOM.getBoundingClientRect();
			if (session.lastY < rect.top + EDGE_ZONE_PX) {
				session.view.scrollDOM.scrollTop -= EDGE_STEP_PX;
			} else if (session.lastY > rect.bottom - EDGE_ZONE_PX) {
				session.view.scrollDOM.scrollTop += EDGE_STEP_PX;
			} else {
				return;
			}
			updateDropIndicator();
		}, EDGE_INTERVAL_MS);
	}

	function updateDropIndicator() {
		const pos = session.view.posAtCoords({ x: session.lastX, y: session.lastY });
		if (pos == null) return;
		const target = chordsAbove ? pos : snapOutOfTokens(session.view, pos);
		session.view.dispatch({ selection: { anchor: target } });
	}

	function onMove(x, y) {
		session.lastX = x;
		session.lastY = y;
		if (!session.dragging) {
			if (Math.hypot(x - session.startX, y - session.startY) < DRAG_THRESHOLD_PX) return;
			beginDrag();
		}
		session.ghost.style.left = x + "px";
		session.ghost.style.top = y + "px";
		updateDropIndicator();
	}

	function onEnd(x, y) {
		if (!session.dragging) {
			// Plain click on a chord: place the cursor as the editor would
			const pos = session.view.posAtCoords({ x, y });
			if (pos != null) session.view.dispatch({ selection: { anchor: pos } });
			session.view.focus();
		} else {
			drop(x, y);
		}
		cleanup();
	}

	function drop(x, y) {
		const view = session.view;
		const pos = view.posAtCoords({ x, y });
		if (pos == null) return;

		if (chordsAbove) {
			dropAbove(view, pos, x);
		} else {
			dropBrackets(view, pos);
		}
		view.focus();
	}

	function dropBrackets(view, rawPos) {
		const { from, to, text } = session.token;
		const pos = snapOutOfTokens(view, rawPos);
		if (pos >= from && pos <= to) return;

		const changes = view.state.changes([{ from, to }, { from: pos, insert: text }]);
		view.dispatch({
			changes,
			selection: { anchor: changes.mapPos(pos, 1) },
			userEvent: "move.chord",
		});
	}

	function dropAbove(view, pos, x) {
		const { doc } = view.state;
		const token = session.token;
		const sourceLine = doc.lineAt(token.from);
		const dropLine = doc.lineAt(pos);

		const lineStart = view.coordsAtPos(dropLine.from);
		const left = lineStart ? lineStart.left : view.contentDOM.getBoundingClientRect().left;
		const column = Math.max(0, Math.round((x - left) / view.defaultCharacterWidth));

		let targetLine = null;
		if (isChordLine(dropLine.text)) {
			targetLine = dropLine;
		} else if (dropLine.number > 1) {
			const previous = doc.line(dropLine.number - 1);
			if (isChordLine(previous.text)) targetLine = previous;
		}

		// Other chords on the line keep their columns: the moved chord leaves
		// spaces behind and overwrites spaces where it lands when possible
		const relFrom = token.from - sourceLine.from;
		const relTo = token.to - sourceLine.from;
		const withoutToken = sourceLine.text.slice(0, relFrom) + " ".repeat(relTo - relFrom) + sourceLine.text.slice(relTo);

		let changeSpec;
		if (targetLine && targetLine.number === sourceLine.number) {
			const newText = rightTrim(placeAtColumn(withoutToken, column, token.text));
			changeSpec = [{ from: sourceLine.from, to: sourceLine.to, insert: newText }];
		} else {
			const cleaned = rightTrim(withoutToken);
			changeSpec = [];
			if (cleaned.length === 0) {
				if (sourceLine.to < doc.length) changeSpec.push({ from: sourceLine.from, to: sourceLine.to + 1 });
				else changeSpec.push({ from: Math.max(0, sourceLine.from - 1), to: sourceLine.to });
			} else {
				changeSpec.push({ from: sourceLine.from, to: sourceLine.to, insert: cleaned });
			}
			if (targetLine) {
				changeSpec.push({ from: targetLine.from, to: targetLine.to, insert: placeAtColumn(targetLine.text, column, token.text) });
			} else {
				changeSpec.push({ from: dropLine.from, insert: " ".repeat(column) + token.text + "\n" });
			}
		}

		const changes = view.state.changes(changeSpec);
		view.dispatch({
			changes,
			selection: { anchor: changes.mapPos(pos, 1) },
			userEvent: "move.chord",
		});
	}

	function cleanup() {
		if (session.ghost) session.ghost.remove();
		if (session.scrollTimer) clearInterval(session.scrollTimer);
		if (session.unbind) session.unbind();
		document.body.style.userSelect = "";
		document.body.style.webkitUserSelect = "";
		document.body.style.cursor = "";
		session.view = null;
		session.token = null;
		session.dragging = false;
		session.ghost = null;
		session.scrollTimer = null;
		session.unbind = null;
	}

	function bindWindow(kind) {
		const abort = () => cleanup();
		const onKeyDown = (event) => {
			if (event.key === "Escape") cleanup();
		};

		let listeners;
		if (kind === "mouse") {
			const move = (event) => onMove(event.clientX, event.clientY);
			const up = (event) => onEnd(event.clientX, event.clientY);
			listeners = [
				["mousemove", move, {}],
				["mouseup", up, {}],
				["blur", abort, {}],
				["keydown", onKeyDown, {}],
			];
		} else {
			const move = (event) => {
				const touch = event.touches[0];
				if (!touch) return;
				if (session.dragging && event.cancelable) event.preventDefault();
				onMove(touch.clientX, touch.clientY);
			};
			const end = (event) => {
				const touch = event.changedTouches[0];
				if (touch) onEnd(touch.clientX, touch.clientY);
				else cleanup();
			};
			listeners = [
				["touchmove", move, { passive: false }],
				["touchend", end, {}],
				["touchcancel", abort, {}],
			];
		}

		listeners.forEach(([name, handler, options]) => window.addEventListener(name, handler, options));
		session.unbind = () => listeners.forEach(([name, handler, options]) => window.removeEventListener(name, handler, options));
	}

	function onChordToken(event) {
		return event.target instanceof Element && event.target.closest(".cm-chord-highlight") !== null;
	}

	return EditorView.domEventHandlers({
		mousedown(event, view) {
			if (event.button !== 0 || !onChordToken(event)) return false;
			if (!start(view, event.clientX, event.clientY)) return false;
			bindWindow("mouse");
			event.preventDefault();
			return true;
		},
		touchstart(event, view) {
			if (event.touches.length !== 1 || !onChordToken(event)) return false;
			const touch = event.touches[0];
			if (!start(view, touch.clientX, touch.clientY)) return false;
			bindWindow("touch");
			if (event.cancelable) event.preventDefault();
			return true;
		},
	});
}

function rightTrim(text) {
	return text.replace(/\s+$/, "");
}

// Inserts a chord at the given column, consuming existing spaces so chords
// further right keep their alignment, and padding when the line is shorter
function placeAtColumn(lineText, column, chord) {
	if (column >= lineText.length) {
		const padded = lineText + " ".repeat(column - lineText.length);
		const separator = padded.length > 0 && !padded.endsWith(" ") ? " " : "";
		return padded + separator + chord;
	}

	const before = lineText.slice(0, column);
	const after = lineText.slice(column);

	let eaten = 0;
	while (eaten < after.length && eaten <= chord.length && after[eaten] === " ") eaten++;
	let rest = after.slice(eaten);

	const head = before.length > 0 && !before.endsWith(" ") ? before + " " : before;
	if (rest.length > 0 && rest[0] !== " ") rest = " " + rest;

	return head + chord + rest;
}
