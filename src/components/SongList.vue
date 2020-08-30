<template>
	<div>
		<v-navigation-drawer v-if="userLogged" v-model="opened" :permanent="drawerPermanent" :temporary="size.xs" app overflow clipped width="350">
			<!-- <div v-for="song in songs" :key="song.id" class="ma-3">
				<span>{{ song.title }}</span> <v-btn :to="'/song/' + song.id">Go to song</v-btn>
			</div> -->

			<v-list two-line subheader>
				<v-list-item><v-text-field v-model="filters.search" dense class="ma-1 mt-3" flat hide-details append-icon="mdi-magnify" outlined></v-text-field></v-list-item>
				<v-subheader>Collection</v-subheader>
				<v-skeleton-loader v-show="songListLoading" v-for="n in 3" :key="n" height="50" type="list-item-two-line"> </v-skeleton-loader>
				<v-scroll-x-transition group>
					<v-list-item v-for="song in filteredSongs(filters)" :key="song.id" router :to="'/song/' + song.id">
						<v-list-item-content>
							<v-list-item-title>{{ song.title }}</v-list-item-title>
							<v-list-item-subtitle>{{ song.author }}</v-list-item-subtitle>
						</v-list-item-content>
						<v-list-item-action>
							<v-btn small icon @click.stop.prevent="" :to="'/edit-song/' + song.id">
								<v-icon>mdi-pencil-outline</v-icon>
							</v-btn>
						</v-list-item-action>
					</v-list-item>
				</v-scroll-x-transition>
			</v-list>
		</v-navigation-drawer>
	</div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
	data() {
		return {
			filters: {
				search: "",
			},
		};
	},
	methods: {
		// editSong(id) {
		// 	this.$router.push();
		// 	// this.$store.commit("deleteSong", id);
		// },
	},
	computed: {
		size() {
			return this.$vuetify.breakpoint;
		},
		drawerPermanent() {
			return this.size.lgAndUp && this.userLogged;
		},
		opened: {
			get() {
				return this.openedStore && this.userLogged;
			},
			set(val) {
				this.$store.commit("setSongListOpened", val);
			},
		},

		...mapGetters({
			userLogged: "getUserLogged",
			openedStore: "getSongListOpened",
			songs: "getSongs",
			filteredSongs: "getFilteredSongs",
			songListLoading: "getSongListLoading",
		}),
	},
};
</script>

<style lang="scss" scoped></style>
