<template>
	<v-app style="overflow: hidden">
		<nav-bar></nav-bar>
		<song-list></song-list>
		<v-main class="pt-0">
			<router-view v-slot="{ Component }">
				<v-scroll-y-transition hide-on-leave>
					<component :is="Component" class="mt-15 pa-sm-5 pa-0 ma-0"></component>
				</v-scroll-y-transition>
			</router-view>
		</v-main>
		<app-footer></app-footer>
	</v-app>
</template>

<script>
import NavBar from "../src/components/NavBar.vue";
import Footer from "../src/components/Footer.vue";
import SongList from "../src/components/SongList.vue";
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
		scrollbarTheme() {
			return this.$vuetify.theme.current.dark ? "dark" : "light";
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

/* Scroll bar */
::-webkit-scrollbar {
	width: 4px;
}

::-webkit-scrollbar-track {
	background: rgba(0, 0, 0, 0);
}

::-webkit-scrollbar-thumb {
	background: rgba(0, 0, 0, 0.397);
	border-radius: 7px;
}

::-webkit-scrollbar-thumb:hover {
	background: rgba(0, 0, 0, 0.603);
}
</style>
