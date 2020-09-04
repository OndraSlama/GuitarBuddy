import Vue from "vue";
import Vuex from "vuex";
import * as firebase from "firebase";

Vue.use(Vuex);

export default new Vuex.Store({
	state: {
		songs: [],
		user: null,
		songListOpened: false,
		deleteDialogOpened: false,
		songListLoading: false,
		showTooltips: false,
	},
	getters: {
		getSongs(state) {
			return state.songs;
		},
		getSongListOpened(state) {
			return state.songListOpened;
		},
		getSong: (state) => (id) => state.songs.find((el) => el.id === id),

		getFilteredSongs: (state) => ({ search }) => {
			let normalizeString = (string) => {
				return string
					.normalize("NFD")
					.replace(/[\u0300-\u036f]/g, "")
					.toLowerCase();
			};

			return state.songs.filter((el) => {
				const titleMatch = normalizeString(el.title).includes(normalizeString(search));
				const authorMatch = normalizeString(el.author).includes(normalizeString(search));

				return titleMatch || authorMatch;
			});
		},
		getUser: (state) => state.user,
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
			state.songs = songs;
		},
		// addSong(state, song) {
		// 	state.songs.push(song);
		// },
		// updateSong(state, payload) {
		// 	let song = state.songs.find((el) => el.id === payload.id);
		// 	Vue.set(state.songs, state.songs.indexOf(song), { ...payload.data });
		// },
		// deleteSong(state, id) {
		// 	state.songs.splice(
		// 		state.songs
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
		setUserData(state, userData) {
			state.user = { ...state.user, songs: userData };
		},
		setDialogOpened(state, value) {
			state.deleteDialogOpened = value;
		},
	},
	actions: {
		onSongsChange({ commit, dispatch, getters }) {
			if (getters.getUserLogged) {
				commit("setSongListLoading", true);
				firebase
					.database()
					.ref("songs")
					.on("value", (data) => {
						console.log("on songs change");
						dispatch("parseSongs", data);
					});
			}
		},

		offSongsChange() {
			firebase
				.database()
				.ref("songs")
				.off("value");
		},

		onUserDataChange({ dispatch, getters }) {
			if (getters.getUserLogged) {
				firebase
					.database()
					.ref("users/" + getters.getUser.uid + "/songs")
					.on("value", (data) => {
						console.log("on user data change");
						dispatch("parseUserData", data);
						dispatch("loadSongsOnce");
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

		loadSongsOnce({ dispatch }) {
			firebase
				.database()
				.ref("songs")
				.once("value")
				.then((data) => {
					dispatch("parseSongs", data);
				});
		},

		parseSongs({ commit, getters }, payload) {
			if (getters.getUserLogged) {
				let songs = [];
				const obj = payload.val();
				for (let key in obj) {
					songs.push({
						id: key,
						...obj[key],
					});
				}
				commit("loadSongs", songs);
				commit("setSongListLoading", false);
			}
		},

		parseUserData({ commit, getters }, payload) {
			if (getters.getUserLogged) {
				let userSongs = [];
				const obj = payload.val();
				for (let key in obj) {
					userSongs.push({
						fbKey: key,
						...obj[key],
					});
				}
				commit("setUserData", userSongs);
			}
		},

		updateSong({ commit }, payload) {
			commit("setSongListLoading", true);
			firebase
				.database()
				.ref("songs")
				.child(payload.id)
				.update({
					...payload.data,
				})
				.catch((e) => {
					console.log(e);
					commit("setSongListLoading", false);
				});

			// .then(() => {
			// 	commit("updateSong", payload);
			// 	commit("setSongListLoading", false);
			// })
			// .catch((e) => {
			// 	console.log(e);
			// 	commit("setSongListLoading", false);
			// });
		},
		addSong({ dispatch }, payload) {
			// console.log(commit);
			firebase
				.database()
				.ref("songs")
				.push(payload)
				.then((data) => {
					dispatch("addSongToUser", data.key);
				})
				.catch((e) => {
					console.log(e);
				});
			console.log(payload);
		},

		addSongToUser({ getters }, payload) {
			if (getters.getUserLogged) {
				console.log(payload);
				firebase
					.database()
					.ref("users/" + getters.getUser.uid + "/songs")
					.push({ id: payload, favourite: false })
					.catch((e) => {
						console.log(e);
					});
			}
		},

		deleteSong(_, payload) {
			// commit("setSongListLoading", true);
			// console.log(commit);
			firebase
				.database()
				.ref("songs/" + payload)
				.remove()
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
						dispatch("onSongsChange");
						resolve(user);
					} else {
						dispatch("offUserDataChange");
						dispatch("offSongsChange");
						commit("logout");
					}
				});
			});
		},
	},
	modules: {},
});
