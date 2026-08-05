<template>
	<div class="mt-0">
		<v-tabs v-model="mobileTab" grow density="compact" color="primary" class="hidden-md-and-up mb-2">
			<v-tab value="edit"><v-icon start>mdi-pencil-outline</v-icon>Edit</v-tab>
			<v-tab value="preview"><v-icon start>mdi-eye-outline</v-icon>Preview</v-tab>
		</v-tabs>
		<v-row>
			<v-col v-show="viewportSize.mdAndUp || mobileTab === 'edit'" cols="12" :md="expanded ? 8 : 6" :lg="expanded ? 8 : 6" style="position: relative">
				<!-- No display utility here: its !important would defeat v-show -->
				<div v-show="!viewportSize.mdAndUp || showSongSheet" class="text-right mb-2">
					<import-from-photo variant="compact" :confirm-replace="showSongSheet" v-on:extracted="applyExtractedSong" v-on:error="showImportError" />
				</div>
				<song-editor :key="'prefill-' + prefillCounter" :song-source="prefill" v-on:song-submited="addSong" v-on:input="formatedSong = $event" v-on:back="$router.push('/')" type="add"> </song-editor>
				<v-btn size="x-large" icon variant="text" color="primary" class="resize-button elevation-0 hidden-sm-and-down" @click="expanded = !expanded">
					<v-icon v-if="expanded">mdi-chevron-left</v-icon>
					<v-icon v-else>mdi-chevron-right</v-icon>
				</v-btn>
			</v-col>
			<v-col v-show="viewportSize.mdAndUp || mobileTab === 'preview'" cols="12" :md="expanded ? 4 : 6" :lg="expanded ? 4 : 6" class="pl-md-9">
				<div v-if="scannedPhotos.length > 0" class="d-flex flex-wrap mb-2" style="gap: 8px">
					<v-chip v-for="(photo, index) in scannedPhotos" :key="photo.url" size="small" prepend-icon="mdi-image-outline" @click="openScannedPhoto(photo)">
						Photo {{ index + 1 }}
					</v-chip>
				</div>
				<v-scroll-y-transition hide-on-leave>
					<song-sheet v-if="showSongSheet" :expanded="expanded" :song="formatedSong"></song-sheet>
				</v-scroll-y-transition>
				<v-scroll-y-transition hide-on-leave>
					<div v-if="!showSongSheet" style="min-height: 60vh" class="d-flex flex-column justify-center align-center">
						<import-from-photo variant="card" class="mb-8" v-on:extracted="applyExtractedSong" v-on:error="showImportError" />
						<import-songs></import-songs>
					</div>
				</v-scroll-y-transition>
			</v-col>
		</v-row>
		<image-dialog v-model="photoDialogOpened" :imagePath="photoDialogUrl"></image-dialog>
		<v-snackbar v-model="errorSnackbar" color="error"> {{ errorMessage }} </v-snackbar>
		<v-snackbar v-model="warningSnackbar" color="warning" :timeout="8000"> {{ warningMessage }} </v-snackbar>
	</div>
</template>

<script>
import SongSheet from "../components/SongSheet.vue";
import SongEditor from "../components/SongEditor.vue";
import ImportSongs from "../components/Others/ImportSongs.vue";
import ImportFromPhoto from "../components/Others/ImportFromPhoto.vue";
import ImageDialog from "../components/Dialogs/ImageDialog.vue";
import { mapGetters } from "vuex";

export default {
	data() {
		return {
			formatedSong: undefined,
			expanded: false,
			mobileTab: "edit",
			errorSnackbar: false,
			errorMessage: "",
			warningSnackbar: false,
			warningMessage: "",
			prefill: undefined,
			prefillCounter: 0,
			scannedPhotos: [],
			photoDialogOpened: false,
			photoDialogUrl: "",
		};
	},
	methods: {
		applyExtractedSong({ songSource, warnings, photos }) {
			this.releaseScannedPhotos();
			this.scannedPhotos = photos.map((file) => ({ url: URL.createObjectURL(file) }));
			this.prefill = songSource;
			// Remounting the editor resets its dirty flag so the new source applies
			this.prefillCounter++;
			this.mobileTab = "edit";
			if (warnings.length > 0) {
				this.warningMessage = warnings.join(" ");
				this.warningSnackbar = true;
			}
		},

		showImportError(message) {
			this.errorMessage = message;
			this.errorSnackbar = true;
		},

		openScannedPhoto(photo) {
			this.photoDialogUrl = photo.url;
			this.photoDialogOpened = true;
		},

		releaseScannedPhotos() {
			this.scannedPhotos.forEach((photo) => URL.revokeObjectURL(photo.url));
			this.scannedPhotos = [];
		},

		addSong(songInput) {
			if (this.formatedSong == undefined) return;

			let newSong = {
				...this.formatedSong,
				input: {
					...songInput,
				},
			};

			this.$store
				.dispatch("addSong", newSong)
				.then((id) => this.$router.push("/song/" + id))
				.catch(() => {
					this.errorMessage = "Could not create the song. Are you signed in?";
					this.errorSnackbar = true;
				});
		},
	},
	computed: {
		...mapGetters({
			userLogged: "getUserLogged",
			user: "getUser",
			showTooltips: "getShowTooltips",
		}),
		showSongSheet() {
			return this.formatedSong !== undefined && !!(this.formatedSong.author || this.formatedSong.title || this.formatedSong.sections.length > 0);
		},
	},
	components: {
		"song-sheet": SongSheet,
		"song-editor": SongEditor,
		"import-songs": ImportSongs,
		"import-from-photo": ImportFromPhoto,
		"image-dialog": ImageDialog,
	},

	created() {
		this.$store.commit("setCurrentPage", "Add Song");
	},

	beforeUnmount() {
		this.releaseScannedPhotos();
	},
};
</script>

<style lang="scss" scoped>
.resize-button {
	position: absolute;
	top: clamp(0px, 55%, 50vh);
	right: -37px;
}
</style>
