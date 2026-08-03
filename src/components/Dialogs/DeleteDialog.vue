<template>
	<v-dialog v-model="dialogOpened" max-width="400px" transition="dialog-transition">
		<v-card>
			<v-card-title class="text-h5">Deleting song created by you</v-card-title>

			<v-card-text>Deleting song created by you will remove it permanently. Are you sure about this?</v-card-text>

			<v-card-actions>
				<v-spacer></v-spacer>

				<v-btn color="secondary" variant="text" @click="dialogOpened = false">Cancel</v-btn>

				<v-btn color="primary" variant="text" @click="onAgree">Delete</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script>
import dialogBase from "../../mixins/dialogBase";
export default {
	mixins: [dialogBase],
	emits: ["accept"],

	methods: {
		onAgree() {
			this.dialogOpened = false;
			this.$emit("accept");
		},
	},
};
</script>

<style lang="scss" scoped></style>
