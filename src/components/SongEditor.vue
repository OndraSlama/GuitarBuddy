<template>
	<div>
		<v-form @submit.prevent="$emit('song-submited')" ref="form" lazy-validation>
			<v-text-field class="my-3" v-model="songSource.title" label="Song Title" :rules="rules" hide-details="auto" outlined></v-text-field>
			<v-text-field v-model="songSource.author" label="Author" outlined></v-text-field>
			<v-textarea solo class="monospace" v-model="songSource.text" label="Song text with chords" :rules="rules" auto-grow></v-textarea>

			<v-toolbar class="elevation-0" :color="$vuetify.theme.dark ? '#121212' : ''">
				<v-btn-toggle v-model="songSource.chordsAboveText" rounded mandatory>
					<v-tooltip top>
						<template v-slot:activator="{ on, attrs }">
							<v-btn v-bind="attrs" v-on="on">
								<!-- <span>In text</span> -->
								<v-icon>mdi-code-brackets</v-icon>
							</v-btn>
						</template>
						<span>Chords in text surrounded by [] brackets</span>
					</v-tooltip>
					<v-tooltip top>
						<template v-slot:activator="{ on, attrs }">
							<v-btn v-bind="attrs" v-on="on">
								<v-icon>mdi-format-text-variant</v-icon>
								<!-- <span>Above</span> -->
							</v-btn>
						</template>
						<span>Chords above text aligned with spaces</span>
					</v-tooltip>
				</v-btn-toggle>
				<v-spacer></v-spacer>

				<!-- <v-spacer class="></v-spacer> -->
				<!-- <v-col class="text-center"> -->
				<!-- <v-row> -->
				<v-btn v-if="type === 'edit'" @click="$emit('delete')" icon color="secondary"><v-icon>mdi-delete-outline</v-icon></v-btn>
				<v-btn @click="$emit('cancel')" icon color="secondary"><v-icon>mdi-cancel</v-icon></v-btn>
				<v-btn fab large type="submit" class="ml-2" color="primary" :disabled="!validInput || !userLogged">
					<v-icon v-if="type === 'add'">mdi-upload-outline</v-icon>
					<v-icon v-if="type === 'edit'">mdi-content-save-outline</v-icon>
				</v-btn>
				<!-- </v-col>
				<v-col> -->

				<!-- <v-btn icon>
					<v-icon>mdi-magnify</v-icon>
				</v-btn>
				<v-btn icon>
					<v-icon>mdi-heart</v-icon>
				</v-btn>
				<v-btn icon>
					<v-icon>mdi-dots-vertical</v-icon>
				</v-btn> -->
			</v-toolbar>
		</v-form>
	</div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
	data() {
		return {
			rules: [(value) => !!value || "Required."],
		};
	},

	props: ["songSource", "type"],

	methods: {
		resetValidation() {
			this.$refs.form.resetValidation();
		},

		splitLinesAndFindChords(text, chordsAboveText) {
			var notes = "[A-H]",
				accidentals = "(bb|b|#)?",
				chords = "(maj|min|m|mi|M|\\+|-|dim|aug|sus)?",
				suspends = "[0-9]*(sus)?[0-9]*";

			var chordRegexString = notes + accidentals + chords + suspends + "(\\/[A-H](b|#)?)?";
			var chordAloneRegexString = "(?<=(\\b))[\t]*" + chordRegexString + "(?=(\\s|$))";
			var chordBracketRegexString = "\\[\\s*(" + chordRegexString + ")\\s*\\]";

			// Parse text
			text = text.replace(/[\s]*\(?r(ef)?(\.|:|\))\)?[\s]*/gi, "\nChorus\n");
			text = text.replace(/[\s]*\(?(\d)(\.|:|\))\)?[\s]*/gi, "\nVerse $1\n");
			text = text.replace(/[\s]*\(?bridge(\.|:|\))\)?[\s]*/gi, "\nBridge\n");
			text = text.replace(/[\s]*\(?ending(\.|:|\))\)?[\s]*/gi, "\nEnding\n");
			text = text.replace(/\n\n[\n]+/g, "\n\n");

			let lineArray = [];
			let match;
			let aloneChordsregex = RegExp(chordAloneRegexString, "g");
			let bracketChordsRegex = RegExp(chordBracketRegexString, "g");

			text.split("\n").forEach((line) => {
				let lineType = "lyrics";
				let chords = [];
				if (/\s*(Chorus|Verse \d|Bridge|Ending)\s*/i.test(line)) {
					lineType = "delimiter";
					line = line.trim().toLowerCase();
				} else if (chordsAboveText && this.isChordsLine(line, aloneChordsregex)) {
					lineType = "chords";
					while ((match = aloneChordsregex.exec(line))) {
						chords.push([match.index, match[0]]);
					}
				} else if (!chordsAboveText) {
					while ((match = bracketChordsRegex.exec(line))) {
						chords.push([match.index, match[1]]);
						line = line.replace(match[0], "");
					}
					while ((match = /\[(.*)\]/.exec(line))) {
						let foundChords = match[1].split(/\s*,\s/);
						foundChords.forEach((chord, index) => {
							if (index - 1 >= 0) {
								chords.push([match.index + (chords[index - 1][0] + chords[index - 1][1].length + 1), chord]);
							} else {
								chords.push([match.index, chord]);
							}
						});
						line = line.replace(match[0], "");
					}
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

		getWordsInString(string) {
			return string.split(/(\s+)/).filter((e) => e.trim().length > 0);
		},

		isChordsLine(line, aloneChordsregex) {
			return (line.match(aloneChordsregex) || []).length > (1 / 3) * this.getWordsInString(line).length;
		},
	},

	computed: {
		formatedSong() {
			let lineArray = this.splitLinesAndFindChords(this.songSource.text, this.songSource.chordsAboveText);
			let curentSection = 0;
			let currentName = "";
			let finalLineArray = [];
			lineArray.forEach((line, index) => {
				if (line.text.trim().length == 0 && line.chords.length == 0) {
					if (index - 1 >= 0 && lineArray[index - 1].section == line.section) {
						curentSection++;
					}
				} else if (line.lineType === "delimiter") {
					if (index - 1 >= 0 && lineArray[index - 1].section == line.section) {
						curentSection++;
					}
					currentName = line.text;
				} else if (line.lineType === "lyrics") {
					finalLineArray.push({
						section: curentSection,
						sectionName: currentName,
						lyrics: line.text,
						chords: line.chords,
					});
				}
			});

			return {
				lines: finalLineArray,
				title: this.songSource.title,
				author: this.songSource.author,
			};
		},
		validSource() {
			return this.songSource !== undefined && this.songSource !== null;
		},
		validInput() {
			if (this.songSource.title.length == 0) return false;
			if (this.songSource.text.length == 0) return false;
			return true;
		},
		...mapGetters({
			userLogged: "getUserLogged",
			user: "getUser",
			showTooltips: "getShowTooltips",
		}),
	},

	created() {
		this.$emit("input", this.formatedSong);
	},

	watch: {
		songSource: {
			handler: function() {
				this.$emit("input", this.formatedSong);
			},
			deep: true,
		},
	},
};
</script>

<style lang="scss" scoped></style>
