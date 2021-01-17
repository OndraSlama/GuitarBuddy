<template>
	<div>
		<v-skeleton-loader v-show="transitioning || song == null" type="article"></v-skeleton-loader>
		<v-scroll-x-transition hide-on-leave>
			<v-row v-if="!transitioning && song !== null">
				<v-col cols="12" :md="expanded ? 8 : 6" :lg="expanded ? 8 : 4" style="position: relative">
					<song-editor :songSource="song !== undefined ? song.input : undefined" v-on:song-submited="updateSong" v-on:input="formatedSong = $event" v-on:cancel="onCancel" v-on:delete="onDelete" v-on:back="$router.push('/song/' + id)" type="edit"></song-editor>
					<v-btn xLarge icon color="primary" class="resize-button elevation-0 hidden-sm-and-down" @click="expanded = !expanded">
						<v-icon v-if="expanded">mdi-chevron-left</v-icon>
						<v-icon v-else>mdi-chevron-right</v-icon>
					</v-btn>
				</v-col>
				<v-divider class="hidden-md-and-up"></v-divider>
				<v-col cols="12" :md="expanded ? 4 : 6" :lg="expanded ? 4 : 8">
					<song-sheet :song="formatedSong" type="editor-view" :expanded="expanded" class="pl-md-6"></song-sheet>
				</v-col>
			</v-row>
		</v-scroll-x-transition>
		<v-snackbar v-model="snackbar"> Song edited </v-snackbar>
	</div>
</template>

<script>
import SongSheet from "../components/SongSheet";
import SongEditor from "../components/SongEditor";
import { mapGetters } from "vuex";
export default {
	data() {
		return {
			transitioning: false,
			formatedSong: undefined,
			expanded: false,
			snackbar: false,
		};
	},
	methods: {
		updateSong(songSource) {
			if (this.formatedSong == undefined) {
				alert("Undefined formated song");
				return;
			}

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

			this.$store.dispatch("updateSong", payload).then(() => {
				this.snackbar = true;
			});

			//   this.$router.push("/song/" + this.id);
		},

		onCancel() {
			this.$router.push("/song/" + this.id);
		},

		onDelete() {
			this.$store.dispatch("deleteSong", this.id);
			this.$router.push("/song-book");
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
				this.$router.push("/song-book").catch(() => {});
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
