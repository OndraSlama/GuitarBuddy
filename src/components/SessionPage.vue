<template>
	<v-container class="align-start pa-sm-4" style="min-width:100%">
		<!-- Session Information Panel (kompaktnější a jen pro hosta, pokud je to žádoucí) -->
		<!-- Rozhodl jsem se ho nechat pro oba, ale pro hosta může být méně interaktivní -->
		<v-card v-if="playSession && !isOwner" class="mb-5 elevation-2 session-info-card-guest rounded-lg">
			<v-toolbar flat dense color="transparent" height="48">
				<v-icon color="primary" class="mr-2 ml-1">mdi-information-outline</v-icon>
				<v-toolbar-title class="text-subtitle-1 font-weight-medium primary--text">
					Session Info
				</v-toolbar-title>
				<v-spacer></v-spacer>
				<v-chip small :color="connectionStatus.color" dark class="font-weight-bold mr-2">
					<v-icon left small>{{ connectionStatus.icon }}</v-icon>
					{{ connectionStatus.text }}
				</v-chip>
			</v-toolbar>
			<v-divider v-if="viewportSize.smAndUp"></v-divider>
			<v-card-text class="pt-2 pb-1" v-if="viewportSize.smAndUp">
				<v-row dense align="center">
					<v-col cols="12" sm="4">
						<div class="text-caption text--secondary">Host</div>
						<div class="font-weight-medium text-truncate" :title="sessionCreatorName || 'Loading...'">
							<v-icon small left>mdi-crown-outline</v-icon>
							{{ sessionCreatorName || "Loading..." }}
						</div>
					</v-col>
					<v-col cols="6" sm="4">
						<div class="text-caption text--secondary">Time</div>
						<div class="font-weight-medium">{{ elapsedTime }}</div>
					</v-col>
					<v-col cols="6" sm="4">
						<div class="text-caption text--secondary">Participants</div>
						<div class="font-weight-medium">
							<v-icon small left>mdi-account-multiple-outline</v-icon>
							{{ playSession.connected }}
						</div>
					</v-col>
				</v-row>
			</v-card-text>
		</v-card>

		<!-- Panel pro vlastníka session -->
		<v-card v-if="playSession && isOwner" class="mb-5 elevation-3 session-info-card-owner rounded-lg">
			<v-toolbar flat dense color="transparent">
				<v-icon color="primary" class="mr-2">mdi-cogs</v-icon>
				<v-toolbar-title class="font-weight-medium primary--text">My Session Controls</v-toolbar-title>
				<v-spacer></v-spacer>
				<v-chip small :color="connectionStatus.color" dark class="font-weight-bold">
					<v-icon left small>{{ connectionStatus.icon }}</v-icon>
					{{ connectionStatus.text }}
				</v-chip>
			</v-toolbar>
			<v-divider></v-divider>
			<v-card-text class="pt-4">
				<v-row dense>
					<v-col cols="12" md="6" lg="4">
						<div class="text-caption text--secondary">Share this link:</div>
						<v-text-field
							:value="sessionLink"
							readonly
							dense
							outlined
							hide-details
							append-icon="mdi-content-copy"
							@click:append="copySessionLink"
							class="mt-1"
						></v-text-field>
					</v-col>
					<v-col cols="6" sm="4" lg="2">
						<div class="text-caption text--secondary">Time Elapsed</div>
						<div class="font-weight-medium">{{ elapsedTime }}</div>
					</v-col>
					<v-col cols="6" sm="4" lg="2">
						<div class="text-caption text--secondary">Participants</div>
						<div class="font-weight-medium">
							<v-icon small left>mdi-account-multiple-outline</v-icon>
							{{ playSession.connected }}
						</div>
					</v-col>
					<v-col cols="12" sm="4" lg="4" class="d-flex align-end justify-end">
						<v-btn
							color="error"
							@click="confirmStopSession"
							:loading="stoppingSession"
							depressed
							rounded
						>
							<v-icon left>mdi-stop-circle-outline</v-icon>
							Stop Session
						</v-btn>
					</v-col>
				</v-row>
			</v-card-text>
		</v-card>


		<!-- Song Display or Placeholder -->
		<v-scroll-x-transition mode="out-in">
			<song-sheet
				v-if="songValidAndReady"
				:key="song ? song.id : 'song-sheet-active'"
				:song="song"
				type="session-view"
				class="elevation-3 rounded-lg"
			></song-sheet>

			<v-card
				v-else-if="playSession"
				:key="'placeholder'"
				class="mt-6 pa-6 pa-md-12 text-center elevation-1 rounded-lg"
				style="max-width:800px; margin-left: auto; margin-right: auto;"
				min-height="400px"
			>
				<v-row class="fill-height" align="center" justify="center">
					<v-col>
						<v-icon size="90" color="grey lighten-1" class="mb-5">
							{{ isOwner ? 'mdi-music-note-plus-outline' : 'mdi-timer-sand-empty' }}
						</v-icon>
						<h2 class="text-h5 font-weight-medium text--secondary mb-3">
							{{ isOwner ? "Select a Song to Share" : "Waiting for the Host" }}
						</h2>
						<p v-if="isOwner" class="text-body-1 text--disabled mx-auto" style="max-width: 450px;">
							Choose a song from your collection or browse public songs.
							It will instantly appear here for all participants.
						</p>
						<p v-else class="text-body-1 text--disabled mx-auto" style="max-width: 450px;">
							The session host ({{ sessionCreatorName || "..." }}) will select a song soon.
							<br>
							<span v-if="elapsedTime !== '00:00'">Session active for: {{ elapsedTime }}</span>
						</p>
						<v-progress-circular
							v-if="!isOwner && !songValid"
							indeterminate
							color="primary"
							size="32"
							class="mt-6"
						></v-progress-circular>
						<v-btn
							v-if="isOwner"
							color="primary"
							class="mt-6"
							@click="openSongList"
							rounded
							depressed
						>
							<v-icon left>mdi-playlist-music-outline</v-icon>
							Open My Song List
						</v-btn>
					</v-col>
				</v-row>
			</v-card>
			<!-- Fallback pokud playSession je null/undefined, ale showSessionPage bylo true (nemělo by se stát) -->
			<div v-else :key="'no-session-data'" class="text-center mt-10">
				<v-icon size="60" color="grey">mdi-alert-outline</v-icon>
				<p class="text-h6 text--secondary mt-4">Loading session data or session not found.</p>
			</div>
		</v-scroll-x-transition>

		<general-dialog
			v-model="stopSessionDialog"
			title="Confirm Stop Session"
			text="Are you sure you want to end this play session? This will disconnect all participants."
			acceptButton="Yes, Stop Session"
			@accept="executeStopSession"
		/>

		<v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" app bottom right>
			{{ snackbar.text }}
			<template v-slot:action="{ attrs }">
				<v-btn text v-bind="attrs" @click="snackbar.show = false">Close</v-btn>
			</template>
		</v-snackbar>
	</v-container>
</template>

<script>
import { mapGetters, mapActions, mapMutations, mapState } from "vuex";
import SongSheet from "../components/SongSheet.vue";
import GeneralDialog from "./Dialogs/GeneralDialog.vue";
import * as firebase from "firebase/app";
import 'firebase/database';


export default {
	components: {
		"song-sheet": SongSheet,
		GeneralDialog,
	},
	props: {
		sessionIdFromRoute: { // Přijímáme ID z PlaySession.vue
			type: String,
			default: null,
		}
	},
	data() {
		return {
			songTransitioning: false,
			elapsedTime: "00:00",
			intervalId: null,
			stoppingSession: false,
			stopSessionDialog: false,
			sessionCreatorName: null,
			snackbar: {
				show: false,
				text: "",
				color: "success"
			},
			isOnline: navigator.onLine,
			dbConnected: false,
			localSessionId: null, // Lokální ID pro sledování, ke které session jsme připojeni
		};
	},
	methods: {
		...mapActions(["stopPlaySession", "playSessionOn", "playSessionOff"]),
		...mapMutations(["setSongListOpened", "setPlaySession"]), // Přidáno setPlaySession

		confirmStopSession() {
			this.stopSessionDialog = true;
		},
		async initializeSession(sessionId) {
			if (this.localSessionId && this.localSessionId !== sessionId) {
				await this.playSessionOff(this.localSessionId);
				this.setPlaySession(null);
			}
			if (sessionId) {
				try {
					await this.playSessionOn(sessionId); // Připojí listener a aktualizuje Vuex store
					this.localSessionId = sessionId;
					// ULOŽENÍ DO LOCALSTORAGE PO ÚSPĚŠNÉM PŘIPOJENÍ
					localStorage.setItem('lastActiveSessionId', sessionId);
					console.log(`Session ${sessionId} saved to localStorage.`);
				} catch (error) {
					console.error(`Failed to initialize session ${sessionId}:`, error);
					this.showSnackbar("Could not connect to the session.", "error");
					this.setPlaySession(null);
					// Pokud se nepodaří připojit, můžeme zvážit smazání z localStorage,
					// aby se uživatel nepokoušel připojit k neplatné session.
					// localStorage.removeItem('lastActiveSessionId');
				}
			} else {
				if (this.localSessionId) {
					await this.playSessionOff(this.localSessionId);
				}
				this.localSessionId = null;
				this.setPlaySession(null);
				// Při opuštění session (např. když majitel ukončí) můžeme také smazat
				// localStorage.removeItem('lastActiveSessionId');
				// Ale je lepší to udělat explicitně při ukončení session majitelem.
			}
		},

		async executeStopSession() {
			this.stoppingSession = true;
			this.$emit("sessionStop");
			try {
				if (this.playSession && this.playSession.id) {
					const stoppedSessionId = this.playSession.id;
					await this.stopPlaySession(stoppedSessionId);
					// SMAZÁNÍ Z LOCALSTORAGE PO UKONČENÍ SESSION
					const lastSession = localStorage.getItem('lastActiveSessionId');
					if (lastSession === stoppedSessionId) {
						localStorage.removeItem('lastActiveSessionId');
						console.log(`Session ${stoppedSessionId} removed from localStorage after stopping.`);
					}
				}
			} catch (error) {
				console.error("Error stopping session:", error);
				this.showSnackbar("Failed to stop session.", "error");
			} finally {
				this.stoppingSession = false;
			}
		},
		updateElapsedTime() {
			if (this.playSession && this.playSession.createdAt) {
				try {
					const before = this.$moment(this.playSession.createdAt);
					const now = this.$moment();
					let diff = now.diff(before);
					if (diff < 0) diff = 0;

					const duration = this.$moment.duration(diff);
					const hours = String(duration.hours()).padStart(2, '0');
					const minutes = String(duration.minutes()).padStart(2, '0');
					const seconds = String(duration.seconds()).padStart(2, '0');
					
					this.elapsedTime = duration.asHours() >= 1 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
				} catch (e) {
					this.elapsedTime = "N/A";
				}
			} else {
				this.elapsedTime = "00:00";
			}
		},
		async fetchSessionCreatorName(creatorId) {
			if (creatorId) {
				try {
					const userSnapshot = await firebase.database().ref(`users/${creatorId}`).once('value');
					if (userSnapshot.exists() && userSnapshot.val().displayName) {
						this.sessionCreatorName = userSnapshot.val().displayName;
					} else {
						this.sessionCreatorName = "Host";
					}
				} catch (error) {
					console.error("Error fetching session creator name:", error);
					this.sessionCreatorName = "Host";
				}
			} else {
				this.sessionCreatorName = null;
			}
		},
		copySessionLink() {
			navigator.clipboard.writeText(this.sessionLink).then(() => {
				this.showSnackbar("Session link copied!", "success");
			}).catch(() => {
				this.showSnackbar("Failed to copy link.", "error");
			});
		},
		showSnackbar(text, color = "info") {
			this.snackbar.text = text;
			this.snackbar.color = color;
			this.snackbar.show = true;
		},
		openSongList() {
			this.setSongListOpened(true);
		},
		updateOnlineStatus() {
      this.isOnline = navigator.onLine;
    },
		checkDbConnection() {
      const connectedRef = firebase.database().ref(".info/connected");
      connectedRef.on("value", (snap) => {
        this.dbConnected = snap.val() === true;
      });
    },
	},
	computed: {
		...mapState({ // Používáme mapState pro přímý přístup k playSession ze store
			playSession: state => state.playSession,
		}),
		...mapGetters({
			user: "getUser",
			songListLoadingStore: "getSongListLoading",
		}),
		isOwner() {
			return this.playSession?.createdBy === this.user?.uid && !!this.user;
		},
		song() {
			return this.playSession?.currentSong;
		},
		songValid() {
			return this.song && Object.keys(this.song).length > 0 && this.song.title;
		},
		songValidAndReady() {
			return !this.songListLoadingStore && this.songValid && !this.songTransitioning;
		},
		connectionStatus() {
			if (!this.isOnline) {
				return { text: "Offline", icon: "mdi-wifi-off", color: "error" };
			}
			if (!this.dbConnected) {
				return { text: "Connecting...", icon: "mdi-lan-pending", color: "warning" };
			}
			return { text: "Live", icon: "mdi-broadcast", color: "success" };
		},
		sessionLink() {
			if (this.playSession && this.playSession.id) {
				return `${window.location.origin}/play-session/${this.playSession.id}`;
			}
			return "";
		}
	},
	watch: {
		sessionIdFromRoute: {
			handler(newId) {
				this.initializeSession(newId);
			},
			immediate: true, // Zavolá se hned při vytvoření komponenty
		},
		song: function(newSong, oldSong) {
			if (newSong?.id === oldSong?.id && newSong?.title === oldSong?.title) return;
			this.songTransitioning = true;
			this.$nextTick(() => {
				setTimeout(() => {
					this.songTransitioning = false;
				}, 150);
			});
		},
		'playSession.createdAt': { // Sledujeme změnu ve Vuex store
			handler(newVal) {
				if (newVal) this.updateElapsedTime();
				if (newVal && !this.intervalId) {
					this.intervalId = setInterval(this.updateElapsedTime, 1000);
				} else if (!newVal && this.intervalId) {
					clearInterval(this.intervalId);
					this.intervalId = null;
				}
			},
			immediate: true
		},
		'playSession.createdBy': { // Sledujeme změnu ve Vuex store
			handler(newCreatorId) {
				this.fetchSessionCreatorName(newCreatorId);
			},
			immediate: true,
		},
		'playSession.connected': function(newVal, oldVal) {
			if (this.isOwner && newVal !== undefined && oldVal !== undefined && this.playSession?.id) {
				if (newVal > oldVal) {
					// this.showSnackbar("A participant joined.", "info"); // Může být příliš rušivé
				}
			}
		}
	},
	created() {
		this.checkDbConnection();
    window.addEventListener('online', this.updateOnlineStatus);
    window.addEventListener('offline', this.updateOnlineStatus);
		// initializeSession se volá z watcheru na sessionIdFromRoute
	},
	beforeDestroy() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		if (this.localSessionId) { // Používáme localSessionId pro odpojení
			this.playSessionOff(this.localSessionId);
		}
		const connectedRef = firebase.database().ref(".info/connected");
    connectedRef.off();
    window.removeEventListener('online', this.updateOnlineStatus);
    window.removeEventListener('offline', this.updateOnlineStatus);
	},
};
</script>

<style lang="scss" scoped>
.session-info-card-guest {
	border-left: 3px solid var(--v-primary-lighten1);
}
.session-info-card-owner {
	border-left: 4px solid var(--v-primary-base);
}
.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px; // Nebo jiná vhodná šířka
	display: inline-block; // Aby max-width fungovalo
	vertical-align: middle; // Pro lepší zarovnání s ikonou
}
</style>