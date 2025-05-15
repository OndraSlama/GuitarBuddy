<template>
	<v-container class="fill-height text-center" fluid>
		<v-row align="center" justify="center">
			<v-col cols="12" sm="8" md="6" lg="5">
				<v-card class="elevation-6 pa-6 pa-md-10 rounded-lg">
					<v-avatar color="primary" size="80" class="mb-6">
						<v-icon dark size="50">mdi-account-music-outline</v-icon>
					</v-avatar>
					<h1 class="text-h4 font-weight-bold mb-3 primary--text">
						Ready to Jam Together?
					</h1>
					<p class="text-body-1 text--secondary mb-8">
						Start a Play Session to share your song choices live with friends or bandmates.
						Everyone in the session will see the same song sheet in real-time.
					</p>
					<v-btn
						x-large
						color="success"
						@click="startSession"
						class="elevation-2"
						:loading="startingSession"
						rounded
						depressed
					>
						<v-icon left>mdi-play-circle-outline</v-icon>
						Start New Session
					</v-btn>
					<p class="text-caption mt-4 text--disabled">
						Once started, share the session link to invite others.
					</p>
				</v-card>
			</v-col>
		</v-row>
	</v-container>
</template>

<script>
import { mapGetters } from "vuex";
export default {
	data() {
		return {
			startingSession: false,
		};
	},
	methods: {
		async startSession() {
			this.startingSession = true;
			this.$emit("sessionStart");
			try {
				await this.$store.dispatch("startPlaySession");
				// Navigace se provede ve watcheru v PlaySession.vue, když se aktualizuje playSession ve store
				// this.$router.push("/play-session/" + id);
			} catch (error) {
				console.error("Failed to start session:", error);
				this.$emit("sessionStartFailed");
				// Zde by se mohla zobrazit notifikace uživateli, např. pomocí snackbaru
			} finally {
				// startingSession se může resetovat, pokud by nedošlo k navigaci
				// ale jelikož navigaci řídí PlaySession.vue na základě store,
				// tento flag zde nemusí být nutně resetován, pokud vždy dojde k pokusu o změnu stavu.
				// Pro jistotu ho můžeme resetovat, pokud by akce selhala a zůstali jsme zde.
				if (!this.$store.state.playSession?.id) { // Kontrola, zda se session skutečně nevytvořila
					this.startingSession = false;
				}
			}
		},
	},
	computed: {
		...mapGetters({
			user: "getUser",
		}),
	},
};
</script>

<style lang="scss" scoped>
// Můžete přidat jemný gradient na pozadí kontejneru nebo karty pro modernější vzhled
// .fill-height {
//   background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
// }
</style>