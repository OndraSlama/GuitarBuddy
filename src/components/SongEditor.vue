<template>
	<v-container fluid class="pa-0 fill-height align-start">
		<v-form @submit.prevent="onSubmit" ref="form" class="d-flex flex-column flex-grow-1" style="width: 100%">
			<image-dialog v-model="helpOpened" imagePath="https://firebasestorage.googleapis.com/v0/b/guitarbuddy-bcd3c.appspot.com/o/songEditorHelp.png?alt=media&token=3bb9508f-e6e5-4888-806a-cacf8a176020"></image-dialog>

            <div v-if="tempSource">
                <!-- Header Actions -->
                <div class="d-flex align-center mb-2">
                     <v-btn icon variant="text" @click="$emit('back')" class="mr-1">
						<v-icon>mdi-arrow-left</v-icon>
					</v-btn>
                    <div class="text-h6 font-weight-bold text-truncate">
                        {{ type === 'add' ? 'New Song' : 'Edit Song' }}
                    </div>
                    <v-spacer></v-spacer>
                    <div class="d-flex align-center flex-shrink-0">
                        <v-switch v-model="tempSource.public" inset density="compact" hide-details class="mt-0 mr-2 mr-sm-4" label="Public"></v-switch>
                        <v-tooltip location="bottom">
                            <template v-slot:activator="{ props: tooltipProps }">
                                <v-btn icon variant="text" @click="helpOpened = true" v-bind="tooltipProps">
                                    <v-icon>mdi-help-circle-outline</v-icon>
                                </v-btn>
                            </template>
                            <span>Show help</span>
                        </v-tooltip>
                    </div>
                </div>

                <!-- Metadata Card -->
                <v-card variant="outlined" class="mb-4 rounded-lg overflow-hidden elevation-1 border-light">
                    <v-card-text class="pa-4">
                        <v-text-field
                            v-model="tempSource.title"
                            placeholder="Song Title"
                            class="text-h5 font-weight-bold mb-2"
                            :rules="rules"
                            hide-details="auto"
                            variant="solo"
                            flat
                            bg-color="transparent"
                        ></v-text-field>
                        <v-divider class="mb-4"></v-divider>
                        <v-row dense>
                            <v-col cols="12" sm="6">
                                <v-combobox
                                    density="compact"
                                    variant="outlined"
                                    label="Author"
                                    v-model="tempSource.author"
                                    :items="authors"
                                    hide-details
                                    prepend-inner-icon="mdi-account"
                                ></v-combobox>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-combobox
                                    density="compact"
                                    variant="outlined"
                                    label="Tags"
                                    v-model="tempSource.labels"
                                    :items="labels"
                                    hide-selected
                                    multiple
                                    chips
                                    hide-details
                                    prepend-inner-icon="mdi-tag-multiple"
                                ></v-combobox>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>

                <!-- Editor Card -->
                <v-card variant="outlined" class="rounded-lg d-flex flex-column flex-grow-1 mb-4 elevation-1 border-light editor-card">
                    <chord-text-editor
                        v-model="tempSource.text"
                        :chords-above-text="tempSource.chordsAboveText"
                        :standard-notation="tempSource.standardNotation"
                        :trim-lines="tempSource.trimLines"
                        @chord-mode-changed="tempSource.chordsAboveText = $event"
                        @notation-changed="tempSource.standardNotation = $event"
                        @trim-lines-changed="tempSource.trimLines = $event"
                        class="flex-grow-1"
                    />
                </v-card>

                <!-- Footer Actions -->
                <div v-if="!userLogged" class="text-caption text-medium-emphasis text-right mb-2">
                    Sign in to save songs
                </div>
                <div class="d-flex align-center flex-wrap pb-4" style="gap: 8px">
                     <v-btn v-if="type === 'edit'" @click="$emit('delete')" color="error" variant="text" size="large">
                        <v-icon start>mdi-delete-outline</v-icon> Delete
					</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn variant="text" @click="reset" size="large">{{ type === 'add' ? 'Clear' : 'Cancel' }}</v-btn>
                    <v-btn variant="flat" color="primary" type="submit" :disabled="!validInput || !userLogged" size="large">
                         <v-icon start>{{ type === 'add' ? 'mdi-plus' : 'mdi-content-save' }}</v-icon>
                         {{ type === 'add' ? 'Create Song' : 'Save Changes' }}
                    </v-btn>
                </div>
            </div>
		</v-form>
	</v-container>
</template>

<script>
import { mapGetters } from "vuex";
import ImageDialog from "../components/Dialogs/ImageDialog.vue";
import ChordTextEditor from "./ChordTextEditor.vue";

import songParser from "../mixins/songParser";
export default {
	mixins: [songParser],

	emits: ["song-submited", "cancel", "delete", "back", "input"],

	data() {
		return {
			rules: [(value) => !!value || ""],
			tempSource: undefined,
			helpOpened: false,
			dirty: false,
			syncing: false,
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
		defaultSource() {
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

		// Merge over defaults so songs saved before a setting existed still get
		// a defined value, and clone so edits never mutate the store object.
		// Flags are coerced because old records hold 0/1 instead of booleans.
		sourceCopy() {
			const copy = { ...this.defaultSource(), ...this.songSource };
			copy.labels = [...(copy.labels || [])];
			copy.chordsAboveText = !!copy.chordsAboveText;
			copy.standardNotation = !!copy.standardNotation;
			copy.trimLines = !!copy.trimLines;
			copy.public = !!copy.public;
			return copy;
		},

		syncFromSource() {
			this.syncing = true;
			this.tempSource = this.sourceCopy();
			this.standardNotation = this.tempSource.standardNotation;
			this.$nextTick(() => {
				this.syncing = false;
			});
		},

		reset() {
			if (this.type === "add") {
				this.tempSource = this.defaultSource();
				this.$refs.form.resetValidation();
			} else {
				this.$emit("cancel");
			}
		},

		onSubmit() {
			this.$emit("song-submited", this.tempSource);
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
			if (!this.tempSource.title || this.tempSource.title.trim().length == 0) return false;
			if (!this.tempSource.text || this.tempSource.text.trim().length == 0) return false;
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
		this.syncFromSource();
		this.$emit("input", this.formatedSong);
		this.$store.dispatch("loadAuthors");
		this.$store.dispatch("loadLabels");
	},

	watch: {
		// Background store updates (firebase child_changed) must not clobber
		// in-progress edits, so only re-sync while the form is untouched.
		songSource: {
			handler: function() {
				if (this.dirty) return;
				this.syncFromSource();
			},
			deep: true,
		},
		"tempSource.standardNotation": function(newValue) {
			this.standardNotation = newValue;
		},

		tempSource: {
			handler: function() {
				if (!this.syncing) this.dirty = true;
				this.$emit("input", this.formatedSong);
			},
			deep: true,
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
	},
};
</script>

<style lang="scss" scoped>
.editor-card {
	min-height: 500px;
}

// Fit the editor to the phone viewport so typing does not require scrolling
// past it; 260px accounts for the app bar, header row, and metadata card.
@media (max-width: 959.98px) {
	.editor-card {
		min-height: max(300px, calc(100dvh - 260px));
	}
}
</style>
