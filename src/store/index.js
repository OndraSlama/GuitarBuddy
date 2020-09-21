import Vue from "vue";
import Vuex from "vuex";
import * as firebase from "firebase";
import normalizeString from "../functions/normalizeText";

Vue.use(Vuex);

export default new Vuex.Store({
	state: {
		currentPage: "",
		publicSongs: [],
		userSongs: [],
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
		getPublicSongs: (state) => state.publicSongs,
		getUserLogged: (state) => state.user !== null && state.user !== undefined,
		getSongListLoading: (state) => state.songListLoading,
		getSongLoading: (state) => state.songLoading,
		getPublicSongListLoading: (state) => state.publicSongListLoading,
		getShowTooltips: (state) => state.showTooltips,
		getDialogOpened: (state) => state.deleteDialogOpened,

		getFilteredSongs: () => (songs, filters) => {
			let filteredSongs = songs.filter((el) => {
				const titleMatch = normalizeString(el.title).includes(normalizeString(filters.search));
				const authorMatch = normalizeString(el.author).includes(normalizeString(filters.search));

				return titleMatch || authorMatch;
			});

			let groups = {};
			if (filters.groupByAuthor) {
				filteredSongs.forEach((song) => {
					if (groups[song.author] == undefined) {
						groups[song.author] = [];
					}
					groups[song.author].push({ ...song, selected: false });
				});
			} else {
				filteredSongs.forEach((song) => {
					let group;
					if (song.favourite) {
						group = "Favourite";
					} else {
						group = "Collection";
					}

					if (groups[group] == undefined) {
						groups[group] = [];
					}
					groups[group].push({ ...song, selected: false });
				});
			}

			let groupsArray = [];

			for (let key in groups) {
				groupsArray.push({ group: key, songs: groups[key] });
			}

			for (let group of groupsArray) {
				group.songs.sort((a, b) => {
					const titleOrder = filters.songsAscOrder ? normalizeString(a.title) < normalizeString(b.title) : normalizeString(a.title) > normalizeString(b.title);
					const authorOrder = filters.authorsAscOrder ? normalizeString(a.author) < normalizeString(b.author) : normalizeString(a.author) > normalizeString(b.author);
					const dateOrder = filters.songsDateOrder ? normalizeString(a.modifiedAt) < normalizeString(b.modifiedAt) : normalizeString(a.modifiedAt) > normalizeString(b.modifiedAt);
					if (filters.orderOption == 1) {
						return authorOrder ? 1 : -1;
					}
					if (filters.orderOption == 2) {
						return dateOrder ? 1 : -1;
					}
					return titleOrder ? 1 : -1;
				});
			}

			return groupsArray.sort((a, b) => {
				if (a.group === "Favourite") return -1;
				if (b.group === "Favourite") return 1;

				const authorOrder = filters.authorsAscOrder ? normalizeString(a.group) < normalizeString(b.group) : normalizeString(a.group) > normalizeString(b.group);
				return authorOrder ? 1 : -1;
			});
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
		// addSong(state, song) {
		// 	state.publicSongs.push(song);
		// },
		// updateSong(state, payload) {
		// 	let song = state.publicSongs.find((el) => el.id === payload.id);
		// 	Vue.set(state.publicSongs, state.publicSongs.indexOf(song), { ...payload.data });
		// },
		// deleteSong(state, id) {
		// 	state.publicSongs.splice(
		// 		state.publicSongs
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
		loadPublicSong({ commit }, payload) {
			commit("setSongLoading", true);
			firebase
				.database()
				.ref("users/" + payload.createdBy + "/songs/" + payload.id)
				.once("value")
				.then((data) => {
					commit("setLoadedSong", data.val());
					commit("setSongLoading", false);
				})
				.catch((e) => {
					commit("setSongLoading", false);
					console.log(e);
				});
		},

		loadPublicSongs({ commit }) {
			commit("setPublicSongListLoading", true);
			commit("resetPublicSongs");
			firebase
				.database()
				.ref("publicSongs")
				.once("value")
				.then((data) => {
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
				})
				.catch((e) => {
					console.log(e);
					console.log("database error");
					commit("setPublicSongListLoading", false);
				});
		},

		savePublicSongToUser({ getters }, payload) {
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
					.catch((e) => {
						console.log(e);
					});
			}
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

		setFavourite({ getters }, payload) {
			firebase
				.database()
				.ref("users/" + getters.getUser.uid + "/songs/" + payload.id)
				.update({ favourite: payload.value });
		},

		updateSong({ commit, dispatch, getters }, payload) {
			// commit("setSongListLoading", true);
			if (getters.getUserLogged) {
				firebase
					.database()
					.ref("users/" + getters.getUser.uid + "/songs/" + payload.id)
					.update({
						...payload.data,
					})
					.then(() => {
						// commit("updateSong", payload);
						if (payload.data.createdBy === getters.getUser.uid) {
							if (payload.data.public) {
								dispatch("setPublicSong", payload);
							} else {
								dispatch("deletePublicSong", payload.id);
							}
						}
						commit("setSongListLoading", false);
					})
					.catch((e) => {
						console.log(e);
						commit("setSongListLoading", false);
					});
			}
		},

		setPublicSong({ getters }, payload) {
			if (getters.getUserLogged) {
				firebase
					.database()
					.ref("publicSongs/" + payload.id)
					.update({
						title: payload.data.title,
						author: payload.data.author,
						createdBy: getters.getUser.uid,
						modifiedAt: payload.data.modifiedAt,
					})
					.catch((e) => {
						console.log(e);
					});
			}
		},

		addSong({ dispatch, getters }, payload) {
			// console.log(commit);
			console.log("adding song");
			return new Promise((resolve, reject) => {
				if (getters.getUserLogged) {
					let newSong = {
						author: payload.author,
						title: payload.title,
						input: { ...payload.input },
						sections: payload.sections,
						createdBy: getters.getUser.uid,
						createdAt: new Date().toISOString(),
						modifiedAt: new Date().toISOString(),
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
				}
			});
		},

		deleteSong({ dispatch, getters }, payload) {
			// commit("setSongListLoading", true);
			// console.log(commit);
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
					})
					.catch((e) => {
						console.log(e);
						// commit("setSongListLoading", false);
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
