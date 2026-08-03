<template>
	<div class="text-center" v-if="user">
		<div>
			<div class="text-h5">
				<div>
					{{ user.displayName }}
				</div>
			</div>
			<div class="text-medium-emphasis mt-4">
				Song view settings (font size, notation, layout) are adjusted directly in the song view and remembered on this device.
			</div>
		</div>
	</div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
	computed: {
		...mapGetters({
			user: "getUser",
		}),
	},

	mounted() {
		if (this.user) {
			this.$store.commit("setCurrentPage", this.user.displayName);
		}
	},

	watch: {
		user(newUser) {
			if (newUser) {
				this.$store.commit("setCurrentPage", newUser.displayName);
			}
		},
	},
};
</script>

<style lang="scss" scoped></style>
