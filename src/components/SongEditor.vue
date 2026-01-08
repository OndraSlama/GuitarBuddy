<template>
	<v-container fluid class="pa-0 fill-height align-start">
		<v-form @submit.prevent="onSubmit" ref="form" lazy-validation class="d-flex flex-column flex-grow-1" style="width: 100%">
			<image-dialog v-model="helpOpened" imagePath="https://firebasestorage.googleapis.com/v0/b/guitarbuddy-bcd3c.appspot.com/o/songEditorHelp.png?alt=media&token=3bb9508f-e6e5-4888-806a-cacf8a176020"></image-dialog>
			
            <div v-if="tempSource">
                <!-- Header Actions -->
                <div class="d-flex align-center mb-2">
                     <v-btn icon @click="$emit('back')" class="mr-2">
						<v-icon>mdi-arrow-left</v-icon>
					</v-btn>
                    <div class="text-h6 font-weight-bold">
                        {{ type === 'add' ? 'New Song' : 'Edit Song' }}
                    </div>
                    <v-spacer></v-spacer>
                    <div class="d-flex align-center">
                        <v-switch v-model="tempSource.public" inset dense hide-details class="mt-0 mr-4" label="Public"></v-switch>
                        <v-tooltip bottom>
                            <template v-slot:activator="{ on, attrs }">
                                <v-btn icon @click="helpOpened = true" v-bind="attrs" v-on="on">
                                    <v-icon>mdi-help-circle-outline</v-icon>
                                </v-btn>
                            </template>
                            <span>Show help</span>
                        </v-tooltip>
                    </div>
                </div>

                <!-- Metadata Card -->
                <v-card outlined class="mb-4 rounded-lg overflow-hidden elevation-1 border-light">
                    <v-card-text class="pa-4">
                        <v-text-field 
                            v-model="tempSource.title" 
                            placeholder="Song Title" 
                            class="text-h5 font-weight-bold mb-2" 
                            :rules="rules" 
                            hide-details="auto" 
                            solo 
                            flat 
                            background-color="transparent"
                        ></v-text-field>
                        <v-divider class="mb-4"></v-divider>
                        <v-row dense>
                            <v-col cols="12" sm="6">
                                <v-combobox 
                                    dense 
                                    outlined 
                                    label="Author" 
                                    v-model="tempSource.author" 
                                    :items="authors"
                                    hide-details
                                    prepend-inner-icon="mdi-account"
                                ></v-combobox>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-combobox 
                                    dense 
                                    outlined 
                                    label="Tags" 
                                    v-model="tempSource.labels" 
                                    :items="labels" 
                                    hide-selected 
                                    multiple 
                                    small-chips 
                                    hide-details
                                    prepend-inner-icon="mdi-tag-multiple"
                                ></v-combobox>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>

                <!-- Editor Card -->
                <v-card outlined class="rounded-lg d-flex flex-column flex-grow-1 mb-4 elevation-1 border-light" style="min-height: 500px;">
                    <chord-text-editor
                        v-model="tempSource.text"
                        :chords-above-text="tempSource.chordsAboveText"
                        :standard-notation="tempSource.standardNotation"
                        @chord-mode-changed="tempSource.chordsAboveText = $event"
                        @notation-changed="tempSource.standardNotation = $event"
                        @trim-lines-changed="tempSource.trimLines = $event"
                        class="flex-grow-1"
                    />
                </v-card>

                <!-- Footer Actions -->
                <div class="d-flex align-center pb-4">
                     <v-btn v-if="type === 'edit'" @click="$emit('delete')" color="error" text large>
                        <v-icon left>mdi-delete-outline</v-icon> Delete
					</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn text @click="reset" large class="mr-2">Cancel</v-btn>
                    <v-btn depressed color="primary" type="submit" :disabled="!validInput || !userLogged" large>
                         <v-icon left>{{ type === 'add' ? 'mdi-plus' : 'mdi-content-save' }}</v-icon>
                         {{ type === 'add' ? 'Create Song' : 'Save Changes' }}
                    </v-btn>
                </div>
            </div>
		</v-form>
	</v-container>
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
