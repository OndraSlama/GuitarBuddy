<template>
	<v-dialog v-model="dialogOpened" max-width="500px" transition="dialog-transition">
		<v-card>
			<v-card-title class="headline">Do you want to save the imported songs?</v-card-title>

			<v-card-text>
				<h3 class="mb-2">
					These songs have been imported:
				</h3>
				<ul>
					<li v-for="song in songs" :key="song.title + song.author">{{ song.title }} by {{ song.author || "unknown artist" }}</li>
				</ul>
			</v-card-text>

			<v-card-actions>
				<v-spacer></v-spacer>

				<v-btn color="secondary" text @click="dialogOpened = false">Cancel</v-btn>

				<v-btn color="primary" text @click="onAgree">Save songs</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script>
import dialogBase from "../../mixins/dialogBase";
export default {
	mixins: [dialogBase],
	props: ["songs"],

	// data(){
	// 	return {

	// 	}
	// },

	methods: {
		onAgree() {
			this.dialogOpened = false;
			this.$emit("accept");
		},
	},
};
</script>

<style lang="scss" scoped></style>
