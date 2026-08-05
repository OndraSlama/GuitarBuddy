<template>
	<v-container fluid class="pa-0 ma-0" style="min-height: 100vh">
		<!-- Joining -->
		<div v-if="sessionState === 'loading'" class="d-flex justify-center align-center" style="min-height: 60vh">
			<v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
		</div>

		<!-- Invalid link -->
		<div v-else-if="sessionState === 'invalid'" class="d-flex flex-column justify-center align-center text-center pa-4" style="min-height: 60vh">
			<v-icon size="80" color="warning" class="mb-4">mdi-link-off</v-icon>
			<h2 class="text-h5 mb-2">Session Not Found</h2>
			<p class="text-body-1 text-medium-emphasis">The session link you used is not valid.</p>
			<v-btn color="primary" :to="exitTarget" class="mt-4" rounded variant="flat">
				{{ userLogged ? "Go to Play Sessions" : "Go Home" }}
			</v-btn>
		</div>

		<!-- Ended by host -->
		<div v-else-if="sessionState === 'ended'" class="d-flex flex-column justify-center align-center text-center pa-4" style="min-height: 60vh">
			<v-icon size="80" color="grey" class="mb-4">mdi-flag-checkered</v-icon>
			<h2 class="text-h5 mb-2">Session Ended</h2>
			<p class="text-body-1 text-medium-emphasis">The host has ended this play session. Thanks for jamming!</p>
			<v-btn color="primary" :to="exitTarget" class="mt-4" rounded variant="flat">
				{{ userLogged ? "Go to Play Sessions" : "Go Home" }}
			</v-btn>
		</div>

		<!-- Active session -->
		<template v-else-if="playSession">
			<v-card class="mb-5 elevation-2 rounded-lg session-banner">
				<v-toolbar flat density="compact" color="transparent" height="48">
					<v-chip size="small" :color="connectionStatus.color" class="font-weight-bold mr-3 ml-2" label>
						<v-icon start size="small" class="mr-1">{{ connectionStatus.icon }}</v-icon>
						{{ connectionStatus.text }}
					</v-chip>

					<v-spacer v-if="!isOwner"></v-spacer>

					<template v-if="isOwner">
						<v-icon size="small" color="primary" class="mr-1">mdi-crown-outline</v-icon>
						<span class="text-subtitle-2 font-weight-medium text-primary mr-3">My Session</span>
						<v-spacer></v-spacer>
					</template>

					<v-tooltip location="top">
						<template v-slot:activator="{ props: tooltipProps }">
							<v-btn icon size="small" variant="text" @click="shareDialogOpened = true" v-bind="tooltipProps" class="mr-1">
								<v-icon color="primary">mdi-share-variant-outline</v-icon>
							</v-btn>
						</template>
						<span>Share Session</span>
					</v-tooltip>
					<div class="d-flex align-center text-caption text-medium-emphasis ml-auto">
						<v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
						<span class="mr-3">{{ elapsedTime }}</span>
						<v-icon size="small" class="mr-1">mdi-account-multiple-outline</v-icon>
						<span>{{ participantCount }}</span>
					</div>

					<v-tooltip location="top" v-if="isOwner">
						<template v-slot:activator="{ props: tooltipProps }">
							<v-btn icon size="small" variant="text" @click="stopSessionDialog = true" :loading="stoppingSession" v-bind="tooltipProps" color="error" class="ml-2">
								<v-icon>mdi-stop-circle-outline</v-icon>
							</v-btn>
						</template>
						<span>Stop Session</span>
					</v-tooltip>

					<v-tooltip location="top" v-else>
						<template v-slot:activator="{ props: tooltipProps }">
							<v-btn icon size="small" variant="text" @click="leaveSessionDialog = true" :loading="leavingSession" v-bind="tooltipProps" color="orange" class="ml-2">
								<v-icon>mdi-exit-to-app</v-icon>
							</v-btn>
						</template>
						<span>Leave Session</span>
					</v-tooltip>
				</v-toolbar>
			</v-card>

			<v-scroll-x-transition mode="out-in">
				<song-sheet
					v-if="songValidAndReady"
					:key="song ? song.id : 'song-sheet-active'"
					:song="song"
					type="session-view"
					class="elevation-3 rounded-lg"
				></song-sheet>

				<v-card
					v-else
					:key="'placeholder'"
					class="mt-6 pa-6 pa-md-12 text-center elevation-1 rounded-lg"
					style="max-width:800px; margin-left: auto; margin-right: auto;"
					min-height="400px"
				>
					<v-row class="fill-height" align="center" justify="center">
						<v-col>
							<v-icon size="90" color="grey-lighten-1" class="mb-5">
								{{ isOwner ? 'mdi-music-note-plus-outline' : 'mdi-timer-sand-empty' }}
							</v-icon>
							<h2 class="text-h5 font-weight-medium text-medium-emphasis mb-3">
								{{ isOwner ? "Select a Song to Share" : "Waiting for the Host" }}
							</h2>
							<p v-if="isOwner" class="text-body-1 text-disabled mx-auto" style="max-width: 450px;">
								Choose a song from your collection or browse public songs and click on "To Session" button.
								It will instantly appear here for all participants.
							</p>
							<p v-else class="text-body-1 text-disabled mx-auto" style="max-width: 450px;">
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
								variant="flat"
							>
								<v-icon start>mdi-playlist-music-outline</v-icon>
								Open My Song List
							</v-btn>
						</v-col>
					</v-row>
				</v-card>
			</v-scroll-x-transition>
		</template>

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

		<v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="bottom right">
			{{ snackbar.text }}
			<template v-slot:actions>
				<v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
			</template>
		</v-snackbar>
	</v-container>
</template>

<script>
import { mapGetters, mapActions, mapMutations, mapState } from "vuex";
import SongSheet from "../components/SongSheet.vue";
import GeneralDialog from "./Dialogs/GeneralDialog.vue";
import firebase from "firebase/compat/app";
import "firebase/compat/database";

export default {
	components: {
		"song-sheet": SongSheet,
		GeneralDialog,
	},
	props: {
		sessionId: {
			type: String,
			required: true,
		},
	},
	data() {
		return {
			sessionState: "loading",
			joinedSessionId: null,
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
				color: "success",
			},
			isOnline: navigator.onLine,
			dbConnected: false,
			shareDialogOpened: false,
			connectedRef: null,
			connectedCallback: null,
		};
	},
	methods: {
		...mapActions(["stopPlaySession", "playSessionOn", "playSessionOff", "clearActiveSessionPointer"]),
		...mapMutations(["setSongListOpened"]),

		async initializeSession(sessionId) {
			if (this.joinedSessionId === sessionId && this.playSession?.id === sessionId) return;

			this.sessionState = "loading";
			if (this.joinedSessionId && this.joinedSessionId !== sessionId) {
				await this.playSessionOff();
				this.joinedSessionId = null;
			}

			try {
				const session = await this.playSessionOn(sessionId);
				this.joinedSessionId = sessionId;
				if (session.status === "ended") {
					this.sessionState = "ended";
					this.forgetStoredSession(sessionId);
				} else {
					this.sessionState = "active";
					localStorage.setItem("lastActiveSessionId", sessionId);
				}
			} catch (error) {
				console.error(`Failed to join session ${sessionId}:`, error);
				this.sessionState = "invalid";
				this.forgetStoredSession(sessionId);
				// a stale owner pointer to a missing session would redirect here forever
				if (this.activeSessionId === sessionId) {
					this.clearActiveSessionPointer();
				}
			}
		},

		forgetStoredSession(sessionId) {
			if (localStorage.getItem("lastActiveSessionId") === sessionId) {
				localStorage.removeItem("lastActiveSessionId");
			}
		},

		async executeStopSession() {
			this.stoppingSession = true;
			try {
				await this.stopPlaySession(this.sessionId);
				this.forgetStoredSession(this.sessionId);
				this.$router.push("/play-session");
			} catch (error) {
				console.error("Error stopping session:", error);
				this.showSnackbar("Failed to stop session.", "error");
			} finally {
				this.stoppingSession = false;
			}
		},

		async executeLeaveSession() {
			this.leavingSession = true;
			this.leaveSessionDialog = false;
			try {
				await this.playSessionOff();
				this.joinedSessionId = null;
				this.forgetStoredSession(this.sessionId);
				this.$router.push(this.exitTarget);
			} catch (error) {
				console.error("Error leaving session:", error);
				this.forgetStoredSession(this.sessionId);
				this.$router.push(this.exitTarget);
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
					const hours = String(duration.hours()).padStart(2, "0");
					const minutes = String(duration.minutes()).padStart(2, "0");
					const seconds = String(duration.seconds()).padStart(2, "0");

					this.elapsedTime = duration.asHours() >= 1 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
				} catch (e) {
					this.elapsedTime = "N/A";
				}
			} else {
				this.elapsedTime = "00:00";
			}
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
			this.connectedRef = firebase.database().ref(".info/connected");
			this.connectedCallback = this.connectedRef.on("value", (snap) => {
				this.dbConnected = snap.val() === true;
			});
		},
	},
	computed: {
		...mapState({
			playSession: (state) => state.playSession,
		}),
		...mapGetters({
			user: "getUser",
			userLogged: "getUserLogged",
			activeSessionId: "getActiveSessionId",
			songListLoadingStore: "getSongListLoading",
		}),
		isOwner() {
			return !!this.user && this.playSession?.createdBy === this.user.uid;
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
		participantCount() {
			return this.playSession?.participants ? Object.keys(this.playSession.participants).length : 0;
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
			return `${window.location.origin}/play-session/${this.sessionId}`;
		},
		exitTarget() {
			return this.userLogged ? "/play-session" : "/";
		},
	},
	watch: {
		sessionId: {
			handler(newId) {
				this.initializeSession(newId);
			},
			immediate: true,
		},
		"playSession.status": function (status) {
			if (status === "ended" && this.sessionState === "active") {
				this.sessionState = "ended";
				this.forgetStoredSession(this.sessionId);
			}
		},
		song: function (newSong, oldSong) {
			if (newSong?.id === oldSong?.id && newSong?.title === oldSong?.title) return;
			this.songTransitioning = true;
			this.$nextTick(() => {
				setTimeout(() => {
					this.songTransitioning = false;
				}, 150);
			});
		},
		"playSession.createdAt": {
			handler(newVal) {
				if (newVal) this.updateElapsedTime();
				if (newVal && !this.intervalId) {
					this.intervalId = setInterval(this.updateElapsedTime, 1000);
				} else if (!newVal && this.intervalId) {
					clearInterval(this.intervalId);
					this.intervalId = null;
				}
			},
			immediate: true,
		},
	},
	created() {
		this.checkDbConnection();
		window.addEventListener("online", this.updateOnlineStatus);
		window.addEventListener("offline", this.updateOnlineStatus);
	},
	beforeUnmount() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		this.playSessionOff();
		if (this.connectedRef && this.connectedCallback) {
			this.connectedRef.off("value", this.connectedCallback);
		}
		window.removeEventListener("online", this.updateOnlineStatus);
		window.removeEventListener("offline", this.updateOnlineStatus);
	},
};
</script>

<style lang="scss" scoped>
.session-banner :deep(.v-toolbar__content) {
	padding-left: 8px;
	padding-right: 8px;
}
</style>
