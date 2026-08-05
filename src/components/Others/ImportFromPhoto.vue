<template>
	<div>
		<div v-if="variant === 'card'" class="text-center elevation-3 pa-6">
			<div class="text-h2 mb-10" style="max-width: 400px">
				Scan a photo
			</div>
			<v-btn icon variant="outlined" color="primary" width="100" height="100" :loading="loading" :disabled="!userLogged" @click="requestPhotos">
				<v-icon size="60" color="primary">mdi-camera-outline</v-icon>
			</v-btn>
			<div class="text-body-2 text-medium-emphasis mx-auto mt-10" style="max-width: 320px">
				{{ hintText }}
			</div>
		</div>

		<v-btn v-else variant="outlined" color="primary" :loading="loading" :disabled="!userLogged" @click="requestPhotos">
			<v-icon start>mdi-camera-outline</v-icon>
			Scan photo
		</v-btn>

		<input ref="fileInput" type="file" accept="image/*" multiple style="display: none" @change="onFilesPicked" />

		<general-dialog
			v-model="confirmDialogOpened"
			title="Replace editor content"
			text="Loading a song from a photo will replace the current content of the editor. Continue?"
			acceptButton="Yes, replace"
			v-on:accept="openPicker"
		/>
	</div>
</template>

<script>
import { mapGetters } from "vuex";
import { extractSongFromPhotos } from "../../functions/songPhotoService";

export default {
	props: {
		variant: {
			type: String,
			default: "card",
			validator: (value) => ["card", "compact"].indexOf(value) !== -1,
		},
		confirmReplace: {
			type: Boolean,
			default: false,
		},
	},

	emits: ["extracted", "error"],

	data() {
		return {
			loading: false,
			confirmDialogOpened: false,
		};
	},

	computed: {
		...mapGetters({
			userLogged: "getUserLogged",
			labels: "getLabels",
			authors: "getAuthors",
		}),

		hintText() {
			if (this.loading) return "Reading the song from the photo, this can take a moment...";
			if (!this.userLogged) return "Sign in to scan songs from photos.";
			return "Take a photo of a song sheet or pick one from your gallery. Select multiple photos if the song spans several pages.";
		},
	},

	methods: {
		requestPhotos() {
			if (this.confirmReplace) {
				this.confirmDialogOpened = true;
			} else {
				this.openPicker();
			}
		},

		openPicker() {
			this.$refs.fileInput.click();
		},

		async onFilesPicked(event) {
			const files = [...(event.target.files || [])];
			event.target.value = "";
			if (files.length === 0) return;

			this.loading = true;
			try {
				const extraction = await extractSongFromPhotos(files, { labels: this.labels, authors: this.authors });
				this.$emit("extracted", { ...extraction, photos: files });
			} catch (e) {
				this.$emit("error", e.message || "Could not read the song from the photo.");
			} finally {
				this.loading = false;
			}
		},
	},

	created() {
		this.$store.dispatch("loadLabels");
		this.$store.dispatch("loadAuthors");
	},
};
</script>

<style></style>
