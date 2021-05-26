<template>
	<div class="text-center">
		<p class="display-1 text--secondary ">No active session</p>
		<p class="subtitle text--secondary ">Play session allows you to share currently selected song with others so everyone can see the same lyrics.</p>
		<p class="subtitle text--secondary ">Create your own session and share it by sending the page link.</p>
		<v-btn color="success" @click="startSession">Start new session</v-btn>
	</div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
	data() {
		return {};
	},

	methods: {
		startSession() {
			this.$emit("sessionStart");
			this.$store.dispatch("startPlaySession").then((id) => {
				this.$router.push("/play-session/" + id);
			});
		},
	},

	computed: {
		...mapGetters({
			user: "getUser",
		}),

		id() {
			return this.$route.params.id;
		},

		noSession() {
			return !this.$route.params.id;
		},
	},
};
</script>

<style lang="scss" scoped></style>
