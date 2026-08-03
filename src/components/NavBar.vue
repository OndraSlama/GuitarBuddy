<template>
	<div>
		<v-app-bar flat :density="viewportSize.xs ? 'compact' : 'default'" :scroll-behavior="viewportSize.smAndDown ? 'hide' : undefined" class="navbar">
			<v-app-bar-nav-icon v-if="userLogged" class="hidden-lg-and-up" @click.stop="toggleSongList()"></v-app-bar-nav-icon>

			<v-spacer></v-spacer>

			<v-scroll-x-transition hide-on-leave>
				<div v-show="!titleTransitioning" :class="['text-medium-emphasis', 'text-truncate', 'text-capitalize', viewportSize.xs ? 'text-subtitle-1' : 'text-h5']">
					{{ currentPage }}
				</div>
			</v-scroll-x-transition>
			<v-spacer></v-spacer>
			<v-toolbar-items class="hidden-sm-and-down">
				<v-btn v-for="route in routes" :key="route.name" variant="text" :to="route.link">
					<v-icon start>{{ route.icon }}</v-icon>
					<span class="hidden-xs-and-down">{{ route.name }}</span>
				</v-btn>
			</v-toolbar-items>

			<v-divider vertical inset></v-divider>

			<v-toolbar-items>
				<v-btn icon @click="toggleTheme">
					<v-icon>mdi-invert-colors</v-icon>
				</v-btn>
				<v-btn :icon="viewportSize.smAndDown" v-if="!userLogged" variant="text" @click="signIn">
					<v-icon :start="!viewportSize.smAndDown">mdi-login-variant</v-icon>
					<span class="hidden-sm-and-down">Sign In</span>
				</v-btn>
				<v-btn :icon="viewportSize.smAndDown" v-if="userLogged" variant="text" @click.stop="signOut">
					<v-icon :start="!viewportSize.smAndDown">mdi-logout-variant</v-icon>
					<span class="hidden-sm-and-down">Sign Out</span>
				</v-btn>
				<v-btn icon v-if="userLogged" to="/user">
					<v-icon :size="viewportSize.smAndDown ? 24 : 30">mdi-account-circle</v-icon>
				</v-btn>
			</v-toolbar-items>
		</v-app-bar>

		<v-bottom-navigation class="hidden-md-and-up" grow>
			<v-btn size="small" v-for="route in routes" :key="route.name" :to="route.link">
				<span class="hidden-xs-and-down">{{ route.name }}</span>
				<v-icon>{{ route.icon }}</v-icon>
			</v-btn>
		</v-bottom-navigation>
	</div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
	data() {
		return {
			routes: [
				{ name: "Browse songs", link: "/", icon: "mdi-magnify" },
				{
					name: "Play session",
					link: "/play-session",
					icon: "mdi-playlist-music-outline",
				},
				{
					name: "Add Song",
					link: "/add-song",
					icon: "mdi-plus-circle-outline",
				},
			],
			titleTransitioning: false,
		};
	},
	methods: {
		signOut() {
			this.$store.dispatch("logout").then(this.$router.push("/login").catch(() => {}));
		},
		signIn() {
			this.$router.push("/login").catch(() => {});
		},
		toggleSongList() {
			this.$store.commit("toggleSongListOpened");
		},
		toggleTheme() {
			this.$vuetify.theme.global.name = this.$vuetify.theme.global.current.dark ? "light" : "dark";
		},
	},
	computed: {
		...mapGetters({
			userLogged: "getUserLogged",
			user: "getUser",
			currentPage: "getCurrentPage",
		}),
	},

	watch: {
		currentPage: function() {
			this.titleTransitioning = true;
			setTimeout(() => {
				this.titleTransitioning = false;
			}, 120);
		},
	},
};
</script>

<style lang="scss" scoped>
.navigation {
	z-index: 100 !important;
}
</style>
