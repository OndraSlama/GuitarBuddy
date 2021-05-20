<template>
	<div class="text-center elevation-3 pa-6">
		<!-- <div class="d-flex "> -->
		<div class="display-3 mb-10" style="max-width:400px">
			Import songs
		</div>
		<v-form ref="form">
			<v-btn icon outlined color="primary" @click="validateAndOpenDialog" width="100" height="100" class="align-self-center">
				<v-icon size="60" color="primary">mdi-import</v-icon>
			</v-btn>
			<v-file-input v-model="file" outlined show-size :rules="fileRules" accept=".chordpro" label="ChordPro file input" class="mt-10 mx-auto"></v-file-input>
		</v-form>

		<import-settings-dialog v-model="openSettingsDialog" :importSettings="importSettings" v-on:accept="parseFile" />
		<import-confirmation-dialog v-model="openConfirmationDialog" :songs="formatedSongs" v-on:accept="saveSongs" />
	</div>
</template>

<script>
import songParser from "../../mixins/songParser";
import ImportSongSettingsDialog from "../Dialogs/ImportSongSettingsDialog";
import ImportConfirmationDialog from "../Dialogs/ImportConfirmationDialog";
import { mapGetters } from "vuex";
export default {
	mixins: [songParser],
	data() {
		return {
			fileRules: [(value) => !!value || "No file selected"],
			file: null,
			problems: [],
			formatedSongs: [],

			importSettings: {
				chordsAboveText: false,
				public: false,
				standardNotation: false,
				trimLines: false,
			},
			openSettingsDialog: false,
			openConfirmationDialog: false,
		};
	},

	methods: {
		validateAndOpenDialog() {
			this.$refs.form.validate();
			if (!this.file) return;
			this.openSettingsDialog = true;
		},

		parseFile(importSettings) {
			this.importSettings = { ...importSettings };

			const reader = new FileReader();
			reader.readAsText(this.file);

			reader.onload = () => {
				this.problems = [];

				let content = reader.result;
				let rawSongs = content.split("{new_song}");
				this.formatedSongs = this.formatSongs(rawSongs);

				if (this.problems.length > 0) alert(this.problems);

				this.openConfirmationDialog = true;
			};
		},

		saveSongs() {
			this.formatedSongs.forEach((song) => {
				this.$store.dispatch("addSong", song).then(() => console.log("Song: '" + song.title + "' was added to database."));
			});
		},

		formatSongs(rawSongs) {
			let formatedSongs = [];
			rawSongs.forEach((rawSong, index) => {
				try {
					let title = this.findTitle(rawSong);
					let author = this.fixAuthorName(this.findAuthor(rawSong));
					let formatedSong = {
						title,
						author,
						sections: this.parseSongText(this.findText(rawSong)),
						input: {
							title,
							author,
							text: this.findText(rawSong),
							...this.importSettings,
						},
					};
					formatedSongs.push(formatedSong);
				} catch (e) {
					this.problems.push(e + " -- Song on index: " + index + " ignored.");
				}
			});

			return formatedSongs;
		},

		findTitle(rawSong) {
			let match = /\{t:(.*?)\}/.exec(rawSong);
			if (!match) {
				throw "Could not find title.";
			}

			return match[1];
		},

		findAuthor(rawSong) {
			let match = /\{artist:(.*?)\}/.exec(rawSong);
			if (!match) {
				return "";
			}
			return match[1];
		},

		findText(rawSong) {
			return rawSong.replaceAll(/{(artist|t|key):.*?\}/gi, "").trim();
		},
	},

	computed: {
		...mapGetters({
			preferences: "getUserPreferences",
		}),
	},

	components: {
		"import-settings-dialog": ImportSongSettingsDialog,
		"import-confirmation-dialog": ImportConfirmationDialog,
	},

	watch: {
		"importSettings.standardNotation": function(newValue) {
			this.standardNotation = newValue;
		},
	},

	mounted() {
		this.standardNotation = this.preferences.notation == "Standard (A B C D E F G)";
	},
};
</script>

<style></style>
