<template>
	<div>
		<v-app-bar clipped-left flat app :dense="viewportSize.xs" :hide-on-scroll="viewportSize.smAndDown" class="navbar">
			<v-app-bar-nav-icon v-if="userLogged" class="hidden-lg-and-up" @click.stop="toggleSongList()"></v-app-bar-nav-icon>

			<v-toolbar-title @click="$router.push('/')" class="hidden-sm-and-down">Guitar Buddy</v-toolbar-title>
			<v-spacer></v-spacer>

			<v-scroll-x-transition hide-on-leave>
				<div v-show="!titleTransitioning" :class="['text--secondary', 'text-truncate', 'text-capitalize', viewportSize.xs ? 'text-subtitle-1' : 'text-h5']">
					{{ currentPage }}
				</div>
			</v-scroll-x-transition>
			<v-spacer></v-spacer>
			<v-toolbar-items class="hidden-sm-and-down">
				<v-btn :v-show="viewportSize.smAndUp" v-for="route in routes" :key="route.name" text :to="route.link">
					<v-icon :left="!viewportSize.xsAndDown">{{ route.icon }}</v-icon>
					<span class="hidden-xs-and-down">{{ route.name }}</span>
				</v-btn>
			</v-toolbar-items>

			<v-divider vertical inset></v-divider>

			<!-- <v-spacer></v-spacer> -->

			<v-toolbar-items>
				<v-btn icon @click="$vuetify.theme.dark = !$vuetify.theme.dark">
					<v-icon>mdi-invert-colors</v-icon>
				</v-btn>
				<v-btn :icon ="viewportSize.smAndDown" v-if="!userLogged" text @click="signIn">
					<v-icon :left ="viewportSize.smAndDown">mdi-login-variant</v-icon>
					<span class="hidden-sm-and-down">Sign In</span>
				</v-btn>
				<!-- <login-dialog></login-dialog> -->
				<v-btn :icon ="viewportSize.smAndDown" v-if="userLogged" text @click.stop="signOut">
					<v-icon :left="viewportSize.smAndDown">mdi-login-variant</v-icon>
					<span class="hidden-sm-and-down">Sign Out</span>
				</v-btn>
				<v-btn icon v-if="userLogged" to="/user">
					<img :style="{ 'width': viewportSize.smAndDown ? '35px' : '45px', 'height': viewportSize.smAndDown ? '35px' : '45px', 'border-radius': '50%' }" :src="user.photoURL" :alt="user.displayName" />
				</v-btn>
			</v-toolbar-items>
		</v-app-bar>

		<v-bottom-navigation class="hidden-md-and-up" fixed grow>
			<v-btn small :v-show="viewportSize.smAndUp" v-for="route in routes" :key="route.name" text :to="route.link">
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
					name: "My Songs",
					link: "/song-book",
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
			//   this.$store.commit("setDialogOpened", true);
			this.$router.push("/login").catch(() => {});
		},
		toggleSongList() {
			this.$store.commit("toggleSongListOpened");
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
	/* position:static !important; */
	z-index: 100 !important;
}
</style>
