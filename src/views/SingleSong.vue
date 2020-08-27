<template>
	<div>
		<song-sheet :song="song"></song-sheet>
	</div>
</template>

<script>
import SongSheet from "../components/SongSheet";

export default {
	data() {
		return {};
	},

	computed: {
		id() {
			return this.$route.params.id;
		},

		song() {
			return this.$store.getters.getSong(this.id);
		},
	},

	components: {
		"song-sheet": SongSheet,
	},
};
</script>

<style lang="scss" scoped></style>
