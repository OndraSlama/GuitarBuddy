<template>
	<div>
		<v-skeleton-loader v-show="(songListLoading || !songValid) && !songDoesNotExist" type="article"></v-skeleton-loader>
		<v-scroll-x-transition>
			<song-sheet v-if="!songListLoading && !transitioning && songValid" :song="song"></song-sheet>
			<div v-if="!songValid && songDoesNotExist" class="d-flex justify-center ">
				<div class="display-1 mt-5 ">Song does not exist.</div>
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
		};
	},

	methods: {
		updateNavigationTitle() {
			if (this.song !== null && this.song !== undefined) {
				this.$store.commit("setCurrentPage", this.song?.title + " - " + (this.song.author.trim() || "Unknown"));
			}
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
			return !(this.song === null || this.song === undefined);
		},

		...mapGetters({
			songListLoading: "getSongListLoading",
		}),
	},
	components: {
		"song-sheet": SongSheet,
	},

	updated() {
		this.updateNavigationTitle();
	},

	created() {
		this.updateNavigationTitle();
		setTimeout(() => {
			this.songDoesNotExist = true;
		}, 400);
	},

	watch: {
		id: function() {
			this.updateNavigationTitle();
			this.transitioning = true;
			this.songDoesNotExist = false;
			setTimeout(() => {
				this.transitioning = false;
			}, 150);
			setTimeout(() => {
				this.songDoesNotExist = true;
			}, 1200);
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
