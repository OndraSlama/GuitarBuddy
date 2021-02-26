<template>
	<div>
		<v-navigation-drawer v-if="userLogged" v-model="opened" :permanent="drawerPermanent" :temporary="viewportSize.xs" app overflow clipped width="350">
			<!-- <div v-for="song in songs" :key="song.id" class="ma-3">
				<span>{{ song.title }}</span> <v-btn :to="'/song/' + song.id">Go to song</v-btn>
        

      </div>-->
			<v-row class="ma-3 mt-3">
				<v-text-field v-model="filters.search" dense flat hide-details prepend-inner-icon="mdi-magnify" outlined></v-text-field>

				<v-tooltip top>
					<template v-slot:activator="{ on, attrs }">
						<v-btn v-bind="attrs" v-on="on" @click="filters.groupBy = filters.groupBy == 'favourite' ? 'author' : 'favourite'" icon large class="ml-1" :disabled="filters.groupBy == 'songbook'">
							<v-icon v-if="filters.groupBy == 'author'">mdi-playlist-star</v-icon>
							<v-icon v-else>mdi-account-details-outline</v-icon>
						</v-btn>
					</template>
					<span v-if="filters.groupBy == 'author'">Group by favourite</span>
					<span v-else>Group by author</span>
				</v-tooltip>
			</v-row>
			<!----------------------------------- Order by menu ----------------------------------->
			<v-toolbar class="elevation-0 mt-n3" height="40px" :color="$vuetify.theme.dark ? '#363636' : ''">
				<v-menu rounded="large" transition="slide-y-transition" bottom>
					<template v-slot:activator="{ on: onMenu }">
						<v-btn text v-on="{ ...onMenu }" class="ml-n3">
							<v-icon left>mdi-sort-alphabetical-ascending</v-icon>Order by
							<!-- <v-icon>mdi-chevron-down</v-icon> -->
						</v-btn>
					</template>
					<v-list class="py-0">
						<v-list-item @click.stop="onTitleName">
							<v-list-item-title>Delete</v-list-item-title>
							<v-list-item-icon>
								<v-icon v-show="filters.titleNameOrder" :color="filters.orderBy == 'titleName' ? 'primary' : ''">mdi-sort-alphabetical-descending</v-icon>
								<v-icon v-show="!filters.titleNameOrder" :color="filters.orderBy == 'titleName' ? 'primary' : ''">mdi-sort-alphabetical-ascending</v-icon>
							</v-list-item-icon>
						</v-list-item>
						<v-list-item @click.stop="onAuthorName">
							<v-list-item-title>Authors</v-list-item-title>
							<v-list-item-icon>
								<v-icon v-show="filters.authorNameOrder" :color="filters.orderBy == 'authorName' || filters.groupBy == 'author' ? 'primary' : ''">mdi-sort-alphabetical-descending</v-icon>
								<v-icon v-show="!filters.authorNameOrder" :color="filters.orderBy == 'authorName' || filters.groupBy == 'author' ? 'primary' : ''">mdi-sort-alphabetical-ascending</v-icon>
							</v-list-item-icon>
						</v-list-item>
						<v-list-item @click.stop="onDateModified">
							<v-list-item-title>Date modified</v-list-item-title>
							<v-list-item-icon>
								<v-icon v-show="filters.modifiedDateOrder" :color="filters.orderBy == 'dateModified' ? 'primary' : ''">mdi-sort-calendar-descending</v-icon>
								<v-icon v-show="!filters.modifiedDateOrder" :color="filters.orderBy == 'dateModified' ? 'primary' : ''">mdi-sort-calendar-ascending</v-icon>
							</v-list-item-icon>
						</v-list-item>
						<v-list-item @click.stop="onDateCreated">
							<v-list-item-title>Date created</v-list-item-title>
							<v-list-item-icon>
								<v-icon v-show="filters.createdDateOrder" :color="filters.orderBy == 'dateCreated' ? 'primary' : ''">mdi-sort-calendar-descending</v-icon>
								<v-icon v-show="!filters.createdDateOrder" :color="filters.orderBy == 'dateCreated' ? 'primary' : ''">mdi-sort-calendar-ascending</v-icon>
							</v-list-item-icon>
						</v-list-item>
					</v-list>
				</v-menu>

				<!----------------------------------- Select toolbar ----------------------------------->
				<v-scroll-x-reverse-transition hide-on-leave>
					<div v-if="!toggleSelectionTransition">
						<v-btn text @click="toggleSelection" key="selectButton">
							<v-icon left v-if="!selectionEnabled">mdi-format-list-bulleted</v-icon>
							<v-icon left v-else>mdi-playlist-remove</v-icon>
							<span v-if="!selectionEnabled">Select...</span>
							<span v-else>Cancel</span>
						</v-btn>
						<v-menu v-if="selectionEnabled" rounded="large" transition="slide-y-transition" bottom>
							<template v-slot:activator="{ on: onMenu }">
								<v-btn icon v-on="{ ...onMenu }" class="ml-n2">
									<!-- <span>Act</span> -->
									<v-icon>mdi-dots-vertical</v-icon>
									<!-- <v-icon>mdi-chevron-down</v-icon> -->
								</v-btn>
							</template>
							<v-list class="py-0">
								<v-list-item @click.stop="askIfDeleteSongs">
									<v-list-item-title>Delete Selected</v-list-item-title>
									<v-list-item-icon>
										<v-icon>mdi-delete-outline</v-icon>
									</v-list-item-icon>
								</v-list-item>
								<v-list-item @click.stop="askToSelectSongbook('add-selected')">
									<v-list-item-title>Add Selected to Songbook</v-list-item-title>
									<v-list-item-icon>
										<v-icon>mdi-playlist-music-outline</v-icon>
									</v-list-item-icon>
								</v-list-item>
								<v-list-item @click.stop="askToSelectSongbook('remove-selected')" v-if="filters.groupBy == 'songbook'">
									<v-list-item-title>Remove Selected from Songbook</v-list-item-title>
									<v-list-item-icon>
										<v-icon>mdi-playlist-remove</v-icon>
									</v-list-item-icon>
								</v-list-item>
								<v-list-item @click.stop="setFavouriteSelected(true)">
									<v-list-item-title>Add to Favourites</v-list-item-title>
									<v-list-item-icon>
										<v-icon>mdi-star</v-icon>
									</v-list-item-icon>
								</v-list-item>
								<v-list-item @click.stop="setFavouriteSelected(false)">
									<v-list-item-title>Remove from Favourites</v-list-item-title>
									<v-list-item-icon>
										<v-icon>mdi-star-outline</v-icon>
									</v-list-item-icon>
								</v-list-item>
							</v-list>
						</v-menu>
					</div>
				</v-scroll-x-reverse-transition>
			</v-toolbar>

			<!-- <v-scroll-x-reverse-transition hide-on-leave>
				<v-toolbar v-if="false" class="elevation-0" height="40px" :color="$vuetify.theme.dark ? '#363636' : ''">
					<v-btn icon :key="'playlist'">
						<v-icon>mdi-playlist-music-outline</v-icon>
					</v-btn>
					<v-btn icon :key="'delete'" @click="askIfDeleteSongs">
						<v-icon>mdi-delete-outline</v-icon>
					</v-btn>
					<v-btn icon :key="'favourite'" @click="setFavouriteSelected">
						<v-icon>mdi-star-outline</v-icon>
					</v-btn>
					<v-btn icon :key="'unfavourite'" @click="setFavouriteSelected">
						<v-icon>mdi-star</v-icon>
					</v-btn>
				</v-toolbar>
			</v-scroll-x-reverse-transition> -->

			<!-- <v-sheet class="mx-3">
				<v-switch v-model="filters.groupBy == 'author'" inset label="Group by author"></v-switch>
      </v-sheet>-->

			<v-tabs v-model="tab" background-color="transparent" grow>
				<v-tab @click="changeGroup('favourite')">
					Collection
				</v-tab>
				<v-tab @click="changeGroup('songbook')">
					Song Books
				</v-tab>
			</v-tabs>
			<v-list expand>
				<v-skeleton-loader v-show="songListLoading" v-for="n in 3" :key="n" height="50" type="list-item-two-line"></v-skeleton-loader>
				<v-scroll-y-transition group hide-on-leave>
					<v-list-group v-for="group in groupedSongs(filters)" :key="group.group">
						<template v-slot:activator>
							<v-list-item-title>
								<div class="d-flex" :style="{ 'min-width': '200px' }">
									<div v-if="!selectionEnabled" class="align-self-center">
										<v-icon v-if="filters.groupBy == 'songbook'" class="mr-3">mdi-playlist-music-outline</v-icon>
										<v-icon v-else-if="filters.groupBy == 'author'" class="mr-3">mdi-account-circle-outline</v-icon>
										<v-icon v-else-if="group.group == 'Collection'" class="mr-3">mdi-playlist-music-outline</v-icon>
										<v-icon v-else class="mr-3">mdi-star-outline</v-icon>
									</div>
									<div v-if="selectionEnabled" class="align-self-center">
										<v-fab-transition hide-on-leave>
											<v-checkbox class="mt-n1 mb-n5 mr-2" v-model="groupSelection[group.group]" @click.stop.prevent="onGroupSelect(group.group)" v-if="selectionEnabled"></v-checkbox>
										</v-fab-transition>
									</div>

									<div class="align-self-center text-truncate">
										{{ group.group ? group.group : "Unknown" }}
									</div>

									<div class="ml-auto" v-if="filters.groupBy == 'songbook'">
										<v-btn icon @click.stop="askForSongBookName(group.group)">
											<v-icon>mdi-pencil-outline</v-icon>
										</v-btn>
										<v-btn icon @click.stop="askIfDeleteSongBook(group.group)" class="ml-2">
											<v-icon>mdi-delete-outline</v-icon>
										</v-btn>
										<!-- 
											<v-menu rounded="large" transition="slide-y-transition" bottom>
												<template v-slot:activator="{ on: onMenu }">
													<v-btn icon v-on="{ ...onMenu }" class="ml-n2">
														<v-icon>mdi-dots-vertical</v-icon>
													</v-btn>
												</template>
												<v-list class="py-0">
													<v-list-item @click.stop="">
														<v-list-item-title>Delete Selected</v-list-item-title>
														<v-list-item-icon>
															<v-icon>mdi-delete-outline</v-icon>
														</v-list-item-icon>
													</v-list-item>
												</v-list>
											</v-menu>
										-->
									</div>
								</div>
							</v-list-item-title>
						</template>
						<v-scroll-y-transition group hide-on-leave>
							<v-list-item v-for="song in group.songs" :key="song.id" router :style="filters.groupBy == 'author' ? 'maxHeight: 40px' : 'maxHeight: 80px'" :to="'/song/' + song.id">
								<v-fab-transition hide-on-leave>
									<v-list-item-action class="mr-4" v-if="selectionEnabled">
										<v-checkbox v-model="selection[song.id]" @click.stop.prevent="onSongSelect(group)"></v-checkbox>
									</v-list-item-action>
								</v-fab-transition>
								<v-list-item-content :class="selectionEnabled ? 'ml-0' : 'ml-4'">
									<v-list-item-title>
										<v-tooltip top>
											<template v-slot:activator="{ on, attrs }">
												<v-fab-transition>
													<v-icon v-show="song.input.public" small color="grey" v-bind="attrs" v-on="on">mdi-earth</v-icon>
												</v-fab-transition>
											</template>
											<span>This song is public</span>
										</v-tooltip>
										<v-tooltip top>
											<template v-slot:activator="{ on, attrs }">
												<v-fab-transition>
													<v-icon v-show="song.createdBy !== user.uid" small v-bind="attrs" v-on="on">mdi-bookmark-plus-outline</v-icon>
												</v-fab-transition>
											</template>
											<span>This song was not created by you</span>
										</v-tooltip>
										{{ song.title }}
									</v-list-item-title>
									<v-list-item-subtitle v-if="!(filters.groupBy == 'author')">{{ song.author }}</v-list-item-subtitle>
								</v-list-item-content>

								<v-list-item-action class="mr-n6">
									<v-btn icon @click.prevent.stop="toggleFavourite(song.id, song.favourite)">
										<v-icon v-if="!song.favourite" color="grey lighten-1">mdi-star-outline</v-icon>

										<v-icon v-else color="yellow">mdi-star</v-icon>
									</v-btn>
								</v-list-item-action>

								<v-list-item-action>
									<v-menu rounded="large" transition="slide-y-transition" bottom>
										<template v-slot:activator="{ on: onMenu }">
											<v-btn icon @click.stop.prevent class="ml-2" large v-on="{ ...onMenu }">
												<v-icon>mdi-dots-vertical</v-icon>
											</v-btn>
										</template>
										<v-list class="py-0">
											<v-list-item @click.stop="askIfEditSong(song)">
												<v-list-item-title>Edit</v-list-item-title>
												<v-list-item-icon>
													<v-icon>mdi-pencil-outline</v-icon>
												</v-list-item-icon>
											</v-list-item>
											<v-list-item @click.stop="askIfDeleteSong(song)">
												<v-list-item-title>Delete</v-list-item-title>
												<v-list-item-icon>
													<v-icon>mdi-delete-outline</v-icon>
												</v-list-item-icon>
											</v-list-item>
											<v-list-item @click.stop="askToSelectSongbook('add', song)">
												<v-list-item-title>Add To Songbook</v-list-item-title>
												<v-list-item-icon>
													<v-icon>mdi-playlist-music-outline</v-icon>
												</v-list-item-icon>
											</v-list-item>
											<v-list-item @click.stop="removeFromSongbook(song, group.group)" v-if="filters.groupBy == 'songbook'">
												<v-list-item-title>Remove from Songbook</v-list-item-title>
												<v-list-item-icon>
													<v-icon>mdi-playlist-remove</v-icon>
												</v-list-item-icon>
											</v-list-item>
										</v-list>
									</v-menu>
								</v-list-item-action>
							</v-list-item>
						</v-scroll-y-transition>
						<v-divider class="mx-4"></v-divider>
					</v-list-group>
				</v-scroll-y-transition>
				<!-- <div class="d-flex justify-space-around mt-3 thin-border"> -->
			</v-list>
			<v-fab-transition>
				<v-btn fab class="primary elevation-3" @click="floatButtonAction" absolute :style="{ bottom: '20px', right: '20px' }" :key="filters.groupBy">
					<v-icon>{{ filters.groupBy == "songbook" ? "mdi-folder-plus-outline" : "mdi-music-note-plus" }}</v-icon>
				</v-btn>
			</v-fab-transition>
			<!-- </div> -->
		</v-navigation-drawer>

		<!----------------------------------- Dialogs ----------------------------------->
		<edit-public-song-dialog v-model="editPublicSongDialogOpened" v-on:accept="editPublicSong(currentSong)" />
		<delete-dialog v-model="deleteSongDialogOpened" v-on:accept="deleteSong(currentSong.id)" />
		<delete-dialog v-model="deleteSongsDialogOpened" v-on:accept="deleteSelected()" />
		<general-dialog v-model="deleteSongBookDialogOpened" v-on:accept="deleteSongBook(currentSongbook)" title="Deleting a song book" :text="'Are you sure you want to delete \'' + currentSongbook + '\'? Songs inside this song book will not be deleted.'" acceptButton="Yes, delete" />
		<add-songbook-dialog v-model="addSongBookDialogOpened" v-on:accept="addSongBook" />
		<add-songbook-dialog
			v-model="changeSongBookNameDialogOpened"
			:defaultSongBookName="currentSongbook"
			v-on:accept="
				(newName) => {
					changeSongBookName(currentSongbook, newName);
				}
			"
		/>
		<select-songbook-dialog
			v-model="selectSongbookDialogOpened"
			@onSelected="
				(songbook) => {
					runSongbookAction(songbook, songbookAction);
				}
			"
		/>
	</div>
</template>

<script>
import { mapGetters } from "vuex";
import filtersBase from "../mixins/songFiltersBase";
import SongbookNameDialog from "../components/Dialogs/SongbookNameDialog";
export default {
	mixins: [filtersBase],
	data() {
		return {
			selectionEnabled: false,
			currentSong: undefined,
			currentSongbook: undefined,
			songbookAction: undefined,
			tab: null,
			selection: {},
			groupSelection: {},
			toggleSelectionTransition: false,
			changingGroupsTransition: false,
			editPublicSongDialogOpened: false,
			deleteSongBookDialogOpened: false,
			deleteSongDialogOpened: false,
			deleteSongsDialogOpened: false,
			selectSongbookDialogOpened: false,
			changeSongBookNameDialogOpened: false,
			addSongBookDialogOpened: false,
		};
	},
	methods: {
		floatButtonAction() {
			if (this.filters.groupBy == "songbook") {
				this.addSongBookDialogOpened = true;
			} else {
				this.$router.push("/add-song/");
			}
		},
		toggleSelection() {
			this.selectionEnabled = !this.selectionEnabled;
			if (!this.selectionEnabled) {
				this.selection = {};
				this.groupSelection = {};
			}
			this.toggleSelectionTransition = true;
			setTimeout(() => {
				this.toggleSelectionTransition = false;
			}, 80);
		},

		changeGroup(group) {
			this.filters.groupBy = group;

			this.changingGroupsTransition = true;
			setTimeout(() => {
				this.changingGroupsTransition = false;
			}, 80);
		},
		addSongBook(name) {
			this.$store.dispatch("addSongBook", name);
		},
		askForSongBookName(songbook) {
			if (this.userLogged) {
				this.changeSongBookNameDialogOpened = true;
				this.currentSongbook = songbook;
			}
		},
		changeSongBookName(currentSongbook, newName) {
			this.$store.dispatch("changeSongBookName", { old: currentSongbook, new: newName });
		},
		askIfDeleteSongBook(songbook) {
			if (this.userLogged) {
				this.deleteSongBookDialogOpened = true;
				this.currentSongbook = songbook;
			}
		},
		deleteSongBook(name) {
			this.$store.dispatch("deleteSongBook", name);
		},
		onGroupSelect(groupName) {
			this.groupedSongs(this.filters).forEach((group) => {
				if (group.group === groupName) {
					group.songs.forEach((song) => {
						this.$set(this.selection, song.id, this.groupSelection[groupName]);
					});
				}
			});
		},

		onSongSelect(group) {
			let groupName = group.group;
			let everythingSelected = true;
			let everythingUnselected = true;
			//   if (this.groupSelection[groupName] === undefined) {
			//     console.log("undefined");
			//     this.groupSelection[groupName] = false;
			//   }

			for (var song of group.songs) {
				if (this.selection[song.id] === undefined) {
					everythingSelected = false;
					everythingUnselected = false;
				} else if (this.selection[song.id] === false) {
					everythingSelected = false;
				} else {
					everythingUnselected = false;
				}
			}

			if (everythingSelected) {
				this.groupSelection[groupName] = true;
			} else if (everythingUnselected) {
				this.groupSelection[groupName] = false;
			}
		},

		askIfEditSong(song) {
			if (this.userLogged) {
				if (this.user.uid !== song.createdBy) {
					this.editPublicSongDialogOpened = true;
					this.currentSong = song;
				} else {
					this.editSong(song);
				}
			}
		},

		editPublicSong(song) {
			this.$store.dispatch("addSong", song).then((newSongId) => {
				this.$router.push("/edit-song/" + newSongId);
				this.$store.dispatch("deleteSong", song.id);
			});
		},

		editSong(song) {
			this.$router.push("/edit-song/" + song.id);
		},

		askIfDeleteSong(song) {
			if (this.userLogged) {
				if (this.user.uid === song.createdBy) {
					this.deleteSongDialogOpened = true;
					this.currentSong = song;
				} else {
					this.deleteSong(song.id);
				}
			}
		},

		askToSelectSongbook(action, song = undefined) {
			this.selectSongbookDialogOpened = true;
			this.songbookAction = action;
			this.currentSong = song;
		},

		deleteSong(songId) {
			this.$store.dispatch("deleteSong", songId);
		},

		runSongbookAction(songbook, action) {
			console.log(this.currentSong, songbook, action);
			switch (action) {
				case "add":
					this.$store.dispatch("addSongToSongbook", { id: this.currentSong.id, songbook: songbook });
					break;

				case "add-selected":
					for (let key in this.selection) {
						if (this.selection[key] === true) {
							this.$store.dispatch("addSongToSongbook", { id: key, songbook: songbook });
						}
					}
					break;

				case "remove-selected":
					for (let key in this.selection) {
						if (this.selection[key] === true) {
							this.$store.dispatch("removeSongFromSongbook", { id: key, songbook: songbook });
						}
					}
					break;

				default:
					break;
			}
		},

		removeFromSongbook(song, songbook) {
			this.$store.dispatch("removeSongFromSongbook", { id: song.id, songbook: songbook });
		},

		askIfDeleteSongs() {
			if (Object.keys(this.selection).length > 0) {
				this.deleteSongsDialogOpened = true;
			}
		},

		deleteSelected() {
			for (let key in this.selection) {
				if (this.selection[key] === true) {
					this.deleteSong(key);
				}
			}
		},

		setFavouriteSelected(flag) {
			for (let key in this.selection) {
				if (this.selection[key] === true) {
					this.toggleFavourite(key, !flag);
				}
			}
		},

		toggleFavourite(songId, currentFavourite) {
			this.$store.dispatch("setFavourite", {
				id: songId,
				value: !currentFavourite,
			});
		},
	},
	computed: {
		scrollbarTheme() {
			return this.$vuetify.theme.dark ? "dark" : "light";
		},
		drawerPermanent() {
			return this.viewportSize.lgAndUp && this.userLogged;
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
			user: "getUser",
			openedStore: "getSongListOpened",
			songs: "getUserSongs",
			groupedSongs: "getFilteredUserSongs",
			songListLoading: "getSongListLoading",
		}),
	},

	components: {
		"add-songbook-dialog": SongbookNameDialog,
	},
};
</script>

<style lang="scss" scoped></style>
