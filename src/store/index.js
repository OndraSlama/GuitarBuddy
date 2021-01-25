import Vue from "vue";
import Vuex from "vuex";
import * as firebase from "firebase";
import normalizeString from "../functions/normalizeText";

Vue.use(Vuex);

export default new Vuex.Store({
	state: {
		currentPage: "",
		publicSongs: [],
		userSongBooks: {},
		userSongs: [],
		authors: [],
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
		getUserSongBooks: (state) => state.userSongBooks,
		getUserSongs: (state) => state.userSongs,
		getAuthors: (state) => state.authors,
		getPublicSongs: (state) => state.publicSongs,
		getUserLogged: (state) => state.user !== null && state.user !== undefined,
		getSongListLoading: (state) => state.songListLoading,
		getSongLoading: (state) => state.songLoading,
		getPublicSongListLoading: (state) => state.publicSongListLoading,
		getShowTooltips: (state) => state.showTooltips,
		getDialogOpened: (state) => state.deleteDialogOpened,

		getFilteredSongs: (_, getters) => (songs, filters) => {
			let filteredSongs = songs.filter((el) => {
				const titleMatch = normalizeString(el.title).includes(normalizeString(filters.search));
				const authorMatch = normalizeString(el.author).includes(normalizeString(filters.search));

				return titleMatch || authorMatch;
			});

			let groupsObject = {};
			filteredSongs.forEach((song) => {
				let groups = [];
				// Determine groups for every song
				if (filters.groupByPlayBooks ?? false){
					let playbooks = getters.getUserSongBooks;
					for (const key in playbooks) {
						if (Object.prototype.hasOwnProperty.call(playbooks[key], song["id"])) {
							if (!groups.includes(key)){
								groups.push(key);							
							}
						}
					}
				}else if (filters.groupByAuthor) {				
					groups = [song.author];		
				} else {					
					if (song.favourite) {
						groups = ["Favourite", "Collection"];
					} else {
						groups = ["Collection"];
					}	
				}

				// Save to group objects
				groups.forEach(group => {						
					if (groupsObject[group] == undefined) {
						groupsObject[group] = [];
					}
					groupsObject[group].push({ ...song, selected: false });
				});
			});

			// Convert object to array
			let groupsArray = [];
			for (let key in groupsObject) {
				groupsArray.push({ group: key, songs: groupsObject[key] });
			}

			for (let group of groupsArray) {
				group.songs.sort((a, b) => {
					const titleOrder = filters.titleNameOrder ? normalizeString(a.title) < normalizeString(b.title) : normalizeString(a.title) > normalizeString(b.title);
					const authorNameOrder = filters.authorNameOrder ? normalizeString(a.author) < normalizeString(b.author) : normalizeString(a.author) > normalizeString(b.author);
					const dateModifiedOrder = filters.modifiedDateOrder ? normalizeString(a.modifiedAt) < normalizeString(b.modifiedAt) : normalizeString(a.modifiedAt) > normalizeString(b.modifiedAt);
					const dateCreatedOrder = filters.createdDateOrder ? normalizeString(a.createdAt) < normalizeString(b.createdAt) : normalizeString(a.createdAt) > normalizeString(b.createdAt);
					const forksOrder = filters.forksOrder ? (a.forks ?? 0) < (b.forks ?? 0) : (a.forks ?? 0) > (b.forks ?? 0);
					if (filters.orderOption == "authorName") {
						return authorNameOrder ? 1 : -1;
					}
					if (filters.orderOption == "dateModified") {
						return dateModifiedOrder ? 1 : -1;
					}
					if (filters.orderOption == "dateCreated") {
						return dateCreatedOrder ? 1 : -1;
					}
					if (filters.orderOption == "forks") {
						return forksOrder ? 1 : -1;
					}
					
					return titleOrder ? 1 : -1;
				});
			}

			groupsArray = groupsArray.sort((a, b) => {
				if (a.group === "Favourite") return -1;
				if (b.group === "Favourite") return 1;

				const authorNameOrder = filters.authorNameOrder ? normalizeString(a.group) < normalizeString(b.group) : normalizeString(a.group) > normalizeString(b.group);
				return authorNameOrder ? 1 : -1;
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
		},
		setUser(state, user) {
			state.user = {
				...user,
			};
		},
		setUserSongs(state, userSongs) {
			state.userSongs = userSongs;
		},
		setUserSongBooks(state, userSongBooks){
            state.userSongBooks = {...userSongBooks}
		},
		setAuthors(state, authors){
			state.authors = authors
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
					commit("setLoadedSong", { ...data.val(), id: data.key });
					commit("setSongLoading", false);
				})
				.catch((e) => {
					commit("setSongLoading", false);
					console.log(e);
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

		loadPublicSongsOn({ commit }) {
			commit("setPublicSongListLoading", true);
			commit("resetPublicSongs");
			firebase
				.database()
				.ref("publicSongs")
				.on("value", (data) => {
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
				});
			// .catch((e) => {
			// 	console.log(e);
			// 	console.log("database error");
			// 	commit("setPublicSongListLoading", false);
			// });
		},

		loadPublicSongsOff() {
			firebase
				.database()
				.ref("publicSongs")
				.off("value");
		},


		loadUserDataOn({ getters, commit }) {
			if (getters.getUserLogged) {
				firebase
					.database()
					.ref("users/" + getters.getUser.uid)
					.on("value", (data) => {
						if (getters.getUserLogged) {
							const obj = data.val();

							// Parse user songs
							let userSongs = [];
							for (let key in obj["songs"]) {
								userSongs.push({
									id: key,
									...obj["songs"][key],
								});
							}
							commit("setUserSongs", userSongs);

							// Parse user playbooks							
							commit("setUserSongBooks", {...obj["playBooks"]});
						}
					});
			}
		},

		loadUserDataOff({ getters }) {
			if (getters.getUserLogged) {
				firebase
					.database()
					.ref("users/" + getters.getUser.uid)
					.off("value");
			}
		},

		addSong({ dispatch, getters }, payload) {
			return new Promise((resolve, reject) => {
				if (getters.getUserLogged) {
					dispatch("setAuthor", {name: payload.author});
					let newSong = {
						author: payload.author,
						title: payload.title,
						input: { ...payload.input },
						sections: payload.sections,
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
				}
			});
		},

		updateSong({ commit, dispatch, getters }, payload) {
			return new Promise((resolve, reject) => {
				if (getters.getUserLogged) {
					dispatch("setAuthor", {name: payload.data.author});
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
							resolve();
						})
						.catch((e) => {
							console.log(e);
							commit("setSongListLoading", false);
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
        
		addSongToSongbook({ getters }, payload) {
            if (getters.getUserLogged) {
                firebase
                    .database()
                    .ref("users/" + getters.getUser.uid + "/playBooks/" + payload.songbook)
                    .update({ [payload.id]: true });		                
            }
		},


		setAuthor(_, payload){
			firebase
				.database()
				.ref("authors")
				.update({[payload.name]: true})
				.catch((e) => {
					console.log(e);
				});
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

		setUserStatusChange({ commit, dispatch }) {
			return new Promise((resolve) => {
				firebase.auth().onAuthStateChanged((user) => {
					if (user) {
						commit("setUser", user);
						dispatch("loadUserDataOn");
						// dispatch("onSongsChange");
						resolve(user);
					} else {
						dispatch("loadUserDataOff");
						// dispatch("offSongsChange");
						commit("logout");
					}
				});
			});
		},
	},
	modules: {},
});
