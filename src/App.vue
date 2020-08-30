<template>
	<v-app>
		<nav-bar></nav-bar>
		<song-list></song-list>
		<v-main>
			<v-scroll-y-transition hide-on-leave>
				<router-view class="pa-sm-5 ma-2"></router-view>
			</v-scroll-y-transition>
		</v-main>
		<app-footer></app-footer>
	</v-app>
</template>

<script>
import NavBar from "../src/components/NavBar";
import Footer from "../src/components/Footer";
import SongList from "../src/components/SongList";
export default {
	name: "App",

	components: {
		"nav-bar": NavBar,
		"app-footer": Footer,
		"song-list": SongList,
	},

	data: () => ({
		//
	}),
	computed: {
		size() {
			return this.$vuetify.breakpoint;
		},
	},
};
</script>

<style>
.monospace {
	font-family: "Roboto Mono", monospace;
}
.chord {
	color: rgb(255, 92, 92);
}
.thin-border {
	border: 1px solid rgb(104, 104, 104);
}
</style>
