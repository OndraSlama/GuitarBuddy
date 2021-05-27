<template>
	<v-container class="align-start" style="min-width:100%">
		<div v-if="isOwner" class="d-flex wrap justify-space-between align-center mb-4">
			<div class="title ">Session running: {{ elapsedTime }}</div>
			<v-btn color="error" @click="stopSession">Stop session</v-btn>
		</div>
		<v-scroll-x-transition>
			<song-sheet v-if="!songListLoading && songValid && !transitioning" :song="song"></song-sheet>
			<div v-else-if="!transitioning" class="align-self-center mt-5 pa-3 elevation-2">
				<div class="display-1 text--secondary text-center">
					Select a song from your playlist at the left side panel or go to Browse Songs tab and choose there.
				</div>
				<div class="title mt-5 text--secondary text-center">
					Selected song will be displayed to everyone that has this page opened.
				</div>
			</div>
		</v-scroll-x-transition>
	</v-container>
</template>

<script>
import { mapGetters } from "vuex";

import SongSheet from "../components/SongSheet";
export default {
	props: ["selectedSong"],
	data() {
		return {
			transitioning: false,
			elapsedTime: "0",
			intervalId: null,
		};
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
		this.intervalId = setInterval(() => {
			var before = this.$moment(this.playSession.createdAt);
			var now = this.$moment();

			this.elapsedTime = this.$moment.utc(now.diff(before)).format("HH:mm:ss");

			while (this.elapsedTime.startsWith("00:")) {
				this.elapsedTime = this.elapsedTime.replace("00:", "");
			}
		});
	},

	destroyed() {
		this.$store.dispatch("playSessionOff", this.id);
		clearInterval(this.timerId);
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

		song: function() {
			this.transitioning = true;
			setTimeout(() => {
				this.transitioning = false;
			}, 150);
		},
	},
};
</script>

<style lang="scss" scoped></style>
