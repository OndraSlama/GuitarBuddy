<template>
	<div class="chord-text-editor">
		<div class="editor-toolbar">
			<!-- Chord Mode Toggle -->
			<v-tooltip location="bottom">
				<template v-slot:activator="{ props: tooltipProps }">
					<v-btn-toggle v-model="chordMode" mandatory class="mr-3" v-bind="tooltipProps" density="compact">
						<v-btn value="brackets" size="small">
							<v-icon size="small">mdi-code-brackets</v-icon>
						</v-btn>
						<v-btn value="above" size="small">
							<v-icon size="small">mdi-arrow-up</v-icon>
						</v-btn>
					</v-btn-toggle>
				</template>
				<span>{{ chordMode === 'brackets' ? 'Chords in [brackets]' : 'Chords above text' }}</span>
			</v-tooltip>

			<v-divider vertical class="mx-2"></v-divider>

			<!-- Notation Toggle -->
			<v-tooltip location="bottom">
				<template v-slot:activator="{ props: tooltipProps }">
					<v-btn-toggle v-model="notationMode" mandatory class="mr-3" v-bind="tooltipProps" density="compact">
						<v-btn value="german" size="small">
							<v-icon size="small">mdi-alpha-h</v-icon>
						</v-btn>
						<v-btn value="standard" size="small">
							<v-icon size="small">mdi-alpha-b</v-icon>
						</v-btn>
					</v-btn-toggle>
				</template>
				<span>{{ notationMode === 'standard' ? 'Standard notation (A B C D E F G)' : 'German notation (A H C D E F G)' }}</span>
			</v-tooltip>

			<v-divider vertical class="mx-2"></v-divider>

			<!-- Additional Tools -->
			<v-tooltip location="bottom">
				<template v-slot:activator="{ props: tooltipProps }">
					<v-btn icon size="small" variant="text" @click="trimLinesActive = !trimLinesActive" v-bind="tooltipProps" :color="trimLinesActive ? 'primary' : ''">
						<v-icon size="small">mdi-format-horizontal-align-left</v-icon>
					</v-btn>
				</template>
				<span>Trim lines</span>
			</v-tooltip>

			<v-tooltip location="bottom">
				<template v-slot:activator="{ props: tooltipProps }">
					<v-btn icon size="small" variant="text" @click="fixChordAlignment" :disabled="chordMode !== 'above'" v-bind="tooltipProps">
						<v-icon size="small">mdi-format-align-bottom</v-icon>
					</v-btn>
				</template>
				<span>Fix chord alignment (experimental)</span>
			</v-tooltip>

			<v-tooltip location="bottom">
				<template v-slot:activator="{ props: tooltipProps }">
					<v-btn icon size="small" variant="text" @click="convertChordsToChordPro" :disabled="chordMode !== 'above'" v-bind="tooltipProps">
						<v-icon size="small">mdi-code-brackets</v-icon>
					</v-btn>
				</template>
				<span>Convert to ChordPro format</span>
			</v-tooltip>

			<v-spacer></v-spacer>

			<!-- Insert Chord Shortcut -->
			<v-tooltip location="bottom" v-if="chordMode === 'brackets'">
				<template v-slot:activator="{ props: tooltipProps }">
					<v-btn icon size="small" variant="text" @click="insertChordBrackets" v-bind="tooltipProps">
						<v-icon size="small">mdi-plus</v-icon>
					</v-btn>
				</template>
				<span>Insert chord brackets (Ctrl+K / ⌘+K)</span>
			</v-tooltip>
		</div>

		<!-- CodeMirror Editor -->
		<div class="editor-container">
			<codemirror
				v-model="content"
				:extensions="editorExtensions"
				placeholder="Start typing your song lyrics and chords here..."
				:tab-size="2"
				@ready="onEditorReady"
			></codemirror>
			<div class="editor-helper">
				<small class="text-medium-emphasis">
					{{ helperText }}
				</small>
			</div>
		</div>
	</div>
</template>

<script>
import { aloneChordsRegex, isChordsLine } from "../functions/chordLine";
import { chordDrag } from "../functions/chordDrag";
import measureText from "../functions/measureText";
import normalizeText from "../functions/normalizeText";
import { Codemirror } from "vue-codemirror";
import { minimalSetup } from "codemirror";
import { EditorView, keymap, highlightActiveLine, Decoration, ViewPlugin } from "@codemirror/view";
import { closeBrackets } from "@codemirror/autocomplete";
import { oneDark } from "@codemirror/theme-one-dark";

// Longer suffixes must come before shorter prefixes of themselves (maj/min/mi
// before m): outside brackets nothing follows the group to force backtracking,
// so "Ami" would otherwise match only as "Am"
const bracketChordRegex = /\[[A-H]([#b♯♭]?)(maj|min|mi|m|dim|aug|sus[24]?|add\d+|\d+|M\d*|°|ø|\+|-|\/[A-H][#b♯♭]?)*\]/g;
const aloneChordRegex = /[A-H]([#b♯♭]?)(maj|min|mi|m|dim|aug|sus[24]?|add\d+|\d+|M\d*|°|ø|\+|-|\/[A-H][#b♯♭]?)*/g;
const chordOnlyLinePattern = /^([A-H]([#b♯♭]?)(maj|min|mi|m|dim|aug|sus[24]?|add\d+|\d+|M\d*|°|ø|\+|-|\/[A-H][#b♯♭]?)*\s*)+$/;

const chordMark = Decoration.mark({ class: "cm-chord-highlight" });

const isChordOnlyLine = (text) => text.trim().length > 0 && chordOnlyLinePattern.test(text.trim());

// Highlights chords in the visible document: bracketed chords always, bare
// chords only on chord-only lines when "chords above text" mode is active.
function chordHighlighter(chordsAbove) {
	return ViewPlugin.fromClass(
		class {
			constructor(view) {
				this.decorations = this.buildDecorations(view);
			}

			update(update) {
				if (update.docChanged || update.viewportChanged) {
					this.decorations = this.buildDecorations(update.view);
				}
			}

			buildDecorations(view) {
				const ranges = [];
				for (const { from, to } of view.visibleRanges) {
					let pos = from;
					while (pos <= to) {
						const line = view.state.doc.lineAt(pos);
						let match;
						if (chordsAbove && chordOnlyLinePattern.test(line.text.trim()) && line.text.trim().length > 0) {
							aloneChordRegex.lastIndex = 0;
							while ((match = aloneChordRegex.exec(line.text)) !== null) {
								if (match[0].length === 0) break;
								ranges.push(chordMark.range(line.from + match.index, line.from + match.index + match[0].length));
							}
						}
						bracketChordRegex.lastIndex = 0;
						while ((match = bracketChordRegex.exec(line.text)) !== null) {
							ranges.push(chordMark.range(line.from + match.index, line.from + match.index + match[0].length));
						}
						pos = line.to + 1;
					}
				}
				return Decoration.set(ranges, true);
			}
		},
		{ decorations: (v) => v.decorations }
	);
}

export default {
	name: "ChordTextEditor",

	props: {
		modelValue: {
			type: String,
			default: ""
		},
		chordsAboveText: {
			type: Boolean,
			default: true
		},
		standardNotation: {
			type: Boolean,
			default: true
		},
		trimLines: {
			type: Boolean,
			default: true
		}
	},

	emits: ["update:modelValue", "chord-mode-changed", "notation-changed", "trim-lines-changed"],

	data() {
		return {
			chordMode: this.chordsAboveText ? 'above' : 'brackets',
			notationMode: this.standardNotation ? 'standard' : 'german',
			trimLinesActive: this.trimLines,
			content: this.modelValue,
			editorView: null
		};
	},

	computed: {
		helperText() {
			if (this.chordMode !== 'brackets') {
				return 'Place chords on separate lines above lyrics • Drag a chord to move it';
			}
			return this.$vuetify.display.smAndDown
				? 'Type chords in [brackets] like [Am] [F] [C] • Drag a chord to move it'
				: 'Type chords in [brackets] like [Am] [F] [C] • Drag a chord to move it • Press Ctrl+K (⌘+K) to insert chord brackets';
		},

		editorExtensions() {
			const extensions = [
				minimalSetup,
				EditorView.lineWrapping,
				highlightActiveLine(),
				closeBrackets(),
				keymap.of([
					{
						key: "Mod-k",
						run: () => {
							this.insertChordBrackets();
							return true;
						},
					},
				]),
				chordHighlighter(this.chordMode === 'above'),
				chordDrag({
					chordsAbove: this.chordMode === 'above',
					bracketRegex: bracketChordRegex,
					bareRegex: aloneChordRegex,
					isChordLine: isChordOnlyLine,
				}),
			];

			if (this.$vuetify.theme.current.dark) {
				extensions.push(oneDark);
			}

			return extensions;
		}
	},

	watch: {
		modelValue(newVal) {
			if (newVal !== this.content) {
				this.content = newVal;
			}
		},

		content(newVal) {
			this.$emit('update:modelValue', newVal);
		},

		chordMode(newVal) {
			this.$emit('chord-mode-changed', newVal === 'above');
		},

		notationMode(newVal) {
			this.$emit('notation-changed', newVal === 'standard');
		},

		trimLinesActive(newVal) {
			this.$emit('trim-lines-changed', newVal);
		},

		trimLines(newVal) {
			this.trimLinesActive = newVal;
		},

		chordsAboveText(newVal) {
			this.chordMode = newVal ? 'above' : 'brackets';
		},

		standardNotation(newVal) {
			this.notationMode = newVal ? 'standard' : 'german';
		}
	},

	methods: {
		onEditorReady(payload) {
			this.editorView = payload.view;
		},

		insertChordBrackets() {
			const view = this.editorView;
			if (!view) return;

			const selection = view.state.selection.main;
			const selectedText = view.state.sliceDoc(selection.from, selection.to);

			if (selectedText) {
				// Wrap selected text in brackets
				view.dispatch({
					changes: { from: selection.from, to: selection.to, insert: `[${selectedText}]` },
				});
			} else {
				// Insert empty brackets and position cursor inside
				view.dispatch({
					changes: { from: selection.from, insert: "[]" },
					selection: { anchor: selection.from + 1 },
				});
			}

			view.focus();
		},

		fixChordAlignment() {
			// Implement the chord alignment logic from the original SongEditor
			let lines = this.content.split(/[\n\r]/);
			lines.forEach((line, index) => {
				if (isChordsLine(line) && index + 1 < lines.length) {
					let lineParts = line.split(/(\s+)/).filter((e) => e.length > 0);
					let startPos = [0];
					let isWord = [];
					lineParts.forEach((part, j) => {
						if (j > 0) {
							startPos.push(startPos[j - 1] + this.relativeTextWidth(lineParts[j - 1]));
						}
						isWord.push(part.trim().length > 0);
					});

					let positionInLine = [];
					let comparingWord = 0;
					let cumulativeLength = 0;
					let i = 0;
					while (comparingWord < startPos.length) {
						cumulativeLength += this.relativeTextWidth(lines[index + 1].charAt(i) || " ");

						if (cumulativeLength >= startPos[comparingWord]) {
							positionInLine.push(i);
							comparingWord++;
						}
						i++;
					}
					lines[index] = "";
					for (let i = 0; i < positionInLine.length; i++) {
						const pos = positionInLine[i];
						if (isWord[i]) {
							lines[index] = lines[index].insert(pos, lineParts[i]);
						}
					}
				}
			});

			this.content = lines.join("\n");
		},

		relativeTextWidth(str) {
			return measureText(normalizeText(str)) / measureText(" ");
		},

		focus() {
			if (this.editorView) {
				this.editorView.focus();
			}
		},

		convertChordsToChordPro() {
			if (this.chordMode !== 'above') {
				return; // Only convert if currently in "above" mode
			}

			let lines = this.content.split(/[\n\r]/);
			let convertedLines = [];
			let i = 0;

			while (i < lines.length) {
				const currentLine = lines[i];

				if (isChordsLine(currentLine) && i + 1 < lines.length) {
					// This is a chord line, and there's a next line (presumably lyrics)
					const chordLine = currentLine;
					const lyricsLine = lines[i + 1] || '';

					// Find all chords and their positions in the chord line
					const chords = [];
					let match;
					const regex = aloneChordsRegex();
					regex.lastIndex = 0; // Reset regex

					while ((match = regex.exec(chordLine)) !== null) {
						chords.push({
							chord: match[0].trim(),
							position: match.index
						});
					}

					// Start with the lyrics line
					let convertedLine = lyricsLine;

					// Insert chords in reverse order to maintain correct positions
					chords.sort((a, b) => b.position - a.position);

					chords.forEach(({ chord, position }) => {
						// Insert chord at the exact same character position
						if (position <= convertedLine.length) {
							convertedLine = convertedLine.slice(0, position) + `[${chord}]` + convertedLine.slice(position);
						} else {
							// If the position is beyond the lyrics, pad with spaces and add chord
							const padding = ' '.repeat(position - convertedLine.length);
							convertedLine = convertedLine + padding + `[${chord}]`;
						}
					});

					convertedLines.push(convertedLine);
					i += 2; // Skip both the chord line and lyrics line
				} else {
					// Regular line (not a chord line or no following lyrics)
					convertedLines.push(currentLine);
					i++;
				}
			}

			// Update the content and switch to bracket mode
			this.content = convertedLines.join('\n');
			this.chordMode = 'brackets';
		},

		// Expose this method to parent components
		convertToChordPro() {
			this.convertChordsToChordPro();
		}
	},

	components: {
		Codemirror
	},
};
</script>

<style lang="scss" scoped>
.chord-text-editor {
	overflow: hidden;
	display: flex;
	flex-direction: column;
	height: 100%;
}

.editor-toolbar {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	row-gap: 4px;
	padding: 8px 16px;
	background: rgba(0, 0, 0, 0.04);
	border-bottom: 1px solid #eee;
	min-height: 48px;
}

@media (max-width: 599.98px) {
	.editor-toolbar {
		padding: 6px 8px;
	}

	.editor-toolbar .v-divider--vertical {
		display: none;
	}
}

.v-theme--dark .editor-toolbar {
	background: rgba(255, 255, 255, 0.04);
	border-bottom-color: #444;
}

.editor-container {
	flex-grow: 1;
	display: flex;
	flex-direction: column;
	min-height: 0;
    position: relative;
    overflow: hidden;
}

.editor-helper {
	padding: 4px 16px;
	border-top: 1px solid #eee;
	background: rgba(0, 0, 0, 0.02);
	font-size: 0.75rem;
}

.v-theme--dark .editor-helper {
	border-top-color: #444;
	background: rgba(255, 255, 255, 0.02);
}

// CodeMirror overrides
:deep(.cm-editor) {
	border: none !important;
	font-family: "Roboto Mono", monospace !important;
	font-size: 14px !important;
	line-height: 1.5 !important;
	height: 100% !important;
    min-height: 300px;
	background: transparent !important;
}

// 16px on phones: readable, and prevents iOS Safari from auto-zooming the
// page when the editor gains focus (it zooms any input below 16px)
@media (max-width: 959.98px) {
	:deep(.cm-editor) {
		font-size: 16px !important;
	}
}

:deep(.cm-editor.cm-focused) {
	outline: none !important;
}

:deep(.cm-scroller) {
    padding-bottom: 30px;
	min-height: 100% !important;
	font-family: "Roboto Mono", monospace !important;
}

:deep(.cm-content) {
	padding: 16px !important;
}

:deep(.cm-placeholder) {
	color: #999 !important;
	font-style: italic !important;
}

// Light theme CodeMirror styling
.v-theme--light :deep(.cm-editor) {
	color: rgba(0, 0, 0, 0.87) !important;
}

.v-theme--light :deep(.cm-cursor) {
	border-left: 1px solid #000000 !important;
}

.v-theme--light :deep(.cm-selectionBackground) {
	background: rgba(76, 175, 80, 0.2) !important;
}

.v-theme--light :deep(.cm-placeholder) {
	color: #666 !important;
}

// Dark theme CodeMirror styling
.v-theme--dark :deep(.cm-editor) {
	color: rgba(255, 255, 255, 0.87) !important;
}

.v-theme--dark :deep(.cm-cursor) {
	border-left: 1px solid #ffffff !important;
}

.v-theme--dark :deep(.cm-selectionBackground) {
	background: rgba(76, 175, 80, 0.3) !important;
}

.v-theme--dark :deep(.cm-placeholder) {
	color: #666 !important;
}

// Chord highlighting styles using the same red color as SongSheet
:deep(.cm-chord-highlight) {
	color: #d32f2f;
	border: none;
	border-radius: 2px;
	padding: 0px 2px;
	margin: 0;
	// Chords are draggable; touch-action none lets touch drags start on them
	// without the browser hijacking the gesture for scrolling
	cursor: grab;
	touch-action: none;
	font-weight: 500;
	font-size: 1em;
	font-family: inherit;
	letter-spacing: 0.2px;
	text-transform: none;
	transition: all 0.2s ease;
	display: inline;
	line-height: inherit;
	vertical-align: baseline;
	box-shadow: none;
	position: relative;
}

:deep(.cm-chord-highlight:hover) {
	background: rgba(211, 47, 47, 0.12);
	color: #c62828;
}

// Dark theme chord styles
.v-theme--dark :deep(.cm-chord-highlight) {
	background: rgba(244, 67, 54, 0.1);
	color: #f44336;
}

.v-theme--dark :deep(.cm-chord-highlight:hover) {
	background: rgba(244, 67, 54, 0.15);
	color: #ef5350;
}
</style>
