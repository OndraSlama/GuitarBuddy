<template>
	<div class="mt-0">
		<!-- <p class="text-h3 text--secondary text-start font-weight-light text-sm-h2 mb-6">Add new song</p> -->
		<v-row>
			<v-col cols="12" :md="expanded ? 8 : 6" :lg="expanded ? 8 : 4" style="position: relative">
				<song-editor v-on:song-submited="addSong" v-on:input="formatedSong = $event" v-on:back="$router.push('/')" type="add"> </song-editor>
				<v-btn xLarge icon color="primary" class="resize-button elevation-0 hidden-sm-and-down" @click="expanded = !expanded">
					<v-icon v-if="expanded">mdi-chevron-left</v-icon>
					<v-icon v-else>mdi-chevron-right</v-icon>
				</v-btn>
			</v-col>
			<v-divider class="hidden-md-and-up"></v-divider>
			<v-col cols="12" :md="expanded ? 4 : 6" :lg="expanded ? 4 : 8">
				<v-scroll-y-transition>
					<song-sheet v-if="formatedSong !== undefined && (formatedSong.author || formatedSong.title || formatedSong.sections.length > 0)" :expanded="expanded" :song="formatedSong" class="pl-md-6"></song-sheet>
				</v-scroll-y-transition>
			</v-col>
		</v-row>
		<v-snackbar v-model="snackbar"> Song created </v-snackbar>
	</div>
</template>

<script>
import SongSheet from "../components/SongSheet";
import SongEditor from "../components/SongEditor";
import { mapGetters } from "vuex";

export default {
	data() {
		return {
			formatedSong: undefined,
			expanded: false,
			snackbar: false,
		};
	},
	methods: {
		addSong(songInput) {
			if (this.formatedSong == undefined) {
				alert("Undefined formated song");
				return;
			}
			let newSong = {
				...this.formatedSong,
				input: {
					...songInput,
				},
			};
			this.$store.dispatch("addSong", newSong).then(() => (this.snackbar = true));
		},
	},
	computed: {
		...mapGetters({
			userLogged: "getUserLogged",
			user: "getUser",
			showTooltips: "getShowTooltips",
		}),
	},
	components: {
		"song-sheet": SongSheet,
		"song-editor": SongEditor,
	},

	created() {
		this.$store.commit("setCurrentPage", "Add Song");
	},
};
</script>

<style lang="scss" scoped>
.resize-button {
	position: absolute;
	top: clamp(0px, 55%, 50vh);
	right: -37px;
}
</style>
