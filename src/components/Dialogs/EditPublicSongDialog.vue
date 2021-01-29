<template>
	<v-dialog v-model="dialogOpened" max-width="400px" transition="dialog-transition">
		<v-card>
			<v-card-title class="headline">Editing someone else's song</v-card-title>

			<v-card-text>By editing someone else's song a new copy will be created which you can then share as your own. However, please do not create unnecesary public copies of the same song unless important changes are made.</v-card-text>

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

	methods: {
		onAgree() {
			this.dialogOpened = false;
			this.$emit("accept");
		},
	},

	computed: {
		...mapGetters({}),
	},
};
</script>

<style lang="scss" scoped></style>
