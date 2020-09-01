<template>
	<div>
		<v-navigation-drawer v-if="userLogged" v-model="opened" :permanent="drawerPermanent" :temporary="size.xs" app overflow clipped width="350">
			<!-- <div v-for="song in songs" :key="song.id" class="ma-3">
				<span>{{ song.title }}</span> <v-btn :to="'/song/' + song.id">Go to song</v-btn>
			</div> -->
			<v-row class="ma-3 mt-3">
				<v-text-field v-model="filters.search" dense flat hide-details prepend-inner-icon="mdi-magnify" outlined></v-text-field>

				<v-tooltip top>
					<template v-slot:activator="{ on, attrs }">
						<v-btn v-bind="attrs" v-on="on" @click="goupByAuthor = !goupByAuthor" icon large class="ml-1">
							<v-icon v-if="goupByAuthor">mdi-account-details-outline</v-icon>
							<v-icon v-if="!goupByAuthor">mdi-format-list-bulleted</v-icon>
						</v-btn>
					</template>
					<span v-if="!goupByAuthor">Group by author</span>
					<span v-if="goupByAuthor">Ungroup</span>
				</v-tooltip>
			</v-row>
			<!-- <v-sheet class="mx-3">
				<v-switch v-model="goupByAuthor" inset label="Group by author"></v-switch>
			</v-sheet> -->

			<v-list subheader>
				<!-- <v-list-item></v-list-item> -->

				<v-skeleton-loader v-show="songListLoading" v-for="n in 3" :key="n" height="50" type="list-item-two-line"> </v-skeleton-loader>
				<v-scroll-y-transition group hide-on-leave>
					<v-list-item-group v-for="(group, key) in groupedSongs" :key="key">
						<v-divider></v-divider>
						<v-subheader><v-checkbox v-if="selection"></v-checkbox> {{ key }}</v-subheader>
						<v-scroll-y-transition group hide-on-leave>
							<v-list-item v-for="song in group" :key="song.id" router :to="'/song/' + song.id">
								<v-list-item-action v-if="selection">
									<v-checkbox @click.stop.prevent=""></v-checkbox>
								</v-list-item-action>
								<v-list-item-content>
									<v-list-item-title>{{ song.title }}</v-list-item-title>
									<v-list-item-subtitle v-if="!goupByAuthor">{{ song.author }}</v-list-item-subtitle>
								</v-list-item-content>
								<v-list-item-action>
									<v-btn small icon @click.stop.prevent="" :to="'/edit-song/' + song.id">
										<v-icon>mdi-pencil-outline</v-icon>
									</v-btn>
								</v-list-item-action>
							</v-list-item>
						</v-scroll-y-transition>
					</v-list-item-group>
				</v-scroll-y-transition>
			</v-list>
		</v-navigation-drawer>
	</div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
	data() {
		return {
			selection: false,
			goupByAuthor: false,
			filters: {
				search: "",
			},
		};
	},
	methods: {},
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

		groupedSongs() {
			let groups = {};
			if (this.goupByAuthor) {
				this.filteredSongs(this.filters).forEach((song) => {
					if (groups[song.author] == undefined) {
						groups[song.author] = [];
					}
					groups[song.author].push(song);
				});
			} else {
				groups = {
					Collection: this.filteredSongs(this.filters),
				};
			}

			return groups;
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
