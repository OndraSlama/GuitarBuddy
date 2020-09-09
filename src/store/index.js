import Vue from "vue";
import Vuex from "vuex";
import * as firebase from "firebase";

Vue.use(Vuex);

export default new Vuex.Store({
	state: {
		browseSongs: [],
		userSongs: [],
		loadedSong: null,
		user: null,
		songListOpened: false,
		deleteDialogOpened: false,
		songListLoading: false,
		showTooltips: false,
	},
	getters: {
		getSongs: (state) => state.browseSongs,
		getSongListOpened: (state) => state.songListOpened,
		getLoadedSong: (state) => state.loadedSong,

		getFilteredUserSongs: (state, getters) => ({ search }) => {
			let normalizeString = (string) => {
				return string
					.normalize("NFD")
					.replace(/[\u0300-\u036f]/g, "")
					.toLowerCase();
			};

			if (!getters.getUserLogged || state.userSongs === undefined) return [];

			return state.userSongs.filter((el) => {
				const titleMatch = normalizeString(el.title).includes(normalizeString(search));
				const authorMatch = normalizeString(el.author).includes(normalizeString(search));

				return titleMatch || authorMatch;
			});
		},
		getUser: (state) => state.user,
		getUserSongs: (state) => state.userSongs,
		getUserLogged: (state) => state.user !== null && state.user !== undefined,
		getSongListLoading: (state) => state.songListLoading,
		getShowTooltips: (state) => state.showTooltips,
		getDialogOpened: (state) => state.deleteDialogOpened,
	},
	mutations: {
		setShowTooltips(state, value) {
			state.showTooltips = value;
		},
		toggleShowTooltips(state) {
			state.showTooltips = !state.showTooltips;
		},
		setSongListLoading(state, value) {
			state.songListLoading = value;
		},
		loadSongs(state, songs) {
			state.browseSongs = songs;
		},

		setLoadedSong(state, song) {
			state.loadedSong = song;
		},
		// addSong(state, song) {
		// 	state.browseSongs.push(song);
		// },
		// updateSong(state, payload) {
		// 	let song = state.browseSongs.find((el) => el.id === payload.id);
		// 	Vue.set(state.browseSongs, state.browseSongs.indexOf(song), { ...payload.data });
		// },
		// deleteSong(state, id) {
		// 	state.browseSongs.splice(
		// 		state.browseSongs
		// 			.map((song) => {
		// 				return song.id;
		// 			})
		// 			.indexOf(id),
		// 		1
		// 	);
		// },
		setSongListOpened(state, value) {
			state.songListOpened = value;
		},
		toggleSongListOpened(state) {
			state.songListOpened = !state.songListOpened;
		},
		logout(state) {
			state.user = null;
		},
		setUser(state, user) {
			state.user = {
				...user,
			};
		},
		setUserData(state, userSongs) {
			state.userSongs = userSongs;
		},
		setDialogOpened(state, value) {
			state.deleteDialogOpened = value;
		},
	},
	actions: {
		// onSongsChange({ commit, dispatch, getters }) {
		// 	if (getters.getUserLogged) {
		// 		commit("setSongListLoading", true);
		// 		firebase
		// 			.database()
		// 			.ref("songs")
		// 			.on("value", (data) => {
		// 				console.log("on songs change");
		// 				dispatch("parseSongs", data);
		// 			});
		// 	}
		// },

		// offSongsChange() {
		// 	firebase
		// 		.database()
		// 		.ref("songs")
		// 		.off("value");
		// },

		loadSong({ commit }, payload) {
			commit("setLoadedSong", null);
			firebase
				.database()
				.ref("songs/" + payload)
				.once("value")
				.then((data) => {
					commit("setLoadedSong", data.val());
				})
				.catch((e) => {
					console.log(e);
				});
		},

		onUserDataChange({ dispatch, getters }) {
			if (getters.getUserLogged) {
				firebase
					.database()
					.ref("users/" + getters.getUser.uid + "/songs")
					.on("value", (data) => {
						console.log("on user data change");
						dispatch("parseUserData", data);
						// dispatch("loadSongsOnce");
					});
			}
		},

		offUserDataChange({ getters }) {
			if (getters.getUserLogged) {
				firebase
					.database()
					.ref("users/" + getters.getUser.uid + "/songs")
					.off("value");
			}
		},

		// loadSongsOnce({ dispatch }) {
		// 	firebase
		// 		.database()
		// 		.ref("songs")
		// 		.once("value")
		// 		.then((data) => {
		// 			dispatch("parseSongs", data);
		// 		});
		// },

		// parseSongs({ commit, getters }, payload) {
		// 	if (getters.getUserLogged) {
		// 		let songs = [];
		// 		const obj = payload.val();
		// 		for (let key in obj) {
		// 			songs.push({
		// 				id: key,
		// 				...obj[key],
		// 			});
		// 		}
		// 		commit("loadSongs", songs);
		// 		commit("setSongListLoading", false);
		// 	}
		// },

		parseUserData({ commit, getters }, payload) {
			if (getters.getUserLogged) {
				let userSongs = [];
				const obj = payload.val();
				for (let key in obj) {
					userSongs.push({
						id: key,
						...obj[key],
					});
				}
				commit("setUserData", userSongs);
			}
		},

		updateSong({ commit, dispatch, getters }, payload) {
			// commit("setSongListLoading", true);
			if (getters.getUserLogged) {
				firebase
					.database()
					.ref("songs")
					.child(payload.id)
					.update({
						...payload.data,
					})
					.then(() => {
						// commit("updateSong", payload);
						dispatch("updateUserSong", payload);
						commit("setSongListLoading", false);
					})
					.catch((e) => {
						console.log(e);
						commit("setSongListLoading", false);
					});
			}

			// .then(() => {
			// 	commit("updateSong", payload);
			// 	commit("setSongListLoading", false);
			// })
			// .catch((e) => {
			// 	console.log(e);
			// 	commit("setSongListLoading", false);
			// });
		},

		updateUserSong({ getters }, payload) {
			// commit("setSongListLoading", true);
			if (getters.getUserLogged) {
				firebase
					.database()
					.ref("users/" + getters.getUser.uid + "/songs/" + payload.id)
					.update({
						title: payload.data.title,
						author: payload.data.author,
					})
					.catch((e) => {
						console.log(e);
					});
			}
		},

		addSong({ dispatch, getters }, payload) {
			// console.log(commit);
			if (getters.getUserLogged) {
				firebase
					.database()
					.ref("songs")
					.push(payload)
					.then((data) => {
						dispatch("addSongToUser", { key: data.key, ...payload });
					})
					.catch((e) => {
						console.log(e);
					});
			}
		},

		addSongToUser({ getters, dispatch }, payload) {
			if (getters.getUserLogged) {
				firebase
					.database()
					.ref("users/" + getters.getUser.uid + "/songs/" + payload.key)
					.set({ title: payload.title, author: payload.author, favourite: false })
					.then(() => {
						dispatch("addUserToSong", payload.key);
					})
					.catch((e) => {
						console.log(e);
					});
			}
		},

		addUserToSong({ getters }, payload) {
			if (getters.getUserLogged) {
				firebase
					.database()
					.ref("songs/" + payload + "/users/" + getters.getUser.uid)
					.set(true)
					.catch((e) => {
						console.log(e);
					});
			}
		},

		deleteSong({ dispatch }, payload) {
			// commit("setSongListLoading", true);
			// console.log(commit);
			firebase
				.database()
				.ref("songs/" + payload)
				.remove()
				.then(() => {
					dispatch("deleteUserSong", payload);
				})
				.catch((e) => {
					console.log(e);
					// commit("setSongListLoading", false);
				});
		},

		deleteUserSong({ dispatch }, payload) {
			// commit("setSongListLoading", true);
			// console.log(commit);
			firebase
				.database()
				.ref("songs/" + payload)
				.remove()
				.then(() => {
					dispatch("deleteUsersSong", payload);
				})
				.catch((e) => {
					console.log(e);
					// commit("setSongListLoading", false);
				});
		},

		logout() {
			return new Promise((resolve, reject) => {
				firebase
					.auth()
					.signOut()
					.catch((err) => {
						reject(err);
					});
			});
		},

		onUserStatusChange({ commit, dispatch }) {
			return new Promise((resolve) => {
				firebase.auth().onAuthStateChanged((user) => {
					if (user) {
						commit("setUser", user);
						dispatch("onUserDataChange");
						// dispatch("onSongsChange");
						resolve(user);
					} else {
						dispatch("offUserDataChange");
						// dispatch("offSongsChange");
						commit("logout");
					}
				});
			});
		},
	},
	modules: {},
});
