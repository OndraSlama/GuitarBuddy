<template>
	<v-app style="overflow: hidden">
		<nav-bar></nav-bar>
		<song-list></song-list>
		<v-main class="pt-0">
			<v-scroll-y-transition hide-on-leave>
				<router-view class="mt-15 pa-sm-5 ma-2"></router-view>
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
		scrollbarTheme() {
			return this.$vuetify.theme.dark ? "dark" : "light";
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
/* .verse {
	color: rgb(156, 156, 156);
} */
/* .chorus {
	color: rgb(116, 124, 38);
}
.bridge {
	color: rgb(79, 93, 155);
} */
/* .verse .name {
	color: rgb(156, 156, 156);
}
.chorus .name {
	color: rgb(50, 104, 12);
}
.bridge .name {
	color: rgb(92, 102, 134);
} */
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
