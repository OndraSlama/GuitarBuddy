<template>
	<p class="display-1 text--secondary text-center">In development</p>
</template>

<script>
import { mapGetters } from "vuex";
export default {
	computed: {
		...mapGetters({
			user: "getUser",
		}),
	},
};
</script>

<style lang="scss" scoped></style>
