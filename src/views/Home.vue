<template>
	<div>
		<v-container>
			<v-row justify="center">
				<v-col cols="12" sm="6" :style="viewportSize.smAndUp ? { minWidth: 'clamp(0px, 800px, 100%)' } : {}">
					<p :class="['text-medium-emphasis text-center mb-5 mb-sm-10', viewportSize.smAndUp ? 'text-h2' : 'text-h4']">
						Browse Public Songs
					</p>
					<v-text-field v-model="filters.search" density="compact" hide-details prepend-inner-icon="mdi-magnify" variant="outlined"></v-text-field>
					<v-toolbar class="elevation-0 my-3" height="40" :color="$vuetify.theme.current.dark ? '#121212' : undefined">
						<v-spacer></v-spacer>

						<v-toolbar-items>
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
							<!----------------------------------- Order by menu ----------------------------------->

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
									<v-list-item @click.stop="onDateModified">
										<template v-slot:prepend>
											<v-icon :color="filters.orderBy == 'dateModified' ? 'primary' : ''">mdi-calendar-edit</v-icon>
										</template>
										<v-list-item-title>Date modified</v-list-item-title>
										<template v-slot:append>
											<v-icon v-show="filters.orderBy == 'dateModified' && filters.modifiedDateOrder" color="primary">mdi-chevron-up</v-icon>
											<v-icon v-show="filters.orderBy == 'dateModified' && !filters.modifiedDateOrder" color="primary">mdi-chevron-down</v-icon>
										</template>
									</v-list-item>
									<v-list-item @click.stop="onDateCreated">
										<template v-slot:prepend>
											<v-icon :color="filters.orderBy == 'dateCreated' ? 'primary' : ''">mdi-calendar-plus</v-icon>
										</template>
										<v-list-item-title>Date created</v-list-item-title>
										<template v-slot:append>
											<v-icon v-show="filters.orderBy == 'dateCreated' && filters.createdDateOrder" color="primary">mdi-chevron-up</v-icon>
											<v-icon v-show="filters.orderBy == 'dateCreated' && !filters.createdDateOrder" color="primary">mdi-chevron-down</v-icon>
										</template>
									</v-list-item>
									<v-list-item @click.stop="onForks">
										<template v-slot:prepend>
											<v-icon :color="filters.orderBy == 'forks' ? 'primary' : ''">mdi-heart-outline</v-icon>
										</template>
										<v-list-item-title>Popularity</v-list-item-title>
										<template v-slot:append>
											<v-icon v-show="filters.orderBy == 'forks' && filters.forksOrder" color="primary">mdi-chevron-up</v-icon>
											<v-icon v-show="filters.orderBy == 'forks' && !filters.forksOrder" color="primary">mdi-chevron-down</v-icon>
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
								</v-list>
							</v-menu>
						</v-toolbar-items>
					</v-toolbar>
					<!----------------------------------- Song list ----------------------------------->
					<v-sheet class="elevation-1">
						<v-skeleton-loader v-show="showLoading" v-for="n in 5" :key="n" type="list-item-two-line"></v-skeleton-loader>
						<v-list v-if="!showLoading">
							<v-scroll-x-transition group hide-on-leave>
								<component :is="filters.groupBy !== 'favourite' ? 'v-list-group' : 'v-list'" v-for="group in groupedSongs(filters)" :key="group.group" :prepend-icon="filters.groupBy == 'author' ? 'mdi-account-circle-outline' : ''">
									<template v-slot:activator="{ props: activatorProps }" v-if="filters.groupBy !== 'favourite'">
										<v-list-item v-bind="activatorProps">
											<v-list-item-title>{{ group.group ? group.group : "Unknown" }}</v-list-item-title>
										</v-list-item>
									</template>
									<v-scroll-x-transition group hide-on-leave>
										<v-list-item v-for="song in group.songs" :to="'/song/' + song.id" :key="song.id">
											<div>
												<v-list-item-title>
													<v-icon v-if="filters.groupBy == 'author'" color="grey" class="mr-2">mdi-music-note-outline</v-icon>
													{{ song.title }}
												</v-list-item-title>
												<v-list-item-subtitle v-if="filters.groupBy != 'author'">{{ song.author }}</v-list-item-subtitle>
											</div>

											<template v-slot:append>
												<v-tooltip location="top">
													<template v-slot:activator="{ props: tooltipProps }">
														<div v-show="song.forks && viewportSize.smAndUp" class="mr-5" v-bind="tooltipProps">
															<v-icon size="small" class="mx-2">mdi-heart-outline</v-icon>
															<span>{{ song.forks }}</span>
														</div>
													</template>
													<span>Popularity</span>
												</v-tooltip>

												<v-tooltip location="top">
													<template v-slot:activator="{ props: tooltipProps }">
														<div v-show="song.modifiedAt && viewportSize.smAndUp" class="mr-5 text-end" style="min-width: 160px" v-bind="tooltipProps">
															<v-icon size="small" class="mx-2">mdi-calendar-edit</v-icon>
															<span>{{ formatDate(song.modifiedAt) }}</span>
														</div>
													</template>
													<span>Last edit</span>
												</v-tooltip>

												<v-tooltip location="top">
													<template v-slot:activator="{ props: tooltipProps }">
														<v-fab-transition hide-on-leave>
															<v-btn v-if="!alreadyInCollection(song.id)" :disabled="!userLogged || alreadyInCollection(song.id)" icon size="x-small" color="primary" class="elevation-0" v-bind="tooltipProps" @click.stop.prevent="addToCollection(song)">
																<v-icon>mdi-plus</v-icon>
															</v-btn>
														</v-fab-transition>
													</template>
													<span>Add to collection</span>
												</v-tooltip>
												<v-fab-transition hide-on-leave>
													<v-btn icon variant="text" v-if="alreadyInCollection(song.id)" :disabled="true">
														<v-icon color="primary">mdi-check</v-icon>
													</v-btn>
												</v-fab-transition>
											</template>
										</v-list-item>
									</v-scroll-x-transition>
								</component>
							</v-scroll-x-transition>
						</v-list>
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
</template>

<script>
import { mapGetters } from "vuex";
import filtersBase from "../mixins/songFiltersBase";
// @ is an alias to /src
export default {
	name: "HomePage",
	mixins: [filtersBase],
	data() {
		return {
			dialogOpened: false,
			openedSong: undefined,
			// referenced by showLoading; never set anywhere, declared to keep the
			// historical always-false behavior without a Vue warning
			grouperSong: undefined,
		};
	},
	methods: {
		formatDate(dateString) {
			let date = new Date(dateString);
			return this.$moment(date, "YYYY.MM.DD-h:m").fromNow();
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
		showLoading() {
			return this.publicSongListLoading && this.grouperSong;
		},
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
			userLogged: "getUserLogged",
			userSongs: "getUserSongs",
		}),
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
}
</style>
