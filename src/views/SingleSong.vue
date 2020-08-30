<template>
	<div>
		<v-skeleton-loader v-show="songListLoading" type="article"> </v-skeleton-loader>
		<v-scroll-x-transition>
			<song-sheet v-if="!songListLoading && !transitioning" :song="song"></song-sheet>
		</v-scroll-x-transition>
	</div>
</template>

<script>
import SongSheet from "../components/SongSheet";

import { mapGetters } from "vuex";

export default {
	data() {
		return { transitioning: false };
	},

	computed: {
		id() {
			return this.$route.params.id;
		},

		song() {
			return this.$store.getters.getSong(this.id);
		},

		songValid() {
			return this.song != undefined || this.song != null;
		},

		...mapGetters({
			songListLoading: "getSongListLoading",
		}),
	},

	components: {
		"song-sheet": SongSheet,
	},

	watch: {
		"$route.params.id": function() {
			this.transitioning = true;
			setTimeout(() => {
				this.transitioning = false;
			}, 80);
		},
	},
};
</script>

<style lang="scss" scoped></style>
