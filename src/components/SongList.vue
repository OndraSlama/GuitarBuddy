<template>
	<div>
		<v-navigation-drawer v-if="userLogged" v-model="opened" :permanent="drawerPermanent" :temporary="viewportSize.xs" :width="viewportSize.smAndUp ? 450 : 350">
			<!----------------------------------- Filters / selection / tabs ----------------------------------->
			<v-container :style="{ position: 'fixed', 'z-index': '1', 'background-color': 'rgb(var(--v-theme-surface))' }">
				<v-row class="ma-3 mt-3">
					<v-text-field v-model="filters.search" density="compact" hide-details prepend-inner-icon="mdi-magnify" variant="outlined"></v-text-field>
				</v-row>
				<!----------------------------------- Order by menu ----------------------------------->
				<v-toolbar class="elevation-0 mt-n3" height="40" color="transparent">
					<v-menu transition="slide-y-transition" location="bottom">
						<template v-slot:activator="{ props: menuProps }">
							<v-btn variant="text" :icon="viewportSize.xs" v-bind="menuProps">
								<v-icon :start="viewportSize.smAndUp">mdi-sort-alphabetical-ascending</v-icon>
								<span v-if="viewportSize.smAndUp"> Order by </span>
							</v-btn>
						</template>
						<v-list class="py-0">
							<v-list-subheader>SONG ORDER</v-list-subheader>
							<v-list-item @click.stop="onTitleName">
								<template v-slot:prepend>
									<v-icon :color="filters.orderBy == 'titleName' ? 'primary' : ''">mdi-music-note-outline</v-icon>
								</template>
								<v-list-item-title>Songs</v-list-item-title>
								<template v-slot:append>
									<v-icon v-show="filters.orderBy == 'titleName' && filters.titleNameOrder" color="primary">mdi-chevron-up</v-icon>
									<v-icon v-show="filters.orderBy == 'titleName' && !filters.titleNameOrder" color="primary">mdi-chevron-down</v-icon>
								</template>
							</v-list-item>
							<v-list-item @click.stop="onAuthorName" :disabled="filters.groupBy == 'author'">
								<template v-slot:prepend>
									<v-icon :disabled="filters.groupBy == 'author'" :color="filters.orderBy == 'authorName' ? 'primary' : ''">mdi-account-outline</v-icon>
								</template>
								<v-list-item-title>Authors</v-list-item-title>
								<template v-slot:append>
									<v-icon v-show="filters.orderBy == 'authorName' && filters.authorNameOrder" :disabled="filters.groupBy == 'author'" color="primary">mdi-chevron-up</v-icon>
									<v-icon v-show="filters.orderBy == 'authorName' && !filters.authorNameOrder" :disabled="filters.groupBy == 'author'" color="primary">mdi-chevron-down</v-icon>
								</template>
							</v-list-item>
							<v-list-item @click.stop="onLastViewed">
								<template v-slot:prepend>
									<v-icon :color="filters.orderBy == 'lastViewed' ? 'primary' : ''">mdi-eye-outline</v-icon>
								</template>
								<v-list-item-title>Last Viewed</v-list-item-title>
								<template v-slot:append>
									<v-icon v-show="filters.orderBy == 'lastViewed' && filters.lastViewedOrder" color="primary">mdi-chevron-down</v-icon>
									<v-icon v-show="filters.orderBy == 'lastViewed' && !filters.lastViewedOrder" color="primary">mdi-chevron-up</v-icon>
								</template>
							</v-list-item>
							<v-list-item @click.stop="onDateModified">
								<template v-slot:prepend>
									<v-icon :color="filters.orderBy == 'dateModified' ? 'primary' : ''">mdi-calendar-edit</v-icon>
								</template>
								<v-list-item-title>Date modified</v-list-item-title>
								<template v-slot:append>
									<v-icon v-show="filters.orderBy == 'dateModified' && filters.modifiedDateOrder" color="primary">mdi-chevron-down</v-icon>
									<v-icon v-show="filters.orderBy == 'dateModified' && !filters.modifiedDateOrder" color="primary">mdi-chevron-up</v-icon>
								</template>
							</v-list-item>
							<v-list-item @click.stop="onDateCreated">
								<template v-slot:prepend>
									<v-icon :color="filters.orderBy == 'dateCreated' ? 'primary' : ''">mdi-calendar-plus</v-icon>
								</template>
								<v-list-item-title>Date created</v-list-item-title>
								<template v-slot:append>
									<v-icon v-show="filters.orderBy == 'dateCreated' && filters.createdDateOrder" color="primary">mdi-chevron-down</v-icon>
									<v-icon v-show="filters.orderBy == 'dateCreated' && !filters.createdDateOrder" color="primary">mdi-chevron-up</v-icon>
								</template>
							</v-list-item>

							<v-list-subheader>GROUP ORDER</v-list-subheader>
							<v-list-item @click.stop="onGroupName">
								<template v-slot:prepend>
									<v-icon :color="filters.orderGroupBy == 'name' ? 'primary' : ''">mdi-group</v-icon>
								</template>
								<v-list-item-title>Name</v-list-item-title>
								<template v-slot:append>
									<v-icon v-show="filters.orderGroupBy == 'name' && filters.groupNameOrder" color="primary">mdi-chevron-up</v-icon>
									<v-icon v-show="filters.orderGroupBy == 'name' && !filters.groupNameOrder" color="primary">mdi-chevron-down</v-icon>
								</template>
							</v-list-item>

							<v-list-item @click.stop="onGroupSize">
								<template v-slot:prepend>
									<v-icon :color="filters.orderGroupBy == 'size' ? 'primary' : ''">mdi-group</v-icon>
								</template>
								<v-list-item-title>Size</v-list-item-title>
								<template v-slot:append>
									<v-icon v-show="filters.orderGroupBy == 'size' && filters.groupSizeOrder" color="primary">mdi-chevron-up</v-icon>
									<v-icon v-show="filters.orderGroupBy == 'size' && !filters.groupSizeOrder" color="primary">mdi-chevron-down</v-icon>
								</template>
							</v-list-item>
						</v-list>
					</v-menu>

					<!----------------------------------- Group by menu ----------------------------------->
					<v-menu transition="slide-y-transition" location="bottom">
						<template v-slot:activator="{ props: menuProps }">
							<v-btn variant="text" :icon="viewportSize.xs" v-bind="menuProps" :disabled="filters.groupBy == 'songbook'">
								<v-icon :start="viewportSize.smAndUp" :color="filters.groupBy !== 'favourite' ? 'primary' : ''">mdi-group</v-icon>
								<span v-if="viewportSize.smAndUp"> Group by </span>
							</v-btn>
						</template>
						<v-list class="py-0">
							<v-list-item @click.stop="filters.groupBy = filters.groupBy == 'author' ? 'favourite' : 'author'">
								<template v-slot:prepend>
									<v-icon :color="filters.groupBy == 'author' ? 'primary' : ''">mdi-account-outline</v-icon>
								</template>
								<v-list-item-title>Authors</v-list-item-title>
							</v-list-item>
						</v-list>
						<v-list class="py-0">
							<v-list-item @click.stop="filters.groupBy = filters.groupBy == 'label' ? 'favourite' : 'label'">
								<template v-slot:prepend>
									<v-icon :color="filters.groupBy == 'label' ? 'primary' : ''">mdi-label-outline</v-icon>
								</template>
								<v-list-item-title>Labels</v-list-item-title>
							</v-list-item>
						</v-list>
					</v-menu>

					<!----------------------------------- Select toolbar ----------------------------------->
					<v-scroll-x-reverse-transition hide-on-leave>
						<div v-if="!toggleSelectionTransition" class="d-flex align-center">
							<v-btn variant="text" @click="toggleSelection" key="selectButton">
								<v-icon start v-if="!selectionEnabled">mdi-format-list-bulleted</v-icon>
								<v-icon start v-else>mdi-playlist-remove</v-icon>
								<span v-if="!selectionEnabled">Select...</span>
								<span v-else>Cancel</span>
							</v-btn>
							<v-menu v-if="selectionEnabled" transition="slide-y-transition" location="bottom">
								<template v-slot:activator="{ props: menuProps }">
									<v-btn icon v-bind="menuProps" class="ml-n2">
										<v-icon>mdi-dots-vertical</v-icon>
									</v-btn>
								</template>
								<v-list class="py-0">
									<v-list-item @click.stop="askIfDeleteSongs">
										<v-list-item-title>Delete Selected</v-list-item-title>
										<template v-slot:append>
											<v-icon>mdi-delete-outline</v-icon>
										</template>
									</v-list-item>
									<v-list-item @click.stop="askToSelectSongbook('add-selected')">
										<v-list-item-title>Add Selected to Songbook</v-list-item-title>
										<template v-slot:append>
											<v-icon>mdi-playlist-music-outline</v-icon>
										</template>
									</v-list-item>
									<v-list-item @click.stop="askToSelectSongbook('remove-selected')" v-if="filters.groupBy == 'songbook'">
										<v-list-item-title>Remove Selected from Songbook</v-list-item-title>
										<template v-slot:append>
											<v-icon>mdi-playlist-remove</v-icon>
										</template>
									</v-list-item>
									<v-list-item @click.stop="setFavouriteSelected(true)">
										<v-list-item-title>Add to Favourites</v-list-item-title>
										<template v-slot:append>
											<v-icon>mdi-star</v-icon>
										</template>
									</v-list-item>
									<v-list-item @click.stop="setFavouriteSelected(false)">
										<v-list-item-title>Remove from Favourites</v-list-item-title>
										<template v-slot:append>
											<v-icon>mdi-star-outline</v-icon>
										</template>
									</v-list-item>
								</v-list>
							</v-menu>
						</div>
					</v-scroll-x-reverse-transition>
				</v-toolbar>

				<!----------------------------------- Collection / song book tabs ----------------------------------->
				<v-tabs v-model="tab" bg-color="transparent" grow>
					<v-tab @click="changeGroup('favourite')">
						Collection
					</v-tab>
					<v-tab @click="changeGroup('songbook')">
						Song Books
					</v-tab>
				</v-tabs>
			</v-container>

			<!----------------------------------- List of songs ----------------------------------->
			<div style="margin-top:160px; overflow:scroll;">
				<v-skeleton-loader v-show="songListLoading" v-for="n in 3" :key="n" height="50" type="list-item-two-line"></v-skeleton-loader>
				<v-list v-model:opened="openedGroups">
					<v-scroll-y-transition group hide-on-leave>
						<v-list-group v-for="group in groupedSongs(filters)" :key="group.group" :value="group.group">
							<template v-slot:activator="{ props: activatorProps }">
								<v-list-item v-bind="activatorProps">
									<v-list-item-title>
										<div class="d-flex" :style="{ 'min-width': '200px' }">
											<div v-if="!selectionEnabled" class="align-self-center">
												<v-icon v-if="filters.groupBy == 'songbook'" class="mr-3">mdi-playlist-music-outline</v-icon>
												<v-icon v-else-if="filters.groupBy == 'author'" class="mr-3">mdi-account-circle-outline</v-icon>
												<v-icon v-else-if="filters.groupBy == 'label'" class="mr-3">mdi-label-outline</v-icon>
												<v-icon v-else-if="group.group == 'Collection'" class="mr-3">mdi-playlist-music-outline</v-icon>
												<v-icon v-else class="mr-3">mdi-star-outline</v-icon>
											</div>
											<div v-if="selectionEnabled" class="align-self-center">
												<v-checkbox-btn class="mr-2" v-model="groupSelection[group.group]" @click.stop.prevent="onGroupSelect(group.group)"></v-checkbox-btn>
											</div>

											<div class="align-self-center text-truncate">{{ group.group ? group.group : "Unknown" }} ({{ group.songs.length }})</div>

											<div class="ml-auto" v-if="filters.groupBy == 'songbook'">
												<v-btn icon variant="text" @click.stop="askForSongBookName(group.group)">
													<v-icon>mdi-pencil-outline</v-icon>
												</v-btn>
												<v-btn icon variant="text" @click.stop="askIfDeleteSongBook(group.group)" class="ml-2">
													<v-icon>mdi-delete-outline</v-icon>
												</v-btn>
											</div>
										</div>
									</v-list-item-title>
								</v-list-item>
							</template>
							<v-scroll-y-transition group hide-on-leave>
								<v-list-item v-for="song in group.songs" :key="song.id" :style="filters.groupBy == 'author' ? 'maxHeight: 40px' : 'maxHeight: 80px'" :to="'/song/' + song.id">
									<template v-slot:prepend>
										<v-checkbox-btn v-if="selectionEnabled" class="mr-4" v-model="selection[song.id]" @click.stop.prevent="onSongSelect(group)"></v-checkbox-btn>
									</template>
									<div :class="selectionEnabled ? 'ml-0' : 'ml-4'">
										<v-list-item-title>
											<v-tooltip location="top">
												<template v-slot:activator="{ props: tooltipProps }">
													<v-icon v-show="song.input.public" size="small" color="grey" v-bind="tooltipProps">mdi-earth</v-icon>
												</template>
												<span>This song is public</span>
											</v-tooltip>
											<v-tooltip location="top">
												<template v-slot:activator="{ props: tooltipProps }">
													<v-icon v-show="song.createdBy !== user.uid" size="small" v-bind="tooltipProps">mdi-bookmark-plus-outline</v-icon>
												</template>
												<span>This song was not created by you</span>
											</v-tooltip>
											{{ song.title }}
										</v-list-item-title>
										<v-list-item-subtitle v-if="!(filters.groupBy == 'author')">{{ song.author }}</v-list-item-subtitle>
									</div>

									<template v-slot:append>
										<v-btn icon variant="text" density="comfortable" @click.prevent.stop="toggleFavourite(song.id, song.favourite)">
											<v-icon v-if="!song.favourite" color="grey-lighten-1">mdi-star-outline</v-icon>

											<v-icon v-else color="yellow">mdi-star</v-icon>
										</v-btn>

										<v-menu transition="slide-y-transition" location="bottom">
											<template v-slot:activator="{ props: menuProps }">
												<v-btn icon variant="text" density="comfortable" @click.stop.prevent class="ml-1" v-bind="menuProps">
													<v-icon>mdi-dots-vertical</v-icon>
												</v-btn>
											</template>
											<v-list class="py-0">
												<v-list-item @click.stop="askIfEditSong(song)">
													<v-list-item-title>Edit</v-list-item-title>
													<template v-slot:append>
														<v-icon>mdi-pencil-outline</v-icon>
													</template>
												</v-list-item>
												<v-list-item @click.stop="askIfDeleteSong(song)">
													<v-list-item-title>Delete</v-list-item-title>
													<template v-slot:append>
														<v-icon>mdi-delete-outline</v-icon>
													</template>
												</v-list-item>
												<v-list-item @click.stop="askToSelectSongbook('add', song)">
													<v-list-item-title>Add To Songbook</v-list-item-title>
													<template v-slot:append>
														<v-icon>mdi-playlist-music-outline</v-icon>
													</template>
												</v-list-item>
												<v-list-item @click.stop="removeFromSongbook(song, group.group)" v-if="filters.groupBy == 'songbook'">
													<v-list-item-title>Remove from Songbook</v-list-item-title>
													<template v-slot:append>
														<v-icon>mdi-playlist-remove</v-icon>
													</template>
												</v-list-item>
											</v-list>
										</v-menu>
									</template>
								</v-list-item>
							</v-scroll-y-transition>
							<v-divider class="mx-4"></v-divider>
						</v-list-group>
					</v-scroll-y-transition>
				</v-list>
			</div>
			<v-fab-transition>
				<v-btn icon color="primary" class="elevation-3 position-absolute" @click="floatButtonAction" :style="{ bottom: '20px', right: '20px' }" :key="filters.groupBy">
					<v-icon>{{ filters.groupBy == "songbook" ? "mdi-folder-plus-outline" : "mdi-music-note-plus" }}</v-icon>
				</v-btn>
			</v-fab-transition>
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
import SongbookNameDialog from "../components/Dialogs/SongbookNameDialog.vue";
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
			openedGroups: ["Collection"],
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
						this.selection[song.id] = this.groupSelection[groupName];
					});
				}
			});
		},

		onSongSelect(group) {
			let groupName = group.group;
			let everythingSelected = true;
			let everythingUnselected = true;

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
			return this.$vuetify.theme.current.dark ? "dark" : "light";
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

<style lang="scss" scoped>
/* Vuetify 3 indents v-list-group children via --indent-padding, which wastes
   too much width in the narrow drawer; keep songs aligned near the edge */
:deep(.v-list-group__items) {
	--indent-padding: 0px;
}
</style>
