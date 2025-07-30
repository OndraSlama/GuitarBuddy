<template>
	<v-container fluid class="pa-0 ma-0" style="min-height: 100vh">
		<!-- Kompaktní Session Info Banner -->
		<v-card v-if="playSession" class="mb-5 elevation-2 rounded-lg session-banner">
			<v-toolbar flat dense color="transparent" height="48px">
				<!-- Levá strana: Status a Info -->
				<v-chip small :color="connectionStatus.color" dark class="font-weight-bold mr-3 ml-n1" label>
					<v-icon left small class="mr-1">{{ connectionStatus.icon }}</v-icon>
					{{ connectionStatus.text }}
				</v-chip>

				<v-spacer v-if="!isOwner"></v-spacer>

				<!-- Střed/Pravá strana pro Majitele -->
				<template v-if="isOwner">
					<v-icon small color="primary" class="mr-1">mdi-crown-outline</v-icon>
					<span class="text-subtitle-2 font-weight-medium primary--text mr-3">My Session</span>
					<v-spacer></v-spacer>
				</template>
                
				<!-- Pravá strana: Čas a Účastníci (pro oba) -->
                <v-tooltip top>
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn icon small @click="shareDialogOpened = true" v-bind="attrs" v-on="on" class="mr-1">
                            <v-icon color="primary">mdi-share-variant-outline</v-icon>
                        </v-btn>
                    </template>
                    <span>Share Session</span>
                </v-tooltip>
				<div class="d-flex align-center text-caption text--secondary ml-auto">
					<v-icon small class="mr-1">mdi-clock-outline</v-icon>
					<span class="mr-3">{{ elapsedTime }}</span>
					<v-icon small class="mr-1">mdi-account-multiple-outline</v-icon>
					<span>{{ playSession.connected }}</span>
				</div>

				<!-- Tlačítko Stop pro Majitele (pokud je místo, jinak do menu) -->
				<v-tooltip top v-if="isOwner">
					<template v-slot:activator="{ on, attrs }">
						<v-btn icon small @click="confirmStopSession" :loading="stoppingSession" v-bind="attrs" v-on="on" color="error" class="ml-2">
							<v-icon>mdi-stop-circle-outline</v-icon>
						</v-btn>
					</template>
					<span>Stop Session</span>
				</v-tooltip>

				<!-- Tlačítko Leave pro Účastníky -->
				<v-tooltip top v-else>
					<template v-slot:activator="{ on, attrs }">
						<v-btn icon small @click="confirmLeaveSession" :loading="leavingSession" v-bind="attrs" v-on="on" color="orange" class="ml-2">
							<v-icon>mdi-exit-to-app</v-icon>
						</v-btn>
					</template>
					<span>Leave Session</span>
				</v-tooltip>
			</v-toolbar>
		</v-card>

		<!-- Song Display or Placeholder (beze změny) -->
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
							Choose a song from your collection or browse public songs and click on "To Session" button.
							It will instantly appear here for all participants.
						</p>
						<p v-else class="text-body-1 text--disabled mx-auto" style="max-width: 450px;">
							The session host will select a song soon.
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
			<div v-else :key="'no-session-data'" class="text-center mt-10">
				<v-icon size="60" color="grey">mdi-alert-outline</v-icon>
				<p class="text-h6 text--secondary mt-4">Loading session data or session not found.</p>
			</div>
		</v-scroll-x-transition>

		<!-- Dialogy -->
		<general-dialog
			v-model="stopSessionDialog"
			title="Confirm Stop Session"
			text="Are you sure you want to end this play session? This will disconnect all participants."
			acceptButton="Yes, Stop Session"
			@accept="executeStopSession"
		/>
		<general-dialog
			v-model="leaveSessionDialog"
			title="Confirm Leave Session"
			text="Are you sure you want to leave this play session?"
			acceptButton="Yes, Leave Session"
			@accept="executeLeaveSession"
		/>
		<share-session-dialog
			v-if="playSession"
			v-model="shareDialogOpened"
			:session-link="sessionLink"
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
// ShareSessionDialog bude buď globální nebo importován zde
// import ShareSessionDialog from "./Dialogs/ShareSessionDialog.vue";
import * as firebase from "firebase/app";
import 'firebase/database';

export default {
	components: {
		"song-sheet": SongSheet,
		GeneralDialog,
		// ShareSessionDialog, // Pokud není globální
	},
	props: {
		sessionIdFromRoute: {
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
			leavingSession: false,
			leaveSessionDialog: false,
			snackbar: {
				show: false,
				text: "",
				color: "success"
			},
			isOnline: navigator.onLine,
			dbConnected: false,
			localSessionId: null,
            shareDialogOpened: false,
		};
	},
	methods: {
		...mapActions(["stopPlaySession", "playSessionOn", "playSessionOff"]),
		...mapMutations(["setSongListOpened", "setPlaySession"]), // Přidáno setPlaySession

		confirmStopSession() {
			this.stopSessionDialog = true;
		},
		confirmLeaveSession() {
			this.leaveSessionDialog = true;
		},
		async initializeSession(sessionId) {
			// Prevent re-initialization if we're already connected to the same session
			if (this.localSessionId === sessionId && this.playSession?.id === sessionId) {
				console.log(`Already connected to session ${sessionId}, skipping initialization`);
				return;
			}

			if (this.localSessionId && this.localSessionId !== sessionId) {
				await this.playSessionOff(this.localSessionId);
				this.setPlaySession(null);
			}
			if (sessionId) {
				try {
					await this.playSessionOn(sessionId); // Připojí listener a aktualizuje Vuex store
					this.localSessionId = sessionId;
					localStorage.setItem('lastActiveSessionId', sessionId);
					console.log(`Session ${sessionId} saved to localStorage.`);
				} catch (error) {
					console.error(`Failed to initialize session ${sessionId}:`, error);
					this.showSnackbar("Could not connect to the session.", "error");
					this.setPlaySession(null);
					localStorage.removeItem('lastActiveSessionId');
				}
			} else {
				if (this.localSessionId) {
					await this.playSessionOff(this.localSessionId);
				}
				this.localSessionId = null;
				this.setPlaySession(null);
				localStorage.removeItem('lastActiveSessionId');
			}
		},

		async executeStopSession() {
			this.stoppingSession = true;
			this.$emit("sessionStop");
			try {
				if (this.playSession && this.playSession.id) {
					const stoppedSessionId = this.playSession.id;
					await this.stopPlaySession(stoppedSessionId);
					const lastSession = localStorage.getItem('lastActiveSessionId');
					if (lastSession === stoppedSessionId) {
						localStorage.removeItem('lastActiveSessionId');
						console.log(`Session ${stoppedSessionId} removed from localStorage after stopping.`);
					}
				}
				// Redirect to /play-session after session is stopped
				this.$router.push('/play-session');
			} catch (error) {
				console.error("Error stopping session:", error);
				this.showSnackbar("Failed to stop session.", "error");
			} finally {
				this.stoppingSession = false;
			}
		},
		async executeLeaveSession() {
			this.leavingSession = true;
			this.leaveSessionDialog = false; // Close the dialog
			try {
				if (this.localSessionId) {
					// Disconnect from the session
					await this.playSessionOff(this.localSessionId);
					
					// Remove session from localStorage
					const lastSession = localStorage.getItem('lastActiveSessionId');
					if (lastSession === this.localSessionId) {
						localStorage.removeItem('lastActiveSessionId');
						console.log(`Session ${this.localSessionId} removed from localStorage after leaving.`);
					}
					
					// Clear local session state
					this.localSessionId = null;
					
					this.showSnackbar("Successfully left the session.", "success");
					
					// Redirect to /play-session
					this.$router.push('/play-session');
				} else {
					// If no localSessionId, just clear everything and redirect
					this.setPlaySession(null);
					localStorage.removeItem('lastActiveSessionId');
					this.$router.push('/play-session');
				}
			} catch (error) {
				console.error("Error leaving session:", error);
				this.showSnackbar("Failed to leave session.", "error");
				
				// Even if there's an error, try to clean up local state
				this.setPlaySession(null);
				this.localSessionId = null;
				localStorage.removeItem('lastActiveSessionId');
				
				// Still redirect to play-session page
				this.$router.push('/play-session');
			} finally {
				this.leavingSession = false;
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
		...mapState({
			playSession: state => state.playSession,
		}),
		...mapGetters({
			user: "getUser",
			songListLoadingStore: "getSongListLoading",
			viewportSize: "getViewportSize",
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
.session-banner .v-toolbar__content {
  padding-left: 8px;
  padding-right: 8px;
}

.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px; /* Upravte podle potřeby pro jméno hosta */
  display: inline-block;
  vertical-align: bottom; /* Lepší zarovnání s ikonou a textem */
}
</style>