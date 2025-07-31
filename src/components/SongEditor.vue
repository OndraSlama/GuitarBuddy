<template>
	<div>
		<v-form @submit.prevent="onSubmit" ref="form" lazy-validation>
			<image-dialog v-model="helpOpened" imagePath="https://firebasestorage.googleapis.com/v0/b/guitarbuddy-bcd3c.appspot.com/o/songEditorHelp.png?alt=media&token=3bb9508f-e6e5-4888-806a-cacf8a176020"></image-dialog>
			<v-toolbar class="elevation-0 mb-2" height="40px" :color="$vuetify.theme.dark ? '#121212' : ''">
				<v-toolbar-items>
					<v-btn icon class="ml-n4" @click="$emit('back')">
						<v-icon>mdi-arrow-left</v-icon>
					</v-btn>
				</v-toolbar-items>
				<v-spacer></v-spacer>
				<v-toolbar-items>
					<v-switch class="mt-2" v-model="tempSource.public" inset label="Public"></v-switch>
					<v-tooltip top>
						<template v-slot:activator="{ on, attrs }">
							<v-btn icon class="mr-n5" @click="helpOpened = true" v-bind="attrs" v-on="on">
								<v-icon>mdi-help-circle-outline</v-icon>
							</v-btn>
						</template>
						<span>Show help overlay</span>
					</v-tooltip>
				</v-toolbar-items>
			</v-toolbar>
			<v-text-field class="mb-3" v-model="tempSource.title" label="Song Title" :rules="rules" hide-details="auto" outlined></v-text-field>
			<v-combobox outlined label="Author" v-model="tempSource.author" :items="authors"></v-combobox>
			<v-combobox outlined label="Song Labels" class="mt-n4" v-model="tempSource.labels" :items="labels" hide-selected multiple small-chips> </v-combobox>
			<!-- <v-text-field v-model="tempSource.author" label="Author" outlined></v-text-field> -->

			<div class="mt-n3">
				<chord-text-editor
					v-model="tempSource.text"
					:chords-above-text="tempSource.chordsAboveText"
					:standard-notation="tempSource.standardNotation"
					@chord-mode-changed="tempSource.chordsAboveText = $event"
					@notation-changed="tempSource.standardNotation = $event"
					@trim-lines-changed="tempSource.trimLines = $event"
				/>
			</div>

			<v-toolbar class="elevation-0" :color="$vuetify.theme.dark ? '#121212' : ''">
				<v-spacer></v-spacer>

				<v-btn v-if="type === 'edit'" @click="$emit('delete')" icon>
					<v-icon>mdi-delete-outline</v-icon>
				</v-btn>
				<v-btn @click="reset" icon>
					<v-icon>mdi-cancel</v-icon>
				</v-btn>
				<v-btn fab type="submit" class="ml-2 mr-n4" color="primary" :disabled="!validInput || !userLogged">
					<v-icon v-if="type === 'add'">mdi-upload-outline</v-icon>
					<v-icon v-if="type === 'edit'">mdi-content-save-outline</v-icon>
				</v-btn>
			</v-toolbar>
		</v-form>
	</div>
</template>

<script>
import { mapGetters } from "vuex";
// import calculateSize from "calculate-size";
import measureText from "../functions/measureText";
import normalizeText from "../functions/normalizeText";
import ImageDialog from "../components/Dialogs/ImageDialog";
import ChordTextEditor from "./ChordTextEditor.vue";

import songParser from "../mixins/songParser";
export default {
	mixins: [songParser],
	data() {
		return {
			rules: [(value) => !!value || ""],
			tempSource: undefined,
			helpOpened: false,
		};
	},

	props: {
		songSource: {
			type: Object,
			default: function() {
				return {
					title: "",
					author: "",
					text: "",
					labels: [],
					chordsAboveText: true,
					standardNotation: true,
					trimLines: true,
					public: true,
				};
			},
		},
		type: {
			validator: function(value) {
				return ["add", "edit"].indexOf(value) !== -1;
			},
		},
	},

	methods: {
		reset() {
			if (this.type === "add") {
				this.tempSource = {
					title: "",
					author: "",
					text: "",
					labels: [],
					chordsAboveText: true,
					standardNotation: true,
					trimLines: false,
					public: true,
				};
				this.$refs.form.resetValidation();
			} else {
				this.$emit("cancel");
			}
		},

		onSubmit() {
			this.$emit("song-submited", this.tempSource);
			this.reset();
		},

		variableToFixed() {
			let lines = this.tempSource.text.split(/[\n\r]/);
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
						// const chordChar = line.charAt(i);
						// const lineChar = lines[index + 1].charAt(i);
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

			this.tempSource.text = lines.join("\n");
		},

		fixedToVariable() {
			console.log("fixed to variable");
		},

		relativeTextWidth(str) {
			return measureText(normalizeText(str)) / measureText(" ");
		},

		fixLabels(labels) {
			if (!labels) labels = [];
			let newLabels = labels.map((e) => {
				return e
					.toLowerCase()
					.trim()
					.split(" ")
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join("");
			});

			return [...new Set(newLabels)];
		},
	},

	computed: {
		formatedSong() {
			let lineArray = this.splitLinesAndFindChords(this.tempSource.text, this.tempSource.chordsAboveText);
			let sections = this.createSections(lineArray, this.tempSource.trimLines);

			return {
				sections,
				title: this.tempSource.title,
				author: this.fixAuthorName(this.tempSource.author),
				labels: this.fixLabels(this.tempSource.labels),
			};
		},

		validSource() {
			return this.tempSource !== undefined && this.tempSource !== null;
		},
		validInput() {
			if (!this.tempSource.title || this.tempSource.title.length == 0) return false;
			if (!this.tempSource.text || this.tempSource.text.length == 0) return false;
			return true;
		},
		...mapGetters({
			userLogged: "getUserLogged",
			user: "getUser",
			authors: "getAuthors",
			labels: "getLabels",
			showTooltips: "getShowTooltips",
		}),
	},

	created() {
		this.tempSource = { ...this.songSource };
		this.$emit("input", this.formatedSong);
		this.$store.dispatch("loadAuthors");
		this.$store.dispatch("loadLabels");
	},

	watch: {
		songSource: {
			handler: function() {
				this.tempSource = { ...this.songSource };
			},
			deep: true,
		},
		"tempSource.standardNotation": function(newValue) {
			this.standardNotation = newValue;
		},

		tempSource: {
			handler: function() {
				console.log("song emited");
				this.$emit("input", this.formatedSong);
			},
			deep: true,
		},

		trimLines: function() {
			this.$emit("input", this.formatedSong);
		},

		"tempSource.labels": function(newLabels, prevLabels) {
			if (!prevLabels || !newLabels) {
				if (newLabels) {
					this.tempSource.labels = this.fixLabels(this.tempSource.labels);
					return;
				} else {
					return;
				}
			}
			if (
				!(
					newLabels.length === prevLabels.length &&
					newLabels.every(function(value, index) {
						return value === prevLabels[index];
					})
				)
			) {
				this.tempSource.labels = this.fixLabels(this.tempSource.labels);
			}
		},
	},

	components: {
		"image-dialog": ImageDialog,
		"chord-text-editor": ChordTextEditor,
		// "tooltip-wraper": TooltipWraper,
	},
};
</script>

<style lang="scss" scoped>
.text-area {
	font-family: "Roboto Mono", monospace;
	white-space: pre !important;
	overflow-wrap: normal !important;
	overflow: auto;
	font-size: 12px;
}
.limit-height {
	max-height: clamp(300px, 55vh, 100vh);
}
</style>
