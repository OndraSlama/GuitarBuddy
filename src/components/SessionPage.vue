<template>
	<v-container class="align-start " style="min-width:100%">
		<div v-if="isOwner" class="d-flex flex-wrap justify-space-between align-center mb-4">
			<v-btn color="error" class="my-2 mr-2" @click="stopSession">Stop session</v-btn>
			<div class=" text--secondary subheader elevation-1 px-3 py-1" style="min-width: 190px">
				Session running: {{ elapsedTime }} <br />
				Connected: {{ playSession.connected }}
			</div>
		</div>
		<v-scroll-x-transition>
			<song-sheet v-if="!songListLoading && songValid && !transitioning" :song="song" type="session-view"></song-sheet>
			<div v-else-if="!transitioning" class="align-self-center mt-10 pa-3  mx-auto" style="max-width:800px">
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
			return this.playSession?.currentSong;
		},

		songValid() {
			return !(this.song === null || this.song === undefined);
		},
	},

	mounted() {
		this.$store.dispatch("playSessionOn", this.id);
		this.intervalId = setInterval(() => {
			try {
				var before = this.$moment(this.playSession.createdAt);
				var now = this.$moment();

				this.elapsedTime = this.$moment.utc(now.diff(before)).format("HH:mm:ss");

				while (this.elapsedTime.startsWith("00:")) {
					this.elapsedTime = this.elapsedTime.replace("00:", "");
				}
			} catch (_) {
				_;
			}
		}, 1000);
	},

	beforeDestroy() {
		this.$store.dispatch("playSessionOff", this.playSession.id);
		clearInterval(this.timerId);
	},

	components: {
		"song-sheet": SongSheet,
	},
	watch: {
		song: function(newSong, oldSong) {
			if (newSong?.title === oldSong?.title) return;
			this.transitioning = true;
			setTimeout(() => {
				this.transitioning = false;
			}, 150);
		},
	},
};
</script>

<style lang="scss" scoped></style>
