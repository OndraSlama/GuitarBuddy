import { Chord } from "@tonaljs/tonal";

export default {
	data() {
		return {
			standardNotation: false
		}
	},
	methods:{
		parseSongText(text){
			let lineArray = this.splitLinesAndFindChords(text)
			return this.createSections(lineArray)
		},
		
		splitLinesAndFindChords(text, chordsAboveText = false) {
			// Clean text
			text = text.replace(/<[^>]*>?/gm, "");

			// Parse text

			text = text.replace(/^[\s]*\[?(Intro|Chorus|Verse(?:\s+\d)?|Bridge|Ending)\]?[\s]*(?:\.|:|\))?[\s]/gim, "{$1}\n");
			text = this.replaceAndFill(text, "^[\\s]*\\(?r(f|e|ef)?(\\.|:|\\))\\)?[\\s]*", "{Chorus}\n");
			text = this.replaceAndFill(text, "^[\\s]*\\(?(\\d)(\\.|:|\\))\\)?[\\s]*", "{Verse $1}\n");
			
			text = text.replace(/\{soc\}/gi, "{Chorus}");
			text = text.replace(/\{eoc\}/gi, "");
			text = text.replace(/\n\n[\n]+/g, "\n\n");

			let lineArray = [];
			let bracketMatch;
			let match;

			let lines = text.split("\n");
			lines.forEach((line) => {
				let lineType = "lyrics";
				let chords = [];
				line = line.replace(/[\n\r]/gm, "");
				if (/\s*\{.*?\}\s*/i.test(line)) {
					match = /\s*\{(.*?)\}\s*/i.exec(line);
					lineType = "delimiter";
					line = match[1].trim().toLowerCase();
				} else if (chordsAboveText && this.isChordsLine(line)) {
					lineType = "chords";
					while ((match = this.aloneChordsregex.exec(line))) {
						let chord = Chord.get(this.parseChord(match[0]));
						// Include chord even if unrecognized
						if (!chord.empty) {
							chords.push([match.index, chord]);
						} else {
							// Create custom chord object for unrecognized chords
							chords.push([match.index, {
								symbol: match[0],
								empty: false,
								original: match[0]
							}]);
						}
					}
				} else if (!chordsAboveText) {
					while ((bracketMatch = /\[(.*?)\]/.exec(line))) {
						let chordsInBracket = [];
						while ((match = this.chordsInBracketRegex.exec(bracketMatch[1]))) {
							if (chordsInBracket.length != 0) {
								let lastChord = chordsInBracket[chordsInBracket.length - 1];
								let chord = Chord.get(this.parseChord(match[0]));
								if (!chord.empty) {
									chordsInBracket.push([lastChord[0] + lastChord[1].symbol.length + 1, chord]);
								} else {
									// Create custom chord object for unrecognized chords
									chordsInBracket.push([lastChord[0] + lastChord[1].symbol.length + 1, {
										symbol: match[0],
										empty: false,
										original: match[0]
									}]);
								}
							} else {
								let chord = Chord.get(this.parseChord(match[0]));
								if (!chord.empty) {
									chordsInBracket.push([bracketMatch.index, chord]);
								} else {
									// Create custom chord object for unrecognized chords
									chordsInBracket.push([bracketMatch.index, {
										symbol: match[0],
										empty: false,
										original: match[0]
									}]);
								}
							}
						}

						chordsInBracket.forEach((chord) => {
							if (chords.length != 0 && chords[chords.length - 1][0] >= chord[0]) {
								let lastChord = chords[chords.length - 1];
								chord[0] = lastChord[0] + lastChord[1].symbol.length + 1;
							}
							chords.push(chord);
						});
						line = line.replace(bracketMatch[0], "");
					}
					// chords.forEach((chord, index) => {
					// 	if(index > 0){
					// 		let lastChordEnd = chords[index - 1][0] + chords[index - 1][1].symbol.length + 1
					// 		if (chord[0] < lastChordEnd){
					// 			chord[0] = lastChordEnd;
					// 		}
					// 	}
					// })
				}

				lineArray.push({
					text: line,
					lineType: lineType,
					chords: chords,
				});
			});

			if (!chordsAboveText) {
				return lineArray;
			}

			for (let i = 0; i < lineArray.length; i++) {
				if (lineArray[i].lineType === "chords") {
					let j = i;
					while (lineArray[j].lineType != "lyrics" || lineArray[j].chords.length != 0) {
						j++;
						if (j >= lineArray.length) {
							j = i;
							lineArray[j].text = "";
							lineArray[j].lineType = "lyrics";
							break;
						}
					}
					lineArray[j].chords = lineArray[i].chords;
				}
			}

			return lineArray.filter((e) => {
				return e.lineType != "chords";
			});
		},

		createSections(lineArray, trimLines = false){
			let sections = []
			lineArray.forEach((line) => {
				if (line.text.trim().length == 0 && line.chords.length == 0) {
					sections.push({
						name: "",
						lines: [],
					});
				} else if (line.lineType === "delimiter") {
					sections.push({
						name: line.text,
						lines: [],
					});
				} else if (line.lineType === "lyrics") {
					if (sections.length == 0)
						sections.push({
							name: "",
							lines: [],
						});

					sections[sections.length - 1].lines.push({
						lyrics: line.text,
						chords: line.chords,
					});
				}
			});

			sections = sections.filter((section) => {
				return section.name != "" || section.lines.length > 0;
			});

			if (trimLines) sections = this.trimLines(sections);

			return sections;
		},

		trimLines(sections) {
			sections = sections.map((section) => {
				section.lines = section.lines.map((line) => {
					while (line.lyrics[0] === " " || line.lyrics[0] === " ") {
						line.lyrics = line.lyrics.substring(1);
						if (line.chords.length > 0 && line.chords[0][0] > 0) {
							line.chords.forEach((chord) => {
								chord[0] -= 1;
							});
						}
					}
					return line;
				});
				return section;
			});

			return sections;
		},

		fixAuthorName(author){
			return (author || "")
			.toLowerCase()
			.split(" ")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ")
		},

		replaceAndFill(text, regex, replacement) {
			let replacementWithSpaces = replacement;

			const matches = text.matchAll(RegExp(regex, "img"));

			for (const match of matches) {
				replacementWithSpaces = replacement;
				for (let i = 0; i < match[0].trim().length; i++) {
					replacementWithSpaces += " ";
				}
				replacementWithSpaces = replacementWithSpaces.replace("$1", match[1]);
				text = text.replace(match[0].trim(), replacementWithSpaces);
			}
	
			return text;
		},

		parseChord(chord) {
			
			chord = chord.replace("mi", "m");
			if (!this.standardNotation) {
				chord = chord.replace("B", "A#");
				chord = chord.replace("H", "B");
			}
			
			chord = chord.replace("+", "aug");
			chord = chord.replace("-", "m");
			
			// Convert 'as' to '#' with transposed base
			var scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
			let chord_regex = /.*?([A-H]#?)(s|as|es).*?/
			let match = chord_regex.exec(chord);
			while (match) {
				let matched_chord = match[1]
				let new_index = scale.indexOf(matched_chord) - 1
				new_index = new_index < 0 ? scale.length + (new_index - 1) : new_index
				chord = chord.replace(match[0], scale[new_index]);
				
				match = chord_regex.exec(chord);
			}

			return chord;
		},

		getWordsInString(string) {
			return string.split(/(\s+)/).filter((e) => e.trim().length > 0);
		},

		isChordsLine(line) {
			return (line.match(this.aloneChordsregex) || []).length > (1 / 3) * this.getWordsInString(line).length;
		},


	},

	computed: {
		chordRegexString() {
			var notes = "[A-H]",
				accidentals = "(bb|b|#|s|es|ses|sas)?",
				chords = "(maj|min|m|mi|M|\\+|-|dim|aug|sus)?",
				suspends = "[0-9]*(sus)?[0-9]*";

			const chord = notes + accidentals + chords + suspends;
			return chord + "(\\/" + chord + ")?";
		},

		aloneChordsregex() {
			return RegExp("(?<=(\\b))[\\t]*" + this.chordRegexString + "(?=(\\s|$))", "g");
		},

		chordsInBracketRegex() {
			return RegExp("(?<=(\\s|,|;|\\[|^))" + this.chordRegexString + "(?=(\\s|,|,;|\\]|$))", "g");
		},
	}


	
}