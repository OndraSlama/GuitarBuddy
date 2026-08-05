import { createStore } from "vuex";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";
import normalizeString from "../functions/normalizeText";

// Sorting and searching normalize strings with a regex, which is expensive
// inside comparators; cache the normalized keys per song object. Song objects
// keep a stable identity across incremental updates, so the WeakMap stays warm.
// Firebase compat .on() returns the registered callback; keep the handles so
// each subscription can be detached individually (several listeners can share
// a path, e.g. .info/connected).
const activeListeners = {};

// Presence for the currently joined play session. The participant key is
// re-created on every reconnect (.info/connected pattern), because a network
// drop triggers the server-side onDisconnect removal.
let sessionPresence = null;

function teardownSessionPresence() {
	if (!sessionPresence) return;
	sessionPresence.connectedRef.off("value", sessionPresence.connectedCallback);
	sessionPresence.participantRef.onDisconnect().cancel();
	sessionPresence.participantRef.remove();
	sessionPresence = null;
}

function teardownSessionListener() {
	teardownSessionPresence();
	if (activeListeners.sessionView && activeListeners.sessionViewRef) {
		activeListeners.sessionViewRef.off("value", activeListeners.sessionView);
	}
	activeListeners.sessionView = null;
	activeListeners.sessionViewRef = null;
	if (activeListeners.scrollView && activeListeners.scrollViewRef) {
		activeListeners.scrollViewRef.off("value", activeListeners.scrollView);
	}
	activeListeners.scrollView = null;
	activeListeners.scrollViewRef = null;
}

const songSortKeysCache = new WeakMap();
function songSortKeys(song) {
	let keys = songSortKeysCache.get(song);
	if (!keys) {
		keys = {
			title: normalizeString(song.title) ?? "",
			author: normalizeString(song.author) ?? "",
		};
		songSortKeysCache.set(song, keys);
	}
	return keys;
}

export default createStore({
	state: {
		currentPage: "",
		publicSongs: [],
		userSongBooks: {},
		playSession: undefined,
		activeSessionId: null,
		sessionScroll: null,
		notations: ["Standard (A B C D E F G)", "German (A H C D E F G)"],

		userSongs: [],
		authors: [],
		labels: [],
		loadedSong: null,
		user: null,
		songListOpened: false,
		deleteDialogOpened: false,
		songListLoading: false,
		songLoading: false,
		publicSongListLoading: false,
		showTooltips: false,
	},
	getters: {
		getCurrentPage: (state) => state.currentPage,
		getSongs: (state) => state.publicSongs,
		getSongListOpened: (state) => state.songListOpened,
		getLoadedSong: (state) => state.loadedSong,
		getCurrentSong: (state) => (id) => state.userSongs.find((el) => el.id === id),
		getPublicSong: (state) => (id) => state.publicSongs.find((el) => el.id === id),

		getFilteredUserSongs: (state, getters) => (filters) => {
			if (!getters.getUserLogged || state.userSongs === undefined) return [];
			return getters.getFilteredSongs(state.userSongs, filters);
		},

		getFilteredPublicSongs: (state, getters) => (filters) => {
			if (state.publicSongs === undefined) return [];
			return getters.getFilteredSongs(state.publicSongs, filters);
		},

		getUser: (state) => state.user,
		getUserSongs: (state) => state.userSongs,
		getUserSongBooks: (state) => state.userSongBooks,
		getPlaySession: (state) => state.playSession,
		getActiveSessionId: (state) => state.activeSessionId,
		getSessionScroll: (state) => state.sessionScroll,
		getNotations: (state) => state.notations,
		getAuthors: (state) => state.authors,
		getLabels: (state) => state.labels,
		getPublicSongs: (state) => state.publicSongs,
		getUserLogged: (state) => state.user !== null && state.user !== undefined,
		getSongListLoading: (state) => state.songListLoading,
		getSongLoading: (state) => state.songLoading,
		getPublicSongListLoading: (state) => state.publicSongListLoading,
		getShowTooltips: (state) => state.showTooltips,
		getDialogOpened: (state) => state.deleteDialogOpened,

		getFilteredSongs: (_, getters) => (songs, filters) => {
			const search = normalizeString(filters.search) ?? "";
			let filteredSongs = songs.filter((el) => {
				const keys = songSortKeys(el);
				return keys.title.includes(search) || keys.author.includes(search);
			});

			let groupsObject = {};

			let playbooks = getters.getUserSongBooks;
			if (filters.groupBy == 'songbook'){
				for (const key in playbooks) {
					groupsObject[key] = []
				}
			}

			filteredSongs.forEach((song) => {
				let groups = [];
				if (filters.groupBy == 'songbook'){
					for (const key in playbooks) {
						if (Object.prototype.hasOwnProperty.call(playbooks[key], song["id"])) {
							if (!groups.includes(key)){
								groups.push(key);							
							}
						}
					}
				}else if (filters.groupBy == 'author') {				
					groups = [song.author];		
				}else if (filters.groupBy == 'label') {
					if(!song.labels){
						groups = ["Unlabeled"]
					}else{
						groups = [...song.labels];		

					}
					
				} else {					
					if (song.favourite) {
						groups = ["Favourite", "Collection"];
					} else {
						groups = ["Collection"];
					}	
				}

				groups.forEach(group => {
					if (groupsObject[group] == undefined) {
						groupsObject[group] = [];
					}
					groupsObject[group].push(song);
				});
			});

			let groupsArray = [];
			for (let key in groupsObject) {
				groupsArray.push({ group: key, songs: groupsObject[key] });
			}

			for (let group of groupsArray) {
				group.songs.sort((a, b) => {
					const keysA = songSortKeys(a);
					const keysB = songSortKeys(b);
					if (filters.orderBy == "authorName") {
						return (filters.authorNameOrder ? keysA.author < keysB.author : keysA.author > keysB.author) ? 1 : -1;
					}
					if (filters.orderBy == "dateModified") {
						return (filters.modifiedDateOrder ? (a.modifiedAt ?? "") < (b.modifiedAt ?? "") : (a.modifiedAt ?? "") > (b.modifiedAt ?? "")) ? 1 : -1;
					}
					if (filters.orderBy == "dateCreated") {
						return (filters.createdDateOrder ? (a.createdAt ?? "") < (b.createdAt ?? "") : (a.createdAt ?? "") > (b.createdAt ?? "")) ? 1 : -1;
					}
					if (filters.orderBy == "lastViewed") {
						if ((a.lastViewed ?? "") !== (b.lastViewed ?? "")){
							return (filters.lastViewedOrder ? (a.lastViewed ?? "") < (b.lastViewed ?? "") : (a.lastViewed ?? "") > (b.lastViewed ?? "")) ? 1 : -1;
						}
					}
					if (filters.orderBy == "forks") {
						return (filters.forksOrder ? (a.forks ?? 0) > (b.forks ?? 0) : (a.forks ?? 0) < (b.forks ?? 0)) ? 1 : -1;
					}

					return (filters.titleNameOrder ? keysA.title < keysB.title : keysA.title > keysB.title) ? 1 : -1;
				});
			}
	
			groupsArray = groupsArray.sort((a, b) => {
				if (a.group === "Favourite") return -1;
				if (b.group === "Favourite") return 1;

				const groupNameOrder = filters.groupNameOrder ? normalizeString(a.group) < normalizeString(b.group) : normalizeString(a.group) > normalizeString(b.group);
				const groupSizeOrder =  filters.groupSizeOrder ? a.songs.length > b.songs.length : a.songs.length < b.songs.length;
				if (filters.orderGroupBy == "size"){
					return groupSizeOrder ? 1:-1;
				}else{	
					return groupNameOrder ? 1 : -1;
				}
			});		

			if (groupsArray.length == 1)
				groupsArray[0].songs = groupsArray[0].songs.slice(filters.firstRow ?? 0, filters.lastRow ?? groupsArray[0].songs.length)
			return groupsArray.slice(filters.firstRow ?? 0, filters.lastRow ?? groupsArray.length)			
		},
	},

	mutations: {
		setCurrentPage(state, value) {
			state.currentPage = value;
		},
		setShowTooltips(state, value) {
			state.showTooltips = value;
		},
		toggleShowTooltips(state) {
			state.showTooltips = !state.showTooltips;
		},
		setSongListLoading(state, value) {
			state.songListLoading = value;
		},
		setSongLoading(state, value) {
			state.songLoading = value;
		},
		setPublicSongListLoading(state, value) {
			state.publicSongListLoading = value;
		},
		loadSongs(state, songs) {
			state.publicSongs = songs;
		},
		setPublicSongs(state, songs) {
			state.publicSongs = songs;
		},
		deletePublicSong(state, id) {
			state.publicSongs.splice(
				state.publicSongs
					.map((song) => {
						return song.id;
					})
					.indexOf(id),
				1
			);
		},
		resetPublicSongs(state) {
			state.publicSongs = [];
		},
		setLoadedSong(state, song) {
			state.loadedSong = song;
		},

		setSongListOpened(state, value) {
			state.songListOpened = value;
		},
		toggleSongListOpened(state) {
			state.songListOpened = !state.songListOpened;
		},
		logout(state) {
			state.user = null;
			state.userSongs = [];
			state.userSongBooks = {};
			state.playSession = undefined;
			state.activeSessionId = null;
		},
		setUser(state, user) {
			// firebase compat User exposes its fields via prototype getters, so a
			// plain spread would drop them; copy the fields the app relies on
			state.user = {
				uid: user.uid,
				displayName: user.displayName,
				email: user.email,
				photoURL: user.photoURL,
				emailVerified: user.emailVerified,
				isAnonymous: user.isAnonymous,
			};
		},
		setUserSongs(state, userSongs) {
			state.userSongs = userSongs;
		},
		upsertUserSong(state, song) {
			const index = state.userSongs.findIndex((el) => el.id === song.id);
			if (index === -1) {
				state.userSongs.push(song);
			} else {
				state.userSongs.splice(index, 1, song);
			}
		},
		removeUserSong(state, id) {
			const index = state.userSongs.findIndex((el) => el.id === id);
			if (index !== -1) {
				state.userSongs.splice(index, 1);
			}
		},
		setUserSongBooks(state, userSongBooks){
			state.userSongBooks = {...userSongBooks}
		},
		setPlaySession(state, playSession){
			state.playSession = playSession
		},
		setActiveSessionId(state, id){
			state.activeSessionId = id
		},
		setSessionScroll(state, anchor){
			state.sessionScroll = anchor
		},
		setAuthors(state, authors){
			state.authors = authors
		},
		setLabels(state, labels){
			state.labels = labels
		},
		setDialogOpened(state, value) {
			state.deleteDialogOpened = value;
		},
	},
	actions: {
		loadPublicSongs({ commit }) {
			commit("setPublicSongListLoading", true);
			return new Promise((resolve) => {
				firebase
					.database()
					.ref("publicSongs")
					.once("value", (data) => {
						let publicSongs = [];
						let obj = data.val();
						for (let key in obj) {
							publicSongs.push({
								id: key,
								...obj[key],
							});
						}
						commit("setPublicSongs", publicSongs);
						commit("setPublicSongListLoading", false);
						resolve(publicSongs);
					});
				})
			},
			
		loadSong({ state, getters, commit, dispatch }, payload) {
			commit("setSongLoading", true);

			return new Promise((resolve, reject) => {
				let userSong = getters.getCurrentSong(payload)
				if (userSong) {
					resolve(userSong)
					commit("setSongLoading", false);
				}else{
					// Reuse the already-loaded catalog; a full re-download on every
					// song open added a serial round trip to each navigation.
					const catalogReady = state.publicSongs.length > 0 ? Promise.resolve() : dispatch("loadPublicSongs");
					catalogReady.then(() => {
						let publicSong = getters.getPublicSong(payload)
						if (!publicSong) {
							reject("Song not found")
							commit("setSongLoading", false);
							return
						}

						firebase
							.database()
							.ref("users/" + publicSong.createdBy + "/songs/" + publicSong.id)
							.once("value")
							.then((data) => {
								resolve({ ...data.val(), id: data.key });
							})
							.catch((e) => {
								reject(e);
							})
							.finally(() => {
								commit("setSongLoading", false);
							})
					})
				}

			});
		},

		

		loadAuthors({commit}){
			firebase
				.database()
				.ref("authors")
				.once("value")
				.then((data) => {
					let authors = [];
					for (var key of Object.keys(data.val())){
						authors.push(key);
					}					
					commit("setAuthors", authors);
				})
				.catch((e) => {
					console.log(e);
				});
		},

		loadLabels({commit}){
			firebase
				.database()
				.ref("labels")
				.once("value")
				.then((data) => {
					let labels = [];
					for (var key of Object.keys(data.val())){
						labels.push(key);
					}					
					commit("setLabels", labels);
				})
				.catch((e) => {
					console.log(e);
				});
		},

		// Songs sync per child instead of one listener on the whole user node:
		// with a single "value" listener, any write (e.g. updating lastViewed on
		// song open) re-downloaded the entire library including all lyrics.
		loadUserDataOn({ getters, commit }) {
			if (!getters.getUserLogged) return;

			commit("setSongListLoading", true);
			const userRef = firebase.database().ref("users/" + getters.getUser.uid);
			const songsRef = userRef.child("songs");

			songsRef.once("value", (data) => {
				if (!getters.getUserLogged) return;
				const obj = data.val() || {};
				let userSongs = [];
				for (let key in obj) {
					userSongs.push({
						id: key,
						...obj[key],
					});
				}
				commit("setUserSongs", userSongs);
				commit("setSongListLoading", false);

				// child_added replays existing children on attach; upsert makes it idempotent
				songsRef.on("child_added", (snap) => {
					if (getters.getUserLogged) commit("upsertUserSong", { id: snap.key, ...snap.val() });
				});
				songsRef.on("child_changed", (snap) => {
					if (getters.getUserLogged) commit("upsertUserSong", { id: snap.key, ...snap.val() });
				});
				songsRef.on("child_removed", (snap) => {
					if (getters.getUserLogged) commit("removeUserSong", snap.key);
				});
			});

			activeListeners.userPlayBooks = userRef.child("playBooks").on("value", (data) => {
				if (!getters.getUserLogged) return;
				let songbooks = data.val() || {};
				for (const key in songbooks) {
					for (const songid in songbooks[key]) {
						if (!songbooks[key][songid]){
							delete songbooks[key][songid]
						}
					}
				}
				commit("setUserSongBooks", {...songbooks});
			});

			activeListeners.userActiveSessionId = userRef.child("activeSessionId").on("value", (data) => {
				if (!getters.getUserLogged) return;
				commit("setActiveSessionId", data.val() || null);
			});
		},

		loadUserDataOff({ getters }) {
			if (getters.getUserLogged) {
				const userRef = firebase.database().ref("users/" + getters.getUser.uid);
				userRef.child("songs").off();
				if (activeListeners.userPlayBooks) {
					userRef.child("playBooks").off("value", activeListeners.userPlayBooks);
					activeListeners.userPlayBooks = null;
				}
				if (activeListeners.userActiveSessionId) {
					userRef.child("activeSessionId").off("value", activeListeners.userActiveSessionId);
					activeListeners.userActiveSessionId = null;
				}
			}
		},

		// The session document lives entirely under playSessions/<id>; the owner
		// only keeps a pointer at users/<uid>/activeSessionId. Ending a session
		// writes status: "ended" instead of deleting the node, so participants
		// get an unambiguous signal instead of a null snapshot.
		async startPlaySession({ getters }) {
			if (!getters.getUserLogged) throw new Error("User not logged in");
			const uid = getters.getUser.uid;
			const db = firebase.database();
			const pointerRef = db.ref("users/" + uid + "/activeSessionId");

			const existingId = (await pointerRef.once("value")).val();
			if (existingId) {
				const existing = (await db.ref("playSessions/" + existingId).once("value")).val();
				if (existing && existing.createdBy === uid && existing.status !== "ended") {
					return existingId;
				}
				await pointerRef.remove();
			}

			// leftover node from the pre-rework data model
			db.ref("users/" + uid + "/playSession").remove().catch(() => {});

			const sessionRef = db.ref("playSessions").push();
			await sessionRef.set({
				createdBy: uid,
				createdAt: firebase.database.ServerValue.TIMESTAMP,
				updatedAt: firebase.database.ServerValue.TIMESTAMP,
				status: "active",
			});
			await pointerRef.set(sessionRef.key);
			return sessionRef.key;
		},

		setSessionSong({ getters }, { sessionId, song }) {
			if (!getters.getUserLogged) return Promise.reject(new Error("User not logged in"));
			return firebase
				.database()
				.ref("playSessions/" + sessionId)
				.update({
					currentSong: song,
					updatedAt: firebase.database.ServerValue.TIMESTAMP,
				});
		},

		playSessionOn({ commit, getters }, sessionId) {
			return new Promise((resolve, reject) => {
				const sessionRef = firebase.database().ref("playSessions/" + sessionId);
				sessionRef
					.once("value")
					.then((snap) => {
						const session = snap.val();
						// nodes without status are leftovers from the pre-rework format
						if (!session || !session.createdBy || !session.status) {
							reject(new Error("Session not found"));
							return;
						}

						teardownSessionListener();

						let ended = session.status === "ended";
						activeListeners.sessionViewRef = sessionRef;
						activeListeners.sessionView = sessionRef.on("value", (data) => {
							const val = data.val();
							// a deleted node is treated the same as an ended session
							ended = !val || !val.createdBy || val.status === "ended";
							if (ended) teardownSessionPresence();
							commit("setPlaySession", val ? { id: sessionId, ...val } : { id: sessionId, status: "ended" });
						});

						// Scroll sync lives at a sibling path with its own listener so the
						// frequent scroll writes never re-commit the session document
						// (which would hand SongSheet a new song reference on every tick).
						activeListeners.scrollViewRef = firebase.database().ref("sessionScroll/" + sessionId);
						activeListeners.scrollView = activeListeners.scrollViewRef.on("value", (data) => {
							commit("setSessionScroll", data.val());
						});

						if (!ended) {
							const user = getters.getUser;
							const connectedRef = firebase.database().ref(".info/connected");
							const participantRef = sessionRef.child("participants").push();
							sessionPresence = { connectedRef, participantRef, connectedCallback: null };
							sessionPresence.connectedCallback = connectedRef.on("value", (s) => {
								if (s.val() !== true || ended) return;
								participantRef.onDisconnect().remove();
								participantRef.set({
									joinedAt: firebase.database.ServerValue.TIMESTAMP,
									uid: user?.uid ?? null,
									name: user?.displayName ?? null,
								});
							});
						}

						resolve({ id: sessionId, ...session });
					})
					.catch((e) => {
						console.log(e);
						reject(e);
					});
			});
		},

		playSessionOff({ commit }) {
			teardownSessionListener();
			commit("setPlaySession", undefined);
			commit("setSessionScroll", null);
			return Promise.resolve();
		},

		publishSessionScroll({ getters }, { sessionId, anchor }) {
			if (!getters.getUserLogged) return;
			firebase
				.database()
				.ref("sessionScroll/" + sessionId)
				.set(anchor)
				.catch((e) => {
					console.log(e);
				});
		},

		stopPlaySession({ getters }, sessionId) {
			if (!getters.getUserLogged) return Promise.reject(new Error("User not logged in"));
			const updates = {
				["playSessions/" + sessionId + "/status"]: "ended",
				["playSessions/" + sessionId + "/endedAt"]: firebase.database.ServerValue.TIMESTAMP,
				["playSessions/" + sessionId + "/currentSong"]: null,
				["users/" + getters.getUser.uid + "/activeSessionId"]: null,
			};
			// scroll cleanup stays outside the atomic update: it is best-effort
			// and must not be able to block the session from ending
			firebase.database().ref("sessionScroll/" + sessionId).remove().catch(() => {});
			return firebase.database().ref().update(updates);
		},

		clearActiveSessionPointer({ getters }) {
			if (!getters.getUserLogged) return Promise.resolve();
			return firebase
				.database()
				.ref("users/" + getters.getUser.uid + "/activeSessionId")
				.remove()
				.catch((e) => {
					console.log(e);
				});
		},

		addSong({ dispatch, getters }, payload) {
			return new Promise((resolve, reject) => {
				if (getters.getUserLogged) {
					dispatch("setAuthor", {name: payload.author});
					dispatch("setLabels", payload.labels);
					let newSong = {
						...payload,
						input: { ...payload.input },
						createdBy: getters.getUser.uid,
						createdAt: new Date().toISOString(),
						modifiedAt: new Date().toISOString(),
						forks: 0,
						public: payload.input.public,
						favourite: false,
					};

					firebase
						.database()
						.ref("users/" + getters.getUser.uid + "/songs/")
						.push(newSong)
						.then((data) => {
							if (newSong.public) {
								dispatch("setPublicSong", { id: data.key, data: { ...newSong } });
							}
							resolve(data.key);
						})
						.catch((e) => {
							console.log(e);
							reject();
						});
				} else {
					reject("User not logged in");
				}
			});
		},

		updateSong({ commit, dispatch, getters }, payload) {
			return new Promise((resolve, reject) => {
				commit("setSongListLoading", true);
				if (getters.getUserLogged) {
					dispatch("setAuthor", {name: payload.data.author});
					dispatch("setLabels", payload.data.labels);
					firebase
						.database()
						.ref("users/" + getters.getUser.uid + "/songs/" + payload.id)
						.update({
							...payload.data,
						})
						.then(() => {
							if (payload.data.createdBy === getters.getUser.uid) {
								if (payload.data.public) {
									dispatch("setPublicSong", payload);
								} else {
									dispatch("deletePublicSong", payload.id);
								}
							}
							commit("setSongListLoading", false);
							resolve();
						})
						.catch((e) => {
							console.log(e);
							commit("setSongListLoading", false);
							reject();
						});
				} else {
					commit("setSongListLoading", false);
					reject("User not logged in");
				}
			});
		},

		deleteSong({ dispatch, getters }, payload) {
			return new Promise((resolve, reject) => {
				if (getters.getUserLogged) {
					firebase
						.database()
						.ref("users/" + getters.getUser.uid + "/songs/" + payload)
						.remove()
						.then(() => {
							firebase
								.database()
								.ref("publicSongs/" + payload)
								.once("value")
								.then((data) => {
									let obj = data.val();

									if (obj !== null && obj.createdBy === getters.getUser.uid) {
										dispatch("deletePublicSong", payload);
									}
								});
							resolve();
						})
						.catch((e) => {
							console.log(e);
							reject()
						});
				} else {
					reject("User not logged in");
				}
			});
		},
		
		setPublicSong({ getters }, payload) {
			if (getters.getUserLogged) {
				firebase
					.database()
					.ref("publicSongs/" + payload.id)
					.update({
						title: payload.data.title,
						author: payload.data.author,
						labels: payload.data.labels,
						createdBy: getters.getUser.uid,
						modifiedAt: payload.data.modifiedAt,
						createdAt: payload.data.createdAt,
						forks: payload.data.forks ?? 0,
					})
					.catch((e) => {
						console.log(e);
					});
			}
		},

		deletePublicSong({ commit, getters }, payload) {
			if (getters.getUserLogged) {
				firebase
					.database()
					.ref("publicSongs/" + payload)
					.remove()
					.then(() => {
						commit("deletePublicSong", payload);
					})
					.catch((e) => {
						console.log(e);
					});
			}
		},

		
		savePublicSongToUser({ getters, dispatch }, payload) {
			if (getters.getUserLogged) {
				firebase
					.database()
					.ref("users/" + payload.createdBy + "/songs/" + payload.id)
					.once("value")
					.then((data) => {
						let songToSave = { ...data.val(), favourite: false };
						songToSave.input.public = false;
						firebase
							.database()
							.ref("users/" + getters.getUser.uid + "/songs/" + payload.id)
							.set(songToSave);
					})
					.then(() => {
						dispatch("incrementForksInPublicSong", { ...payload });
					})
					.catch((e) => {
						console.log(e);
					});
			}
		},

		setFavourite({ getters }, payload) {
			if (getters.getUserLogged) {
				firebase
					.database()
					.ref("users/" + getters.getUser.uid + "/songs/" + payload.id)
					.update({ favourite: payload.value });
			}
		},

		updateLastViewed({ getters }, payload){
			if (getters.getUserLogged) {
				firebase
					.database()
					.ref("users/" + getters.getUser.uid + "/songs/" + payload)
					.update({ lastViewed: new Date().toISOString() });
			}
		},

		addSongBook( {getters }, payload){
			if (getters.getUserLogged) {
				const initialSongId = getters.getUserSongs.length > 0 ? getters.getUserSongs[0].id : "placeholder_song_id_for_empty_songbook";
				const updateData = getters.getUserSongs.length > 0 ? { [initialSongId]: false } : { "placeholder": true };
				firebase
					.database()
					.ref("users/" + getters.getUser.uid + "/playBooks/" + payload)
					.update(updateData)
					.catch((e) => {
						console.log(e);
					});						
			}
		},

		changeSongBookName( {getters }, payload){
			if (getters.getUserLogged) {
				let songBooks = firebase.database().ref("users/" + getters.getUser.uid + "/playBooks/");

				songBooks.child(payload.old).once('value').then((snap) => {
				var data = snap.val();
				var update = {};
				update[payload.old] = null;
				update[payload.new] = data;
				return songBooks.update(update);
				}).catch((e) => {
					console.log(e);
				}); 
			}
		},
		
		deleteSongBook( {getters }, payload){
			if (getters.getUserLogged) {					 
				firebase
					.database()
					.ref("users/" + getters.getUser.uid + "/playBooks/" + payload)
					.remove()
					.catch((e) => {
						console.log(e);
					});						
			}
		},
		
		addSongToSongbook({ getters }, payload) {
			if (getters.getUserLogged) {
				const updateData = { [payload.id]: true };
				const songbookRef = firebase.database().ref("users/" + getters.getUser.uid + "/playBooks/" + payload.songbook);
				
				songbookRef.child("placeholder").remove(); 
				songbookRef
					.update(updateData)
					.catch((e) => {
						console.log(e);
					});						
			}
		},
		
		removeSongFromSongbook({ getters }, payload) {
			if (getters.getUserLogged) {
				firebase
					.database()
					.ref("users/" + getters.getUser.uid + "/playBooks/" + payload.songbook)
					.update({ [payload.id]: false }) 
					.catch((e) => {
						console.log(e);
					});						
			}
		},


		setAuthor(_, payload){
			if (payload.name && payload.name.trim() !== "") {
				firebase
					.database()
					.ref("authors")
					.update({[payload.name]: true})
					.catch((e) => {
						console.log(e);
					});
			}
		},

		setLabels(_, payload){
			if (payload && payload.length > 0) {
				let labels = {};
				payload.forEach((label) => {
					if (label && label.trim() !== "") {
						labels[label] = true;
					}
				})
				if (Object.keys(labels).length > 0) {
					firebase
						.database()
						.ref("labels")
						.update(labels)
						.catch((e) => {
							console.log(e);
						});
				}
			}
		},


		incrementForksInPublicSong(_, payload) {
			firebase
				.database()
				.ref("publicSongs/" + payload.id)
				.update({
					forks: (payload.forks ?? -1) + 1,
				})
				.catch((e) => {
					console.log(e);
				});
		},
        registerUserWithEmailAndPassword(_, payload) {
            return new Promise((resolve, reject) => {
                firebase.auth().createUserWithEmailAndPassword(payload.email, payload.password)
                    .then(userCredential => {
                        console.log("User registered successfully:", userCredential.user);
                        resolve(userCredential.user);
                    })
                    .catch(error => {
                        console.error("Error registering user:", error);
                        reject(error);
                    });
            });
        },

        loginUserWithEmailAndPassword(_, payload) {
            return new Promise((resolve, reject) => {
                firebase.auth().signInWithEmailAndPassword(payload.email, payload.password)
                    .then(userCredential => {
                        console.log("User logged in successfully:", userCredential.user);
                        resolve(userCredential.user);
                    })
                    .catch(error => {
                        console.error("Error logging in user:", error);
                        reject(error);
                    });
            });
        },
		logout({commit, dispatch}) {
            return new Promise((resolve, reject) => {
                firebase
                    .auth()
                    .signOut()
                    .then(() => {
                        dispatch("loadUserDataOff");
                        commit("logout");
                        localStorage.removeItem('lastActiveSessionId');
                        console.log('lastActiveSessionId removed from localStorage on logout.');
                        resolve();
                    })
                    .catch((err) => {
                        reject(err);
                    });
            });
        },

		setUserStatusChange({ commit, dispatch }) {
            return new Promise((resolve) => {
                firebase.auth().onAuthStateChanged((user) => {
                    if (user) {
                        commit("setUser", user);
                        dispatch("loadUserDataOn");
                        resolve(user);
                    } else {
                        dispatch("loadUserDataOff");
                        commit("logout");
						resolve(null);
                    }
                });
            });
        },
	},
	modules: {},
});