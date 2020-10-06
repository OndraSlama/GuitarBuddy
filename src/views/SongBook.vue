<template>
	<div>
		<div id="chord"></div>
	</div>
</template>

<script>
import { mapGetters } from "vuex";
import jtab from "jtab";
export default {
	computed: {
		...mapGetters({
			user: "getUser",
		}),
	},
	mounted() {
		this.$store.commit("setCurrentPage", "My Songs");
		jtab.render(document.getElementById("chord"), "Am7");
	},
};
</script>

<style lang="scss" scoped></style>
