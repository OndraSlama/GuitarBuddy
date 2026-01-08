<template>
	<div>
		<v-skeleton-loader v-show="(songListLoading || !songValid) && !songDoesNotExist" type="article"></v-skeleton-loader>
		<v-scroll-x-transition>
			<song-sheet v-if="!songListLoading && !transitioning && songValid" :song="song"></song-sheet>
			<div v-if="!songValid && songDoesNotExist" class="d-flex justify-center ">
				<div class="display-1 mt-5 ">Song does not exist</div>
			</div>
		</v-scroll-x-transition>
	</div>
</template>

<script>
import SongSheet from "../components/SongSheet";

import { mapGetters } from "vuex";

export default {
	data() {
		return {
			transitioning: false,
			songDoesNotExist: false,
			song: null
		};
	},

	methods: {
		updateNavigationTitle() {
			if (this.song !== null && this.song !== undefined) {
				this.$store.commit("setCurrentPage", this.song?.title + " - " + (this.song.author.trim() || "Unknown"));
			}
		},

		loadSong(id){
			this.$store.dispatch("loadSong", id)
				.then((song) => {
					this.song = song;
					if (this.userLogged && this.$store.getters.getCurrentSong(song.id)) {
						this.$store.dispatch("updateLastViewed", song.id);
					}
					this.updateNavigationTitle();
					this.transitioning = true;
					this.songDoesNotExist = false;
					setTimeout(() => {
						this.transitioning = false;
					}, 150);
					setTimeout(() => {
						this.songDoesNotExist = true;
					}, 5000);
				})
				.catch((e) => {
					console.log(e);
				});
	},
	},

	computed: {
		id() {
			return this.$route.params.id;
		},

		songValid() {
			return !(this.song === null || this.song === undefined);
		},

		...mapGetters({
			songListLoading: "getSongListLoading",
			userLogged: "getUserLogged",
		}),
	},
	components: {
		"song-sheet": SongSheet,
	},

	// updated() {
	// 	this.updateNavigationTitle();
	// },

	mounted() {
		this.loadSong(this.id);
	},

	created() {
		this.updateNavigationTitle();
		setTimeout(() => {
			this.songDoesNotExist = true;
		}, 5000);
	},	

	watch: {
		id: function() {
			this.loadSong(this.id)
		},

		song: function() {
			this.updateNavigationTitle();
			if (!this.songValid) {
				this.$router.push("/song").catch(() => {});
			}
		},
	},
};
</script>

<style lang="scss" scoped></style>
