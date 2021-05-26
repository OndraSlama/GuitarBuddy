<template>
	<div>
		<div v-if="isOwner" class="d-flex justify-space-around align-center mb-4">
			<div class=" display-1">Your session</div>
			<v-btn color="error" @click="stopSession">Stop session</v-btn>
		</div>
		<song-sheet v-if="!songListLoading && songValid" :song="song"></song-sheet>
	</div>
</template>

<script>
import { mapGetters } from "vuex";

import SongSheet from "../components/SongSheet";
export default {
	props: ["selectedSong"],
	data() {
		return {};
	},

	methods: {
		stopSession() {
			this.$emit("sessionStop");
			this.$store.dispatch("stopPlaySession", this.id).then(() => {
				this.$router.push("/play-session");
			});
		},
	},

	computed: {
		...mapGetters({
			user: "getUser",
			songListLoading: "getSongListLoading",
			playSession: "getPlaySession",
		}),

		id() {
			return this.$route.params.id;
		},

		isOwner() {
			return this.playSession?.createdBy === this.user?.uid && this.user;
		},

		song() {
			return this.playSession.currentSong;
		},

		songValid() {
			return !(this.song === null || this.song === undefined);
		},
	},

	mounted() {
		this.$store.dispatch("playSessionOn", this.id);
	},

	destroyed() {
		this.$store.dispatch("playSessionOff", this.id);
	},

	components: {
		"song-sheet": SongSheet,
	},
	watch: {
		selectedSong: function() {
			if (this.playSession && this.isOwner) {
				this.$store.dispatch("updatePlaySession", {
					...this.playSession,
					currentSong: this.selectedSong,
				});
			}
		},
	},
};
</script>

<style lang="scss" scoped></style>
