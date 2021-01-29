<template>
	<v-dialog v-model="dialogOpened" max-width="400px" transition="dialog-transition">
		<div>
			<v-list>
				<v-list-item v-for="(value, songbook) in songbooks" :key="songbook" @click="selectSongbook(songbook)">
					<span>{{ songbook }}</span>
				</v-list-item>
			</v-list>
		</div>
		<!-- <div>OMG</div> -->
	</v-dialog>
</template>

<script>
import { mapGetters } from "vuex";
import dialogBase from "../../mixins/dialogBase";
export default {
	mixins: [dialogBase],

	methods: {
		selectSongbook(songbook) {
			this.dialogOpened = false;
			this.$emit("onSelected", songbook);
		},
	},

	computed: {
		...mapGetters({ songbooks: "getUserSongBooks" }),
	},
};
</script>

<style lang="scss" scoped></style>
