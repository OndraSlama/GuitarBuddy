<template>
	<v-dialog v-model="dialogOpened" max-width="400px" transition="dialog-transition">
		<v-card>
			<v-card-title class="headline">{{ title }}</v-card-title>

			<v-card-text>{{ text }}</v-card-text>

			<v-card-actions>
				<v-spacer></v-spacer>

				<v-btn color="secondary" text @click="dialogOpened = false">Cancel</v-btn>

				<v-btn color="primary" text @click="onAgree">{{ acceptButton }}</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script>
import dialogBase from "../../mixins/dialogBase";
export default {
	mixins: [dialogBase],
	props: ["title", "text", "acceptButton"],

	methods: {
		onAgree() {
			this.dialogOpened = false;
			this.$emit("accept");
		},
	},
};
</script>

<style lang="scss" scoped></style>
