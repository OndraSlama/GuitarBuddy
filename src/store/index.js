import Vue from "vue";
import Vuex from "vuex";
import * as firebase from "firebase";

Vue.use(Vuex);

export default new Vuex.Store({
	state: {
		songs: [],
		songListOpened: false,
		songListLoading: false,
		showTooltips: false,
		user: null,
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
			return state.songs.filter((el) => {
				const titleMatch = el.title.toLowerCase().includes(search.toLowerCase());
				const authorMatch = el.author.toLowerCase().includes(search.toLowerCase());

				return titleMatch || authorMatch;
			});
		},
		getUser: (state) => state.user,
		getUserLogged: (state) => state.user !== null && state.user !== undefined,

		getSongListLoading: (state) => state.songListLoading,
		getShowTooltips: (state) => state.showTooltips,
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
		addSong(state, song) {
			state.songs.push(song);
		},
		deleteSong(state, id) {
			state.songs.splice(
				state.songs
					.map((song) => {
						return song.id;
					})
					.indexOf(id),
				1
			);
		},
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
			state.user = user;
		},
	},
	actions: {
		loadSongs({ commit }) {
			commit("setSongListLoading", true);
			firebase
				.database()
				.ref("songs")
				.once("value")
				.then((data) => {
					let songs = [];
					const obj = data.val();
					for (let key in obj) {
						songs.push({
							id: key,
							...obj[key],
						});
					}
					commit("loadSongs", songs);
					commit("setSongListLoading", false);
				})
				.catch((e) => {
					console.log(e);
					commit("setSongListLoading", false);
				});
		},
		addSong({ commit }, payload) {
			firebase
				.database()
				.ref("songs")
				.push(payload)
				.then((data) => {
					const song = {
						...payload,
						id: data.key,
					};
					commit("addSong", song);
				})
				.catch((e) => {
					console.log(e);
				});
		},

		logout({ commit }) {
			return new Promise((resolve, reject) => {
				firebase
					.auth()
					.signOut()
					.then(() => {
						commit("logout");
						resolve();
					})
					.catch((err) => {
						reject(err);
					});
			});
		},
		checkUserStatus({ commit }) {
			return new Promise((resolve, reject) => {
				firebase.auth().onAuthStateChanged((user) => {
					if (user) {
						commit("setUser", user);
						resolve(user);
					} else {
						reject("User is not logged in.");
					}
				});
			});
		},
	},
	modules: {},
});
