<template>
	<v-dialog v-model="dialogOpened" max-width="400px" transition="dialog-transition">
		<v-card>
			<v-card-title class="text-h5">Create new Song Book</v-card-title>

			<v-card-text>
				<v-text-field v-model="songBookName" label="Song book name" hide-details="auto"></v-text-field>
			</v-card-text>

			<v-card-actions>
				<v-spacer></v-spacer>

				<v-btn color="secondary" variant="text" @click="dialogOpened = false">Cancel</v-btn>

				<v-btn color="primary" variant="text" @click="onAgree">OK</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script>
import dialogBase from "../../mixins/dialogBase";
export default {
	mixins: [dialogBase],
	emits: ["accept"],

	data() {
		return {
			songBookName: "",
		};
	},
	props: {
		defaultSongBookName: {
			type: String,
			default: "",
		},
	},

	methods: {
		onAgree() {
			this.dialogOpened = false;
			let temp = this.songBookName;
			this.songBookName = "";
			this.$emit("accept", temp);
		},
	},
	watch: {
		defaultSongBookName: function() {
			this.songBookName = this.defaultSongBookName;
		},
	},
};
</script>

<style lang="scss" scoped></style>
