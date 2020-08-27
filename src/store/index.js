import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
	state: {
		songs: [],
		songListOpened: false,
	},
	getters: {
		getSongs(state) {
			return state.songs;
		},
		getSongListOpened(state) {
			return state.songListOpened;
		},
		getSong: (state) => (id) => {
			return state.songs.find((el) => el.id === id);
		},
	},
	mutations: {
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
	},
	actions: {},
	modules: {},
});
