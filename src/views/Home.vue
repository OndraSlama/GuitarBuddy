<template>
	<div>
		<v-container>
			<v-row justify="center">
				<v-col cols="12" sm="6" :style="viewportSize.smAndUp ? { minWidth: 'clamp(0px, 800px, 100%)' } : {}">
					<p :class="['text--secondary text-center mb-5 mb-sm-10', viewportSize.smAndUp ? 'display-3' : 'display-1']" align-self>
						Browse Public Songs
					</p>
					<v-text-field v-model="filters.search" dense flat hide-details prepend-inner-icon="mdi-magnify" outlined></v-text-field>
					<v-toolbar class="elevation-0 my-3" height="40px" :color="$vuetify.theme.dark ? '#121212' : ''">
						<!-- <v-toolbar-items>
							<v-btn text :icon="viewportSize.xs" :color="filters.groupBy == 'author' ? '' : 'primary'" @click="filters.groupBy = 'favourite'">
								<v-icon left>mdi-music-note-outline</v-icon>
								<span class="d-none d-sm-flex">Songs</span>
							</v-btn>

							<v-btn text :icon="viewportSize.xs" :color="filters.groupBy == 'author' ? 'primary' : ''" @click="filters.groupBy = 'author'">
								<v-icon :left="viewportSize.smAndUp">mdi-account-outline</v-icon>
								<span class="d-none d-sm-flex">Authors</span>
							</v-btn>
						</v-toolbar-items> -->
						<v-spacer></v-spacer>

						<v-toolbar-items>
							<!----------------------------------- Group by menu ----------------------------------->
							<v-menu rounded="large" transition="slide-y-transition" bottom>
								<template v-slot:activator="{ on: onMenu }">
									<v-btn text :icon="viewportSize.xs" v-on="{ ...onMenu }" :disabled="filters.groupBy == 'songbook'">
										<v-icon :left="viewportSize.smAndUp" :color="filters.groupBy !== 'favourite' ? 'primary' : ''">mdi-group</v-icon>
										<span v-if="viewportSize.smAndUp"> Group by </span>
										<!-- <v-icon>mdi-chevron-down</v-icon> -->
									</v-btn>
								</template>
								<v-list class="py-0">
									<v-list-item @click.stop="filters.groupBy = filters.groupBy == 'author' ? 'favourite' : 'author'">
										<v-list-item-icon>
											<v-icon :color="filters.groupBy == 'author' ? 'primary' : ''">mdi-account-outline</v-icon>
										</v-list-item-icon>
										<v-list-item-title>Authors</v-list-item-title>
									</v-list-item>
								</v-list>
								<v-list class="py-0">
									<v-list-item @click.stop="filters.groupBy = filters.groupBy == 'label' ? 'favourite' : 'label'">
										<v-list-item-icon>
											<v-icon :color="filters.groupBy == 'label' ? 'primary' : ''">mdi-label-outline</v-icon>
										</v-list-item-icon>
										<v-list-item-title>Labels</v-list-item-title>
									</v-list-item>
								</v-list>
							</v-menu>
							<!----------------------------------- Order by menu ----------------------------------->

							<v-menu rounded="large" transition="slide-y-transition" bottom>
								<template v-slot:activator="{ on: onMenu }">
									<v-btn text :icon="viewportSize.xs" v-on="{ ...onMenu }">
										<v-icon :left="viewportSize.smAndUp">mdi-sort-alphabetical-ascending</v-icon>
										<span v-if="viewportSize.smAndUp"> Order by </span>
										<!-- <v-icon>mdi-chevron-down</v-icon> -->
									</v-btn>
								</template>
								<v-list class="py-0">
									<v-subheader>SONG ORDER</v-subheader>
									<v-list-item @click.stop="onTitleName">
										<v-list-item-icon>
											<v-icon :color="filters.orderBy == 'titleName' ? 'primary' : ''">mdi-music-note-outline</v-icon>
										</v-list-item-icon>
										<v-list-item-title>Songs</v-list-item-title>
										<v-list-item-icon v-show="filters.orderBy == 'titleName'">
											<v-icon v-show="filters.titleNameOrder" :color="filters.orderBy == 'titleName' ? 'primary' : ''">mdi-chevron-up</v-icon>
											<v-icon v-show="!filters.titleNameOrder" :color="filters.orderBy == 'titleName' ? 'primary' : ''">mdi-chevron-down</v-icon>
										</v-list-item-icon>
									</v-list-item>
									<v-list-item @click.stop="onAuthorName" :disabled="filters.groupBy == 'author'">
										<v-list-item-icon>
											<v-icon :disabled="filters.groupBy == 'author'" :color="filters.orderBy == 'authorName' ? 'primary' : ''">mdi-account-outline</v-icon>
										</v-list-item-icon>
										<v-list-item-title>Authors</v-list-item-title>
										<v-list-item-icon v-show="filters.orderBy == 'authorName'">
											<v-icon v-show="filters.authorNameOrder" :disabled="filters.groupBy == 'author'" :color="filters.orderBy == 'authorName' ? 'primary' : ''">mdi-chevron-up</v-icon>
											<v-icon v-show="!filters.authorNameOrder" :disabled="filters.groupBy == 'author'" :color="filters.orderBy == 'authorName' ? 'primary' : ''">mdi-chevron-down</v-icon>
										</v-list-item-icon>
									</v-list-item>
									<v-list-item @click.stop="onDateModified">
										<v-list-item-icon>
											<v-icon :color="filters.orderBy == 'dateModified' ? 'primary' : ''">mdi-calendar-edit</v-icon>
										</v-list-item-icon>
										<v-list-item-title>Date modified</v-list-item-title>
										<v-list-item-icon v-show="filters.orderBy == 'dateModified'">
											<v-icon v-show="filters.modifiedDateOrder" :color="filters.orderBy == 'dateModified' ? 'primary' : ''">mdi-chevron-up</v-icon>
											<v-icon v-show="!filters.modifiedDateOrder" :color="filters.orderBy == 'dateModified' ? 'primary' : ''">mdi-chevron-down</v-icon>
										</v-list-item-icon>
									</v-list-item>
									<v-list-item @click.stop="onDateCreated">
										<v-list-item-icon>
											<v-icon :color="filters.orderBy == 'dateCreated' ? 'primary' : ''">mdi-calendar-plus</v-icon>
										</v-list-item-icon>
										<v-list-item-title>Date created</v-list-item-title>
										<v-list-item-icon v-show="filters.orderBy == 'dateCreated'">
											<v-icon v-show="filters.createdDateOrder" :color="filters.orderBy == 'dateCreated' ? 'primary' : ''">mdi-chevron-up</v-icon>
											<v-icon v-show="!filters.createdDateOrder" :color="filters.orderBy == 'dateCreated' ? 'primary' : ''">mdi-chevron-down</v-icon>
										</v-list-item-icon>
									</v-list-item>
									<v-list-item @click.stop="onForks">
										<v-list-item-icon>
											<v-icon :color="filters.orderBy == 'forks' ? 'primary' : ''">mdi-heart-outline</v-icon>
										</v-list-item-icon>
										<v-list-item-title>Popularity</v-list-item-title>
										<v-list-item-icon v-show="filters.orderBy == 'forks'">
											<v-icon v-show="filters.forksOrder" :color="filters.orderBy == 'forks' ? 'primary' : ''">mdi-chevron-up</v-icon>
											<v-icon v-show="!filters.forksOrder" :color="filters.orderBy == 'forks' ? 'primary' : ''">mdi-chevron-down</v-icon>
										</v-list-item-icon>
									</v-list-item>
									<v-subheader>GROUP ORDER</v-subheader>
									<v-list-item @click.stop="onGroupName">
										<v-list-item-icon>
											<v-icon :color="filters.orderGroupBy == 'name' ? 'primary' : ''">mdi-group</v-icon>
										</v-list-item-icon>
										<v-list-item-title>Name</v-list-item-title>
										<v-list-item-icon v-show="filters.orderGroupBy == 'name'">
											<v-icon v-show="filters.groupNameOrder" :color="filters.orderGroupBy == 'name' ? 'primary' : ''">mdi-chevron-up</v-icon>
											<v-icon v-show="!filters.groupNameOrder" :color="filters.orderGroupBy == 'name' ? 'primary' : ''">mdi-chevron-down</v-icon>
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
					<!----------------------------------- Song list ----------------------------------->
					<v-sheet class="elevation-1">
						<v-skeleton-loader v-show="publicSongListLoading" v-for="n in 5" :key="n" type="list-item-two-line"></v-skeleton-loader>
						<v-list v-if="!publicSongListLoading" expand>
							<v-scroll-x-transition group hide-on-leave>
								<v-list-group class="d-none" key="group"></v-list-group>
								<v-list-item-group class="d-none" key="item-group"></v-list-item-group>
								<component :is="filters.groupBy !== 'favourite' ? 'v-list-group' : 'v-list'" v-for="group in groupedSongs(filters)" :key="group.group" :prepend-icon="filters.groupBy == 'author' ? 'mdi-account-circle-outline' : ''">
									<template v-slot:activator v-if="filters.groupBy !== 'favourite'">
										<v-list-item-title>{{ group.group ? group.group : "Unknown" }}</v-list-item-title>
									</template>
									<!-- <v-list-group v-for="(group) in groupedSongs(filters)" :key="group.group"> -->
									<v-scroll-x-transition group hide-on-leave>
										<!-- <template > -->
										<!-- <v-divider class="mx-3" :key="n" v-if="n !== 0"></v-divider> -->

										<v-list-item v-for="song in group.songs" :two-line="!filters.groupBy == 'author'" @click.stop="openSongDialog(song)" :key="song.id" prepend-icon="mdi-account-circle-outline">
											<v-list-item-content>
												<v-list-item-title>
													<v-icon v-if="filters.groupBy == 'author'" color="grey" class="mr-2">mdi-music-note-outline</v-icon>
													{{ song.title }}
												</v-list-item-title>
												<v-list-item-subtitle v-if="filters.groupBy != 'author'">{{ song.author }}</v-list-item-subtitle>
											</v-list-item-content>

											<v-tooltip top>
												<template v-slot:activator="{ on, attrs }">
													<div v-show="song.forks && viewportSize.smAndUp" class="mr-5" style="display: absolute; right: 40%" v-bind="attrs" v-on="on">
														<v-icon small class="mx-2">mdi-heart-outline</v-icon>
														<span>{{ song.forks }}</span>
													</div>
												</template>
												<span>Popularity</span>
											</v-tooltip>

											<v-tooltip top>
												<template v-slot:activator="{ on, attrs }">
													<div v-show="song.modifiedAt && viewportSize.smAndUp" class="mr-5 text-end" style="min-width: 160px" v-bind="attrs" v-on="on">
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
															<v-btn v-if="!alreadyInCollection(song.id)" :disabled="!userLogged || alreadyInCollection(song.id)" fab x-small class="elevation-0 primary" v-bind="attrs" v-on="on" @click.stop.prevent="addToCollection(song)">
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
			<v-row justify="center">
				<v-btn color="primary" @click="filters.lastRow += 10" :disabled="loadMoreButtonDisabled">
					<span>Load more</span>
				</v-btn>
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
import filtersBase from "../mixins/songFiltersBase";
// @ is an alias to /src
export default {
	name: "Home",
	mixins: [filtersBase],
	data() {
		return {
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
			this.$store.dispatch("savePublicSongToUser", song);
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
		showList() {
			return this.filteredPublicSongs.length > 0;
		},

		loadedSong() {
			return this.$store.getters.getLoadedSong;
		},

		loadMoreButtonDisabled() {
			let groupedSongs = this.groupedSongs({ ...this.filters, lastRow: null });

			if (groupedSongs.length == 1) {
				return this.filters.lastRow >= (groupedSongs[0]?.songs?.length ?? 0);
			}
			return this.filters.lastRow >= (groupedSongs?.length ?? 0);
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
		this.$store.dispatch("loadPublicSongsOn");
	},
	beforeDestroy() {
		this.$store.dispatch("loadPublicSongsOff");
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
