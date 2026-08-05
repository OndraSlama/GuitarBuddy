<template>
	<div>
		<v-skeleton-loader v-show="transitioning || song == null" type="article"></v-skeleton-loader>
		<v-scroll-x-transition hide-on-leave>
			<div v-if="!transitioning && song !== null">
				<v-tabs v-model="mobileTab" grow density="compact" color="primary" class="hidden-md-and-up mb-2">
					<v-tab value="edit"><v-icon start>mdi-pencil-outline</v-icon>Edit</v-tab>
					<v-tab value="preview"><v-icon start>mdi-eye-outline</v-icon>Preview</v-tab>
				</v-tabs>
				<v-row>
					<v-col v-show="viewportSize.mdAndUp || mobileTab === 'edit'" cols="12" :md="expanded ? 8 : 6" :lg="expanded ? 8 : 6" style="position: relative">
						<song-editor :songSource="song !== undefined ? song.input : undefined" v-on:song-submited="updateSong" v-on:input="formatedSong = $event" v-on:cancel="onCancel" v-on:delete="deleteDialogOpened = true" v-on:back="$router.push('/song/' + id)" type="edit"></song-editor>
						<v-btn size="x-large" icon variant="text" color="primary" class="resize-button elevation-0 hidden-sm-and-down" @click="expanded = !expanded">
							<v-icon v-if="expanded">mdi-chevron-left</v-icon>
							<v-icon v-else>mdi-chevron-right</v-icon>
						</v-btn>
					</v-col>
					<v-col v-show="viewportSize.mdAndUp || mobileTab === 'preview'" cols="12" :md="expanded ? 4 : 6" :lg="expanded ? 4 : 6">
						<song-sheet :song="formatedSong" type="editor-view" :expanded="expanded" class="pl-md-6"></song-sheet>
					</v-col>
				</v-row>
			</div>
		</v-scroll-x-transition>
		<delete-dialog v-model="deleteDialogOpened" v-on:accept="onDelete" />
		<v-snackbar v-model="errorSnackbar" color="error"> {{ errorMessage }} </v-snackbar>
	</div>
</template>

<script>
import SongSheet from "../components/SongSheet.vue";
import SongEditor from "../components/SongEditor.vue";
import { mapGetters } from "vuex";
export default {
	data() {
		return {
			transitioning: false,
			formatedSong: undefined,
			expanded: false,
			mobileTab: "edit",
			deleteDialogOpened: false,
			errorSnackbar: false,
			errorMessage: "",
		};
	},
	methods: {
		updateSong(songSource) {
			if (this.formatedSong == undefined) return;

			const payload = {
				id: this.id,
				data: {
					...this.song,
					...this.formatedSong,
					public: songSource.public,
					input: { ...songSource },
					modifiedAt: new Date().toISOString(),
				},
			};

			this.$store
				.dispatch("updateSong", payload)
				.then(() => this.$router.push("/song/" + this.id))
				.catch(() => {
					this.errorMessage = "Could not save the changes. Are you signed in?";
					this.errorSnackbar = true;
				});
		},

		onCancel() {
			this.$router.push("/song/" + this.id);
		},

		onDelete() {
			this.$store.dispatch("deleteSong", this.id);
			this.$router.push("/");
		},
	},
	computed: {
		id() {
			return this.$route.params.id;
		},

		song() {
			return this.$store.getters.getCurrentSong(this.id);
		},

		songValid() {
			return this.song != undefined || this.song != null;
		},
		...mapGetters({
			userLogged: "getUserLogged",
			user: "getUser",
			songListLoading: "getSongListLoading",
		}),
	},
	components: {
		"song-sheet": SongSheet,
		"song-editor": SongEditor,
	},

	created() {
		this.$store.commit("setCurrentPage", "Edit Song");
	},

	watch: {
		"$route.params.id": function() {
			this.transitioning = true;
			setTimeout(() => {
				this.transitioning = false;
			}, 80);
		},

		song: function() {
			if (this.song === null || this.song === undefined) {
				this.$router.push("/").catch(() => {});
			}
		},
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
