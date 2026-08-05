<template>
	<v-container class="fill-height justify-center pa-0" style="min-width:100%" fluid>
		<session-page v-if="routeSessionId" :session-id="routeSessionId"></session-page>
		<div v-else-if="redirecting" class="fill-height d-flex justify-center align-center">
			<v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
		</div>
		<start-session-page v-else class="align-self-center"></start-session-page>
	</v-container>
</template>

<script>
import { mapGetters } from "vuex";
import StartSessionPage from "../components/StartSessionPage.vue";
import SessionPage from "../components/SessionPage.vue";

export default {
	components: {
		StartSessionPage,
		SessionPage,
	},
	data() {
		return {
			redirecting: false,
		};
	},
	computed: {
		...mapGetters({
			activeSessionId: "getActiveSessionId",
		}),
		routeSessionId() {
			return this.$route.params.id;
		},
	},
	methods: {
		// The route param is the single source of truth; the base route only
		// redirects to a known session (own active one, or the last joined one).
		resolveEntry() {
			if (this.routeSessionId) {
				this.redirecting = false;
				return;
			}
			const target = this.activeSessionId || localStorage.getItem("lastActiveSessionId");
			if (target) {
				this.redirecting = true;
				this.$router.replace(`/play-session/${target}`).catch(() => {
					this.redirecting = false;
				});
			} else {
				this.redirecting = false;
			}
		},
	},
	watch: {
		routeSessionId: "resolveEntry",
		activeSessionId() {
			if (!this.routeSessionId) this.resolveEntry();
		},
	},
	created() {
		this.$store.commit("setCurrentPage", "Play Session");
		this.resolveEntry();
	},
};
</script>
