<template>
	<div class="chord-text-editor">
		<div class="editor-toolbar">
			<!-- Chord Mode Toggle -->
			<v-tooltip bottom>
				<template v-slot:activator="{ on, attrs }">
					<v-btn-toggle v-model="chordMode" mandatory class="mr-3" v-bind="attrs" v-on="on">
						<v-btn value="brackets" small icon>
							<v-icon small>mdi-code-brackets</v-icon>
						</v-btn>
						<v-btn value="above" small icon>
							<v-icon small>mdi-arrow-up</v-icon>
						</v-btn>
					</v-btn-toggle>
				</template>
				<span>{{ chordMode === 'brackets' ? 'Chords in [brackets]' : 'Chords above text' }}</span>
			</v-tooltip>
			
			<v-divider vertical class="mx-2"></v-divider>
			
			<!-- Notation Toggle -->
			<v-tooltip bottom>
				<template v-slot:activator="{ on, attrs }">
					<v-btn-toggle v-model="notationMode" mandatory class="mr-3" v-bind="attrs" v-on="on">
						<v-btn value="german" small>
							<v-icon small>mdi-alpha-h</v-icon>
						</v-btn>
						<v-btn value="standard" small>
							<v-icon small>mdi-alpha-b</v-icon>
						</v-btn>
					</v-btn-toggle>
				</template>
				<span>{{ notationMode === 'standard' ? 'Standard notation (A B C D E F G)' : 'German notation (A H C D E F G)' }}</span>
			</v-tooltip>
			
			<v-divider vertical class="mx-2"></v-divider>
			
			<!-- Additional Tools -->
			<v-tooltip bottom>
				<template v-slot:activator="{ on, attrs }">
					<v-btn icon small @click="trimLines = !trimLines" v-bind="attrs" v-on="on" :color="trimLines ? 'primary' : ''">
						<v-icon small>mdi-format-horizontal-align-left</v-icon>
					</v-btn>
				</template>
				<span>Trim lines</span>
			</v-tooltip>
			
			<v-tooltip bottom>
				<template v-slot:activator="{ on, attrs }">
					<v-btn icon small @click="fixChordAlignment" :disabled="chordMode !== 'above'" v-bind="attrs" v-on="on">
						<v-icon small>mdi-format-align-bottom</v-icon>
					</v-btn>
				</template>
				<span>Fix chord alignment (experimental)</span>
			</v-tooltip>
			
			<v-tooltip bottom>
				<template v-slot:activator="{ on, attrs }">
					<v-btn icon small @click="convertChordsToChordPro" :disabled="chordMode !== 'above'" v-bind="attrs" v-on="on">
						<v-icon small>mdi-code-brackets</v-icon>
					</v-btn>
				</template>
				<span>Convert to ChordPro format</span>
			</v-tooltip>
			
			<v-spacer></v-spacer>
			
			<!-- Insert Chord Shortcut -->
			<v-tooltip bottom v-if="chordMode === 'brackets'">
				<template v-slot:activator="{ on, attrs }">
					<v-btn icon small @click="insertChordBrackets" v-bind="attrs" v-on="on">
						<v-icon small>mdi-plus</v-icon>
					</v-btn>
				</template>
				<span>Insert chord brackets (Ctrl+K / ⌘+K)</span>
			</v-tooltip>
		</div>

		<!-- CodeMirror Editor -->
		<div class="editor-container">
			<codemirror
				ref="editor"
				v-model="content"
				:options="editorOptions"
				@input="handleEditorChange"
				@ready="onEditorReady"
			></codemirror>
			<div class="editor-helper">
				<small class="text--secondary">
					{{ chordMode === 'brackets' ? 'Type chords in [brackets] like [Am] [F] [C] • Press Ctrl+K (⌘+K) to insert chord brackets' : 'Place chords on separate lines above lyrics' }}
				</small>
			</div>
		</div>
	</div>
</template>

<script>
import songParser from "../mixins/songParser";
import measureText from "../functions/measureText";
import normalizeText from "../functions/normalizeText";
import { codemirror } from 'vue-codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/javascript/javascript.js';
import CodeMirror from 'codemirror';

// Define the chord mode
CodeMirror.defineMode("chord", function() {
	return {
		token: function(stream) {
			// Check for chord in brackets like [C] [Am] [F#m7] [Bbsus4]
			if (stream.match(/\[[A-H]([#b♯♭]?)(m|maj|min|mi|dim|aug|sus[24]?|add\d+|\d+|M\d*|m\d*|°|ø|\+|-|\/[A-H][#b♯♭]?)*\]/)) {
				return "chord-highlight";
			}
			
			// Check for single character
			if (stream.next()) {
				return null;
			}
		}
	};
});

// Define additional chord patterns for above-text mode
CodeMirror.defineMode("chordAbove", function() {
	return {
		token: function(stream) {
			// For above-text mode, detect chord-only lines
			if (stream.sol()) {
				// Check if this line looks like it contains only chords and spaces
				const lineText = stream.string.trim();
				const chordOnlyPattern = /^([A-H]([#b♯♭]?)(m|maj|min|mi|dim|aug|sus[24]?|add\d+|\d+|M\d*|m\d*|°|ø|\+|-|\/[A-H][#b♯♭]?)?\s*)+$/;
				
				if (chordOnlyPattern.test(lineText)) {
					// This is a chord line, highlight individual chords
					if (stream.match(/[A-H]([#b♯♭]?)(m|maj|min|mi|dim|aug|sus[24]?|add\d+|\d+|M\d*|m\d*|°|ø|\+|-|\/[A-H][#b♯♭]?)?/)) {
						return "chord-highlight";
					}
				}
			}
			
			// Check for chords in brackets even in above mode
			if (stream.match(/\[[A-H]([#b♯♭]?)(m|maj|min|mi|dim|aug|sus[24]?|add\d+|\d+|M\d*|m\d*|°|ø|\+|-|\/[A-H][#b♯♭]?)*\]/)) {
				return "chord-highlight";
			}
			
			if (stream.next()) {
				return null;
			}
		}
	};
});

export default {
	name: "ChordTextEditor",
	mixins: [songParser],
	
	props: {
		value: {
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
		}
	},

	data() {
		return {
			chordMode: this.chordsAboveText ? 'above' : 'brackets',
			notationMode: this.standardNotation ? 'standard' : 'german',
			trimLines: false,
			content: this.value,
			isUpdatingContent: false
		};
	},

	computed: {
		editorOptions() {
			return {
				tabSize: 2,
				mode: this.chordMode === 'brackets' ? 'chord' : 'chordAbove',
				theme: this.$vuetify.theme.dark ? 'material' : 'default',
				lineNumbers: false,
				line: true,
				lineWrapping: true,
				foldGutter: false,
				gutters: [],
				highlightSelectionMatches: { showToken: /\w/, annotateScrollbar: true },
				matchBrackets: true,
				autoCloseBrackets: true,
				extraKeys: {
					'Ctrl-K': () => this.insertChordBrackets(),
					'Cmd-K': () => this.insertChordBrackets(),
				},
				placeholder: 'Start typing your song lyrics and chords here...',
				viewportMargin: Infinity,
				styleActiveLine: true,
				indentWithTabs: false,
				indentUnit: 2,
				smartIndent: false,
				electricChars: false,
				rtlMoveVisually: true
			};
		}
	},

	watch: {
		value(newVal) {
			if (newVal !== this.content && !this.isUpdatingContent) {
				this.content = newVal;
				// Only update editor content if it's significantly different or editor is empty
				if (!this.$refs.editor || this.$refs.editor.textContent === '' || Math.abs(this.$refs.editor.textContent.length - newVal.length) > 10) {
					this.updateEditorContent();
				}
			}
		},

		content(newVal) {
			if (!this.isUpdatingContent) {
				this.$emit('input', newVal);
			}
		},

		chordMode(newVal) {
			this.$emit('chord-mode-changed', newVal === 'above');
			// Update editor mode when chord mode changes
			this.$nextTick(() => {
				this.updateEditorMode();
			});
		},

		notationMode(newVal) {
			this.$emit('notation-changed', newVal === 'standard');
		},

		trimLines(newVal) {
			this.$emit('trim-lines-changed', newVal);
		},

		chordsAboveText(newVal) {
			this.chordMode = newVal ? 'above' : 'brackets';
		},

		standardNotation(newVal) {
			this.notationMode = newVal ? 'standard' : 'german';
		},

		'$vuetify.theme.dark'() {
			// Update editor theme when global theme changes
			this.$nextTick(() => {
				this.updateEditorTheme();
			});
		}
	},

	methods: {
		handleEditorChange(newValue) {
			// Update content when editor changes
			if (newValue !== this.content) {
				this.isUpdatingContent = true;
				this.content = newValue;
				this.$nextTick(() => {
					this.isUpdatingContent = false;
				});
			}
		},

		onEditorReady(editor) {
			// CodeMirror is ready
			console.log('CodeMirror editor is ready', editor);
		},

		insertChordBrackets() {
			const editor = this.$refs.editor;
			if (editor && editor.codemirror) {
				const cm = editor.codemirror;
				const cursor = cm.getCursor();
				const selectedText = cm.getSelection();
				
				if (selectedText) {
					// Wrap selected text in brackets
					cm.replaceSelection(`[${selectedText}]`);
				} else {
					// Insert empty brackets and position cursor inside
					cm.replaceSelection('[]');
					// Move cursor to between brackets
					cm.setCursor(cursor.line, cursor.ch + 1);
				}
				
				cm.focus();
			}
		},

		updateEditorContent() {
			const editor = this.$refs.editor;
			if (editor && editor.codemirror && editor.codemirror.getValue() !== this.content) {
				editor.codemirror.setValue(this.content);
			}
		},

		updateEditorMode() {
			const editor = this.$refs.editor;
			if (editor && editor.codemirror) {
				const newMode = this.chordMode === 'brackets' ? 'chord' : 'chordAbove';
				editor.codemirror.setOption('mode', newMode);
			}
		},

		updateEditorTheme() {
			const editor = this.$refs.editor;
			if (editor && editor.codemirror) {
				const newTheme = this.$vuetify.theme.dark ? 'material' : 'default';
				editor.codemirror.setOption('theme', newTheme);
			}
		},

		fixChordAlignment() {
			// Implement the chord alignment logic from the original SongEditor
			let lines = this.content.split(/[\n\r]/);
			lines.forEach((line, index) => {
				if (this.isChordsLine(line) && index + 1 < lines.length) {
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
			this.updateEditorContent();
		},

		relativeTextWidth(str) {
			return measureText(normalizeText(str)) / measureText(" ");
		},

		measureText(text) {
			return measureText(text);
		},

		normalizeText(text) {
			return normalizeText(text);
		},

		focus() {
			const editor = this.$refs.editor;
			if (editor && editor.codemirror) {
				editor.codemirror.focus();
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
				
				if (this.isChordsLine(currentLine) && i + 1 < lines.length) {
					// This is a chord line, and there's a next line (presumably lyrics)
					const chordLine = currentLine;
					const lyricsLine = lines[i + 1] || '';
					
					// Find all chords and their positions in the chord line
					const chords = [];
					let match;
					const regex = this.aloneChordsregex;
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
			this.updateEditorContent();
		},

		// Expose this method to parent components
		convertToChordPro() {
			this.convertChordsToChordPro();
		}
	},

	mounted() {
		// Set initial content if provided
		if (this.value) {
			this.content = this.value;
		}
		
		// Focus the editor if it's empty
		this.$nextTick(() => {
			if (this.$refs.editor && this.$refs.editor.textContent === '') {
				this.$refs.editor.focus();
			}
		});
	},

	components: {
		codemirror
	},
};
</script>

<style lang="scss" scoped>
.chord-text-editor {
	/* Border handled by parent */
	/* border: 1px solid #ccc; */
	/* border-radius: 4px; */
	overflow: hidden;
	display: flex;
	flex-direction: column;
	height: 100%;
}

.theme--dark .chord-text-editor {
	/* border-color: #555; */
}

.editor-toolbar {
	display: flex;
	align-items: center;
	padding: 8px 16px;
	background: rgba(0, 0, 0, 0.04);
	border-bottom: 1px solid #eee;
	min-height: 48px;
}

.theme--dark .editor-toolbar {
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

.theme--dark .editor-helper {
	border-top-color: #444;
	background: rgba(255, 255, 255, 0.02);
}

// CodeMirror overrides
::v-deep .CodeMirror {
	border: none !important;
	font-family: "Roboto Mono", monospace !important;
	font-size: 14px !important;
	line-height: 1.5 !important;
	height: 100% !important; 
    min-height: 300px;
	background: transparent !important;
}

::v-deep .CodeMirror-scroll {
    padding-bottom: 30px;
	min-height: 100% !important;
}

::v-deep .CodeMirror-lines {
	padding: 16px !important;
}

::v-deep .CodeMirror-placeholder {
	color: #999 !important;
	font-style: italic !important;
}

// Light theme CodeMirror styling
.theme--light ::v-deep .CodeMirror {
	background: #ffffff !important;
	color: rgba(0, 0, 0, 0.87) !important;
}

.theme--light ::v-deep .CodeMirror-cursor {
	border-left: 1px solid #000000 !important;
}

.theme--light ::v-deep .CodeMirror-selected {
	background: rgba(76, 175, 80, 0.2) !important;
}

.theme--light ::v-deep .CodeMirror-placeholder {
	color: #666 !important;
}

// Dark theme CodeMirror styling
.theme--dark ::v-deep .CodeMirror {
	background: #1e1e1e !important;
	color: rgba(255, 255, 255, 0.87) !important;
}

.theme--dark ::v-deep .CodeMirror-cursor {
	border-left: 1px solid #ffffff !important;
}

.theme--dark ::v-deep .CodeMirror-selected {
	background: rgba(76, 175, 80, 0.3) !important;
}

.theme--dark ::v-deep .CodeMirror-placeholder {
	color: #666 !important;
}

// Chord highlighting styles using the same red color as SongSheet
::v-deep .cm-chord-highlight {
	color: #d32f2f;
	border: none;
	border-radius: 2px;
	padding: 0px 2px;
	margin: 0;
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

::v-deep .cm-chord-highlight:hover {
	background: rgba(211, 47, 47, 0.12);
	color: #c62828;
}

// Dark theme chord styles
.theme--dark ::v-deep .cm-chord-highlight {
	background: rgba(244, 67, 54, 0.1);
	color: #f44336;
}

.theme--dark ::v-deep .cm-chord-highlight:hover {
	background: rgba(244, 67, 54, 0.15);
	color: #ef5350;
}
</style>
