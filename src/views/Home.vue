<template>
	<div>
		<v-container>
			<v-row justify="center">
				<v-col cols="12" sm="6" :style="size.smAndUp ? { minWidth: 'clamp(0px, 800px, 100%)' } : {}">
					<p :class="['text--secondary text-center mb-5 mb-sm-10', size.smAndUp ? 'display-3' : 'display-1']" align-self>Browse Public Songs</p>
					<v-text-field v-model="filters.search" dense flat hide-details prepend-inner-icon="mdi-magnify" outlined></v-text-field>
					<v-toolbar class="elevation-0 my-3" height="40px" :color="$vuetify.theme.dark ? '#121212' : ''">
						<v-toolbar-items>
							<v-btn text :icon="size.xs" :color="filters.groupByAuthor ? '' : 'primary'" @click="filters.groupByAuthor = false">
								<v-icon left>mdi-music-note-outline</v-icon>
								<span class="d-none d-sm-flex">Songs</span>
							</v-btn>

							<v-btn text :icon="size.xs" :color="filters.groupByAuthor ? 'primary' : ''" @click="filters.groupByAuthor = true">
								<v-icon :left="size.smAndUp">mdi-account-outline</v-icon>
								<span class="d-none d-sm-flex">Authors</span>
							</v-btn>
						</v-toolbar-items>
						<v-spacer></v-spacer>
						<v-toolbar-items>
							<v-menu rounded="large" transition="slide-y-transition" bottom>
								<template v-slot:activator="{ on: onMenu }">
									<v-btn text v-on="{ ...onMenu }">
										<v-icon :left="size.smAndUp">mdi-sort-alphabetical-ascending</v-icon>Order by
										<!-- <v-icon>mdi-chevron-down</v-icon> -->
									</v-btn>
								</template>
								<v-list class="py-0">
									<v-list-item @click.stop="onSongsAlph">
										<v-list-item-title>Songs</v-list-item-title>
										<v-list-item-icon>
											<v-icon v-show="filters.songsAscOrder" :color="filters.orderOption == 0 ? 'primary' : ''">mdi-sort-alphabetical-ascending</v-icon>
											<v-icon v-show="!filters.songsAscOrder" :color="filters.orderOption == 0 ? 'primary' : ''">mdi-sort-alphabetical-descending</v-icon>
										</v-list-item-icon>
									</v-list-item>
									<v-list-item @click.stop="onAuthorsAlph">
										<v-list-item-title>Authors</v-list-item-title>
										<v-list-item-icon>
											<v-icon v-show="filters.authorsAscOrder" :color="filters.orderOption == 1 || filters.groupByAuthor ? 'primary' : ''">mdi-sort-alphabetical-ascending</v-icon>
											<v-icon v-show="!filters.authorsAscOrder" :color="filters.orderOption == 1 || filters.groupByAuthor ? 'primary' : ''">mdi-sort-alphabetical-descending</v-icon>
										</v-list-item-icon>
									</v-list-item>
									<v-list-item @click.stop="onSongsDate">
										<v-list-item-title>Date modified</v-list-item-title>
										<v-list-item-icon>
											<v-icon v-show="filters.songsDateOrder" :color="filters.orderOption == 2 ? 'primary' : ''">mdi-sort-calendar-ascending</v-icon>
											<v-icon v-show="!filters.songsDateOrder" :color="filters.orderOption == 2 ? 'primary' : ''">mdi-sort-calendar-descending</v-icon>
										</v-list-item-icon>
									</v-list-item>
								</v-list>
							</v-menu>
							<!-- <v-btn text>
									<v-icon>mdi-account-outline</v-icon>
									<v-icon>mdi-chevron-up</v-icon>
              </v-btn>-->
						</v-toolbar-items>
					</v-toolbar>
					<v-sheet class="elevation-1">
						<v-skeleton-loader v-show="publicSongListLoading" v-for="n in 5" :key="n" type="list-item-two-line"></v-skeleton-loader>

						<v-list v-if="!publicSongListLoading">
							<v-scroll-x-transition group hide-on-leave>
								<v-list-group class="d-none" key="group"></v-list-group>
								<v-list-item-group class="d-none" key="item-group"></v-list-item-group>
								<component :is="filters.groupByAuthor ? 'v-list-group' : 'v-list'" v-for="group in groupedSongs(filters)" :key="group.group" :prepend-icon="filters.groupByAuthor ? 'mdi-account-circle-outline' : ''">
									<template v-slot:activator v-if="filters.groupByAuthor">
										<v-list-item-title>{{ group.group }}</v-list-item-title>
									</template>
									<!-- <v-list-group v-for="(group) in groupedSongs(filters)" :key="group.group"> -->
									<v-scroll-x-transition group hide-on-leave>
										<!-- <template > -->
										<!-- <v-divider class="mx-3" :key="n" v-if="n !== 0"></v-divider> -->

										<v-list-item v-for="song in group.songs" :two-line="!filters.groupByAuthor" @click.stop="openSongDialog(song)" :key="song.id">
											<v-list-item-content>
												<v-list-item-title>{{ song.title }}</v-list-item-title>
												<v-list-item-subtitle v-if="!filters.groupByAuthor">{{ song.author }}</v-list-item-subtitle>
											</v-list-item-content>

											<v-tooltip top>
												<template v-slot:activator="{ on, attrs }">
													<div v-show="song.modifiedAt && size.smAndUp" class="mr-5" v-bind="attrs" v-on="on">
														<v-icon small class="mx-2">mdi-calendar-edit</v-icon>
														<span>{{ formatDate(song.modifiedAt) }}</span>
													</div>
												</template>
												<span>Last edit</span>
											</v-tooltip>

											<v-list-item-action>
												<v-tooltip top>
													<template v-slot:activator="{ on, attrs }">
														<v-fab-transition hide-on-leave>
															<v-btn v-if="!alreadyInCollection(song.id)" :disabled="!userLogged || alreadyInCollection(song.id)" fab x-small class="elevation-0 primary mt-1" v-bind="attrs" v-on="on" @click.stop.prevent="addToCollection(song)">
																<v-icon>mdi-plus</v-icon>
															</v-btn>
														</v-fab-transition>
													</template>
													<span>Add to collection</span>
												</v-tooltip>
												<v-fab-transition hide-on-leave>
													<v-btn icon v-if="alreadyInCollection(song.id)" :disabled="true">
														<v-icon color="primary">mdi-check</v-icon>
													</v-btn>
												</v-fab-transition>

												<!-- <v-menu rounded="large" transition="slide-y-transition" bottom>
                      <template v-slot:activator="{ on: onMenu }">
                        <v-btn icon @click.stop.prevent class="ml-2" large v-on="{ ...onMenu }">
                          <v-icon>mdi-dots-vertical</v-icon>
                        </v-btn>
                      </template>
                      <v-list class="py-0">
                        <v-list-item :to="'/edit-song/' + song.id">
                          <v-list-item-title>Edit</v-list-item-title>
                          <v-list-item-icon>
                            <v-icon>mdi-pencil-outline</v-icon>
                          </v-list-item-icon>
                        </v-list-item>
                        <v-list-item @click="deleteSong(song.id)">
                          <v-list-item-title>Delete</v-list-item-title>
                          <v-list-item-icon>
                            <v-icon>mdi-delete-outline</v-icon>
                          </v-list-item-icon>
                        </v-list-item>
                      </v-list>
                        </v-menu>-->
											</v-list-item-action>
										</v-list-item>
										<!-- </template> -->
									</v-scroll-x-transition>
								</component>
								<!-- </v-list-group> -->
							</v-scroll-x-transition>
						</v-list>
						<song-dialog v-model="dialogOpened" :song="loadedSong"></song-dialog>
					</v-sheet>
				</v-col>
			</v-row>
		</v-container>
	</div>

	<!-- <div class style="margin: auto; width: 100%">
    <div class="mt-12 search-form">
      <p class="text--secondary text-center display-3" align-self>Search for Title or Author</p>
      <v-text-field
        v-model="filters.search"
        dense
        flat
        hide-details
        prepend-inner-icon="mdi-magnify"
        outlined
      ></v-text-field>
    </div>
  </div>-->
</template>

<script>
import { mapGetters } from "vuex";
import SongDialog from "../components/Dialogs/SongDialog";
// @ is an alias to /src
export default {
	name: "Home",
	data() {
		return {
			filters: {
				search: "",
				groupByAuthor: false,
				songsAscOrder: false,
				authorsAscOrder: false,
				songsDateOrder: false,
				orderOption: 0,
			},

			dialogOpened: false,
			openedSong: undefined,
		};
	},
	methods: {
		formatDate(dateString) {
			let date = new Date(dateString);
			return this.$moment(date, "YYYY.MM.DD-h:m").fromNow();
		},
		openSongDialog(song) {
			this.dialogOpened = true;
			this.$store.dispatch("loadPublicSong", song);
		},
		addToCollection(song) {
			console.log(song);
			this.$store.dispatch("savePublicSongToUser", song);
		},

		onSongsAlph() {
			this.filters.songsAscOrder = !this.filters.songsAscOrder;
			this.filters.orderOption = 0;
		},
		onAuthorsAlph() {
			this.filters.authorsAscOrder = !this.filters.authorsAscOrder;
			this.filters.orderOption = 1;
		},

		onSongsDate() {
			this.filters.songsDateOrder = !this.filters.songsDateOrder;
			this.filters.orderOption = 2;
		},

		alreadyInCollection(publicSongId) {
			if (this.userLogged) {
				for (let i = 0; i < this.userSongs.length; i++) {
					const song = this.userSongs[i];
					if (song.id === publicSongId) {
						return true;
					}
				}
				return false;
			}
			return false;
		},
	},

	computed: {
		size() {
			return this.$vuetify.breakpoint;
		},

		showList() {
			return this.filteredPublicSongs.length > 0;
		},

		// groupedSongs() {
		//   let groups = {};
		//   if (this.filters.groupByAuthor) {
		//     this.filteredPublicSongs(this.filters).forEach((song) => {
		//       if (groups[song.author] == undefined) {
		//         groups[song.author] = [];
		//       }
		//       groups[song.author].push({ ...song, selected: false });
		//     });
		//   } else {
		//     groups.push({
		//       group: "",
		//       songs: this.filteredPublicSongs(this.filters),
		//     });
		//   }
		//   let groupsArray = [];

		//   for (let key in groups) {
		//     groupsArray.push({ group: key, songs: groups[key] });
		//   }
		//   return groupsArray.sort((a, b) => {
		//     if (a.group === "Favourite") return -1;
		//     if (b.group === "Favourite") return 1;
		//   });
		// },

		loadedSong() {
			return this.$store.getters.getLoadedSong;
		},

		...mapGetters({
			groupedSongs: "getFilteredPublicSongs",
			publicSongListLoading: "getPublicSongListLoading",
			//   loadedSong: "getLoadedSong",
			userLogged: "getUserLogged",
			userSongs: "getUserSongs",
		}),
	},

	components: {
		"song-dialog": SongDialog,
	},
	created() {
		this.$store.commit("setCurrentPage", "Browse Songs");
		this.$store.dispatch("loadPublicSongs");
	},
};
</script>

<style>
.search-form {
	width: 60%;
	/* position: relative; */
	/* top: 200px; */
	/* width: 100%; */
}
</style>
