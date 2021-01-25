<template>
	<v-dialog v-model="dialogOpened" transition="dialog-transition" :fullscreen="viewportSize.xs">
		<div v-if="song">
			<v-card height="100vh">
				<v-skeleton-loader v-show="songLoading" type="card-heading"></v-skeleton-loader>
				<v-skeleton-loader v-show="songLoading" v-for="n in 5" :key="n" type="list-item-two-line"></v-skeleton-loader>
				<song-sheet v-if="!songLoading" type="modal" :song="song" v-on:cancel="dialogOpened = false"></song-sheet>
			</v-card>
		</div>
	</v-dialog>
</template>

<script>
import SongSheet from "../../components/SongSheet";
import dialogBase from "../../mixins/dialogBase";
import { mapGetters } from "vuex";

export default {
	mixins: [dialogBase],
	props: ["song"],

	computed: {
		...mapGetters({
			songLoading: "getSongLoading",
		}),
	},

	components: {
		"song-sheet": SongSheet,
	},
};
</script>

<style lang="scss" scoped></style>
