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
		playSession: undefined,
		userPreferences: {},
		defaultPreferences: {
			notation: "German (A H C D E F G)",
			fontSize: "Small",
			multipleColumns: true,
			showTabs: true,
			scrollSpeed: 40,
		},

		fontSizePreferences: ["Small", "Medium", "Large"],
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
		getUserPreferences: (state, getters) => {
			if (getters.getUserLogged && state.userPreferences && Object.keys(state.userPreferences).length > 0) {
				return state.userPreferences;
			}
			return state.defaultPreferences;
		},
		getPlaySession: (state) => state.playSession,
		getDefaultPreferences: (state) => state.defaultPreferences,
		getFontSizePreferences: (state) => state.fontSizePreferences,
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
			let filteredSongs = songs.filter((el) => {
				const titleMatch = normalizeString(el.title).includes(normalizeString(filters.search));
				const authorMatch = normalizeString(el.author).includes(normalizeString(filters.search));

				return titleMatch || authorMatch;
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
					groupsObject[group].push({ ...song, selected: false });
				});
			});

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
					const forksOrder = filters.forksOrder ? (a.forks ?? 0) > (b.forks ?? 0) : (a.forks ?? 0) < (b.forks ?? 0);
					if (filters.orderBy == "authorName") {
						return authorNameOrder ? 1 : -1;
					}
					if (filters.orderBy == "dateModified") {
						return dateModifiedOrder ? 1 : -1;
					}
					if (filters.orderBy == "dateCreated") {
						return dateCreatedOrder ? 1 : -1;
					}
					if (filters.orderBy == "forks") {
						return forksOrder ? 1 : -1;
					}
					
					return titleOrder ? 1 : -1;
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
			state.userPreferences = {};
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
		setUserPreferences(state, userPreferences){
			state.userPreferences = {...userPreferences}
		},
		setPlaySession(state, playSession){
			state.playSession = playSession
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
			
		loadSong({ getters, commit, dispatch }, payload) {
			commit("setSongLoading", true);
			
			return new Promise((resolve, reject) => {
				let userSong = getters.getCurrentSong(payload)
				if (userSong) {
					console.log("userSong", userSong);
					resolve(userSong)
					commit("setSongLoading", false);
				}else{					
					dispatch("loadPublicSongs").then(() => {
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

		loadUserDataOn({ getters, commit }) {
			if (getters.getUserLogged) {
				commit("setSongListLoading", true);
				firebase
					.database()
					.ref("users/" + getters.getUser.uid)
					.on("value", (data) => {
						commit("setSongListLoading", false);
						if (getters.getUserLogged) {
							const obj = data.val();

							let userSongs = [];
							if (obj && obj["songs"]) {
								for (let key in obj["songs"]) {
									userSongs.push({
										id: key,
										...obj["songs"][key],
									});
								}
							}							
							commit("setUserSongs", userSongs);
							
							let songbooks = (obj && obj["playBooks"]) ? obj["playBooks"] : {};
							for (const key in songbooks) {
								for (const songid in songbooks[key]) {
									if (!songbooks[key][songid]){
										delete songbooks[key][songid]
									}
								}								  
							}
							commit("setUserSongBooks", {...songbooks});

							if(obj && obj["preferences"]){
								commit("setUserPreferences", {...obj["preferences"]});
							}else{
								const defaultPrefs = getters.getDefaultPreferences;
								commit("setUserPreferences", defaultPrefs);
								if (getters.getUserLogged) {
									firebase
										.database()
										.ref("users/" + getters.getUser.uid + "/preferences")
										.set(defaultPrefs)
										.catch((e) => {
											console.error("Error saving default preferences for new user:", e);
										});
								}
							}
							
							commit("setPlaySession", (obj && obj["playSession"]) ? {...obj["playSession"]} : undefined);
						}
					});
			} else {
				commit("setUserPreferences", getters.getDefaultPreferences);
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

		updatePreferences({getters}, payload){
			return new Promise((resolve, reject) => {
				if (!getters.getUserLogged) {
					reject()
					return;
				}
				
				firebase
					.database()
					.ref("users/" + getters.getUser.uid + "/preferences")
					.update({
						...payload,
					})
					.then(() => {
						resolve();
					})
					.catch((e) => {
						console.log(e);
						reject();
					});
				
			});
		},

		startPlaySession({ getters }) {
			return new Promise((resolve, reject) => {
				if (getters.getUserLogged) {
					firebase
						.database()
						.ref("users/" + getters.getUser.uid + "/playSession")
						.once("value")
						.then((data) => {
							let obj = data.val();
							if (obj != null){
								console.log("Session already started. ID: " + obj.id);
								resolve(obj.id)
								return
							} 

							firebase
								.database()
								.ref("playSessions/")
								.push({
									createdBy: getters.getUser.uid
								})
								.then((data) => {
									let newSession = {	
										id: data.key,	
										createdBy: getters.getUser.uid,
										createdAt: new Date().toISOString(),
										updatedAt: new Date().toISOString(),
										connected: 0,
										currentSong: null,
									};
		
									firebase
										.database()
										.ref("users/" + getters.getUser.uid + "/playSession")
										.update(newSession)
										.then(() => {							
											resolve(newSession.id);
										})
										.catch((e) => {
											console.log(e);
											reject(e);
										});
								})
							
							
							
						});					
				} else {
					reject("User not logged in");
				}
			});
		},

		updatePlaySession({ getters }, payload) {
			return new Promise((resolve, reject) => {
				if (getters.getUserLogged) {				  
		
					firebase
						.database()
						.ref("users/" + getters.getUser.uid + "/playSession")
						.update({...payload})
						.then(() => {							
							resolve(payload.id);
						})
						.catch((e) => {
							console.log(e);
							reject(e);
						});
										
				} else {
					reject("User not logged in");
				}
			});
		},

        playSessionOn({commit}, payload) {
			return new Promise((resolve, reject) => {
                firebase
                    .database()
                    .ref("playSessions/" + payload)
                    .once("value")
                    .then((data) => {		
						let session = data.val();
						if (!session || !session.createdBy) {
							console.error("Play session or createdBy field is missing for ID:", payload);
							reject("Invalid session data");
							return;
						}	
						firebase
							.database()
							.ref("users/" + session.createdBy + "/playSession")
							.once("value")
							.then((data) => { 
								let obj = data.val();
								firebase
									.database()
									.ref("users/" + session.createdBy + "/playSession")
									.update({connected: (obj && obj.connected ? obj.connected : 0) + 1})
								})
                        firebase
                            .database()
                            .ref("users/" + session.createdBy + "/playSession")
                            .on("value", (data) => { 
                                commit("setPlaySession", {...data.val()})
                             })
                             resolve();
                    })
                    .catch((e) => {
                        console.log(e);
						reject(e);
                    });
			});
		},

        playSessionOff(_, payload) {
			return new Promise((resolve, reject) => {
				firebase
				.database()
				.ref("playSessions/" + payload)
				.once("value")
				.then((data) => {		
						
						let session = data.val();
						if (!session || !session.createdBy) {
							console.error("Play session or createdBy field is missing for ID:", payload);
							resolve(); 
							return;
						}	
						firebase
							.database()
							.ref("users/" + session.createdBy + "/playSession")
							.once("value")
							.then((data) => { 
								
								let obj = data.val();
								firebase
									.database()
									.ref("users/" + session.createdBy + "/playSession")
									.update({connected: (obj && obj.connected ? obj.connected : 1) - 1})
								})
                        firebase
                            .database()
                            .ref("users/" + session.createdBy + "/playSession")
                            .off("value")  
                            .catch((e) => {console.log(e)});   

                        resolve();
                    })
                    .catch((e) => {
						console.log(e);
						reject(e);
					});   
			});
		},	
		
		stopPlaySession({ getters }, payload) {
			return new Promise((resolve, reject) => {
				if (getters.getUserLogged) {	 

					firebase
						.database()
						.ref("playSessions/" + payload)
						.remove();

					firebase
						.database()
						.ref("users/" + getters.getUser.uid + "/playSession")
						.remove()
						.then(() => { resolve() })
						.catch((e) => reject(e));							 
						
				} else {
					reject("User not logged in");
				}
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
						commit("setUserPreferences", { ...this.state.defaultPreferences });
						resolve(null);
                    }
                });
            });
        },
	},
	modules: {},
});