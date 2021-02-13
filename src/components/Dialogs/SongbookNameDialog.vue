<template>
	<v-dialog v-model="dialogOpened" max-width="400px" transition="dialog-transition">
		<v-card>
			<v-card-title class="headline">Define song book name</v-card-title>

			<v-card-text>
				<v-text-field class="" v-model="songbookName" label="Song book name" hide-details="auto"></v-text-field>
			</v-card-text>

			<v-card-actions>
				<v-spacer></v-spacer>

				<v-btn color="secondary" text @click="dialogOpened = false">Cancel</v-btn>

				<v-btn color="primary" text @click="onAgree">OK</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script>
import { mapGetters } from "vuex";
import dialogBase from "../../mixins/dialogBase";
export default {
	mixins: [dialogBase],

	data() {
		return {
			songbookName: "",
		};
	},

	methods: {
		onAgree() {
			this.dialogOpened = false;
			let temp = this.songbookName;
			this.songbookName = "";
			this.$emit("accept", temp);
		},
	},

	computed: {
		...mapGetters({}),
	},
};
</script>

<style lang="scss" scoped></style>
