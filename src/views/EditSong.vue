<template>
	<div>
		<p class="text-h3 text--secondary text-end font-weight-light text-sm-h2 mb-6">Edit song</p>
		<v-row>
			<v-col cols="12" md="6" lg="4">
				<song-editor :songSource="song.input" v-on:song-submited="saveSong" v-on:input="formatedSong = $event" v-on:cancel="onCancel" v-on:delete="onDelete" type="edit"></song-editor>
			</v-col>
			<v-divider class="hidden-md-and-up"></v-divider>
			<v-col cols="12" md="6" lg="8">
				<song-sheet :song="formatedSong" class="pl-md-6"></song-sheet>
			</v-col>
		</v-row>
	</div>
</template>

<script>
import SongSheet from "../components/SongSheet";
import SongEditor from "../components/SongEditor";
import { mapGetters } from "vuex";
export default {
	data() {
		return {
			transitioning: false,
			formatedSong: undefined,
		};
	},
	methods: {
		saveSong() {
			if (this.formatedSong == undefined) {
				alert("Undefined formated song");
				return;
			}
			let updatedSong = {
				...this.song,
				...this.formatedSong,
				modifiedAt: new Date().toISOString(),
			};

			console.log(updatedSong);
		},

		onCancel() {
			this.$router.push("/song-book");
		},

		onDelete() {
			console.log("delete");
			this.$store.commit("deleteSong", this.id);
			this.$router.push("/song-book");
		},
	},
	computed: {
		id() {
			return this.$route.params.id;
		},

		song() {
			return this.$store.getters.getSong(this.id);
		},

		songValid() {
			return this.song != undefined || this.song != null;
		},
		...mapGetters({
			userLogged: "getUserLogged",
			user: "getUser",
			songListLoading: "getSongListLoading",
		}),
	},
	components: {
		"song-sheet": SongSheet,
		"song-editor": SongEditor,
	},

	watch: {
		"$route.params.id": function() {
			this.transitioning = true;
			setTimeout(() => {
				this.transitioning = false;
			}, 80);
		},
	},
};
</script>

<style lang="scss" scoped></style>
