<template>
	<v-container fill-height class="justify-center pa-0" style="min-width:100%" fluid>
		<v-fade-transition mode="out-in">
			<div v-if="loadingInitialState" key="loading" class="fill-height d-flex justify-center align-center">
				<v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
			</div>
			<start-session-page
				v-else-if="showStartPage"
				key="start"
				class="align-self-center"
				@sessionStart="handleSessionInteraction"
				@sessionStartFailed="handleSessionInteraction"
			></start-session-page>
			<session-page
				v-else-if="showSessionPage"
				key="active"
				:session-id-from-route="routeSessionId"
				@sessionStop="handleSessionInteraction"
			></session-page>
			<div v-else-if="!loadingInitialState && routeSessionId && !playSession" key="notfound-explicit" class="fill-height d-flex flex-column justify-center align-center text-center pa-4">
				<v-icon size="80" color="warning" class="mb-4">mdi-link-off</v-icon>
				<h2 class="text-h5 mb-2">Session Invalid or Ended</h2>
				<p class="text-body-1 text--secondary">The session link you used is no longer valid or the session has ended.</p>
				<v-btn color="primary" to="/play-session" class="mt-4" rounded depressed>
					Go to Play Sessions
				</v-btn>
			</div>
			<div v-else key="fallback-empty" class="fill-height d-flex flex-column justify-center align-center text-center pa-4">
				<!-- Tento fallback by se neměl často zobrazovat, pokud logika výše funguje správně -->
				<v-icon size="80" color="grey" class="mb-4">mdi-help-circle-outline</v-icon>
				<h2 class="text-h5 mb-2">Something went wrong</h2>
				<p class="text-body-1 text--secondary">Please try again or start a new session.</p>
				<v-btn color="primary" to="/play-session" class="mt-4" rounded depressed>
					Go to Play Sessions
				</v-btn>
			</div>
		</v-fade-transition>
	</v-container>
</template>

<script>
import { mapState, mapActions } from "vuex";
import StartSessionPage from "../components/StartSessionPage.vue";
import SessionPage from "../components/SessionPage.vue";

export default {
	components: {
		StartSessionPage,
		SessionPage,
	},
	data() {
		return {
			loadingInitialState: true,
		};
	},
	computed: {
		...mapState({
			playSession: state => state.playSession,
			user: state => state.user,
		}),
		routeSessionId() {
			return this.$route.params.id;
		},
		showStartPage() {
			return !this.routeSessionId && (!this.playSession || !this.playSession.id);
		},
		showSessionPage() {
			// Zobrazí se, pokud máme ID v routě (SessionPage si pak ověří jeho platnost)
			// NEBO pokud máme platnou session ve store (a přesměrovali jsme na ni)
			return !!this.routeSessionId || (this.playSession && this.playSession.id);
		},
		isOwner() {
			return this.playSession?.createdBy === this.user?.uid && !!this.user;
		},
	},
	methods: {
		...mapActions(['playSessionOn', 'playSessionOff', 'updatePlaySession', 'stopPlaySession']), // Přidáno stopPlaySession pro jistotu
		handleSessionInteraction() {
			this.loadingInitialState = true;
			this.$nextTick(() => {
				setTimeout(() => {
					this.loadingInitialState = false;
				}, 300);
			});
		},
		async syncSessionState() {
			this.loadingInitialState = true;
			const currentSessionIdInStore = this.playSession?.id;
			const lastActiveSessionIdFromStorage = localStorage.getItem('lastActiveSessionId');

			if (this.routeSessionId) {
				// Případ 1: Máme ID v URL (uživatel kliknul na přímý link nebo byl přesměrován)
				console.log(`PlaySession View: Syncing with routeSessionId: ${this.routeSessionId}`);
				if (this.routeSessionId !== currentSessionIdInStore) {
					if(currentSessionIdInStore) {
						await this.playSessionOff(currentSessionIdInStore);
					}
					// SessionPage se postará o volání playSessionOn s this.routeSessionId
				}
				// Pokud je ID v URL, má přednost před localStorage, ale localStorage se aktualizuje v SessionPage
			} else if (lastActiveSessionIdFromStorage) {
				// Případ 2: Nemáme ID v URL, ale máme ID v localStorage (uživatel kliknul na "Play Session" v menu)
				console.log(`PlaySession View: Found lastActiveSessionId in localStorage: ${lastActiveSessionIdFromStorage}`);
				// Přesměrujeme na tuto session. Router pak znovu spustí tento cyklus s routeSessionId.
				this.$router.replace({ path: `/play-session/${lastActiveSessionIdFromStorage}` }).catch(()=>{});
				// Návrat, protože přesměrování spustí nový cyklus.
				// loadingInitialState zůstane true, dokud se nový cyklus nedokončí.
				return;
			} else {
				// Případ 3: Nemáme ID v URL ani v localStorage (čistý stav, nebo uživatel nikdy nebyl v session)
				console.log("PlaySession View: No routeSessionId and no localStorage sessionId.");
				if (currentSessionIdInStore) {
					// Pokud je nějaká session ve store (např. majitel ji právě vytvořil), přesměrujeme na ni.
					this.$router.replace({ path: `/play-session/${currentSessionIdInStore}` }).catch(()=>{});
					return; // Návrat, protože přesměrování spustí nový cyklus.
				}
				// Jinak se zobrazí StartSessionPage (řízeno computed properties showStartPage)
			}

			setTimeout(() => {
				this.loadingInitialState = false;
			}, 500);
		}
	},
	watch: {
		routeSessionId: {
			handler: "syncSessionState",
		},
		'playSession.id': "syncSessionState",
	},
	created() {
		this.$store.commit("setCurrentPage", "Play Session");
        this.syncSessionState();
	},
	beforeRouteUpdate(to, from, next) {
    if (to.params.id !== from.params.id) {
      this.loadingInitialState = true;
    }
    next();
  },
	beforeRouteLeave(to, from, next) {
		if (this.playSession && this.isOwner && to.name === "SongSheet" && to.params?.id) {
			const songToSet = this.$store.getters.getCurrentSong(to.params.id);
			if (songToSet && songToSet.id !== this.playSession.currentSong?.id) {
				this.updatePlaySession({
					...this.playSession,
					currentSong: songToSet,
				});
			}
		}
		next();
	},
};
</script>