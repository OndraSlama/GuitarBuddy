<template>
	<v-container fill-height class="justify-center pa-0" style="min-width:100%">
		<!-- <v-skeleton-loader v-show="transitioning" v-for="n in 3" :key="n" height="50" type="list-item-two-line"></v-skeleton-loader> -->
		<v-scroll-y-transition>
			<v-container fill-height v-show="!transitioning" class="ml-n1 pa-0 align-start justify-center" style="min-width:100%">
				<!-- <song-sheet v-if="!songListLoading && !transitioning && song != null" :song="song"></song-sheet> -->
				<start-session-page v-if="noSession" class="align-self-center" v-on:sessionStart="transitioning = true"></start-session-page>
				<session-page v-if="!noSession" v-on:sessionStop="transitioning = true" :selectedSong="selectedSong"></session-page>

				<!-- <div>{{ playSession }}</div>
				<div>{{ noSession }}</div> -->
			</v-container>
		</v-scroll-y-transition>
	</v-container>
</template>

<script>
import { mapGetters } from "vuex";
import StartSessionPage from "../components/StartSessionPage";
import SessionPage from "../components/SessionPage";
export default {
	data() {
		return {
			transitioning: false,
			selectedSong: null,
		};
	},

	computed: {
		...mapGetters({
			user: "getUser",
			playSession: "getPlaySession",
		}),

		id() {
			return this.$route.params.id;
		},

		noSession() {
			return !this.$route.params.id;
		},
	},

	methods: {},

	created() {
		this.$store.commit("setCurrentPage", "Play Session");
	},

	mounted() {
		if (this.playSession?.id) {
			this.$router.push("/play-session/" + this.playSession.id);
		}
	},

	watch: {
		playSession: function() {
			if (this.playSession?.id) {
				this.$router.push("/play-session/" + this.playSession.id);
			}
		},
		id: function() {
			this.transitioning = false;
		},
	},

	beforeRouteLeave(to, _, next) {
		if (to.name == "SongSheet" && to.params?.id && !this.noSession) {
			this.selectedSong = this.$store.getters.getCurrentSong(to.params.id);
		} else {
			next();
		}
	},

	components: {
		"start-session-page": StartSessionPage,
		"session-page": SessionPage,
	},
};
</script>

<style lang="scss" scoped></style>
