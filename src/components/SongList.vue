<template>
  <div>
    <v-navigation-drawer
      v-if="userLogged"
      v-model="opened"
      :permanent="drawerPermanent"
      :temporary="size.xs"
      app
      overflow
      clipped
      width="350"
    >
      <!-- <div v-for="song in songs" :key="song.id" class="ma-3">
				<span>{{ song.title }}</span> <v-btn :to="'/song/' + song.id">Go to song</v-btn>
      </div>-->
      <v-row class="ma-3 mt-3">
        <v-text-field
          v-model="filters.search"
          dense
          flat
          hide-details
          prepend-inner-icon="mdi-magnify"
          outlined
        ></v-text-field>

        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on="on"
              @click="filters.groupByAuthor = !filters.groupByAuthor"
              icon
              large
              class="ml-1"
            >
              <v-icon v-if="!filters.groupByAuthor">mdi-account-details-outline</v-icon>
              <v-icon v-if="filters.groupByAuthor">mdi-playlist-star</v-icon>
            </v-btn>
          </template>
          <span v-if="!filters.groupByAuthor">Group by author</span>
          <span v-if="filters.groupByAuthor">Group by favourite</span>
        </v-tooltip>
      </v-row>

      <v-toolbar
        class="elevation-0 mt-n3"
        height="40px"
        :color="$vuetify.theme.dark ? '#363636' : ''"
      >
        <v-menu rounded="large" transition="slide-y-transition" bottom>
          <template v-slot:activator="{ on: onMenu }">
            <v-btn text v-on="{ ...onMenu }" class="ml-n3">
              <v-icon :left="size.smAndUp">mdi-sort-alphabetical-ascending</v-icon>Order by
              <!-- <v-icon>mdi-chevron-down</v-icon> -->
            </v-btn>
          </template>
          <v-list class="py-0">
            <v-list-item @click.stop="onSongsAlph">
              <v-list-item-title>Songs</v-list-item-title>
              <v-list-item-icon>
                <v-icon
                  v-show="filters.songsAscOrder"
                  :color="filters.orderOption == 0 ? 'primary' : ''"
                >mdi-sort-alphabetical-ascending</v-icon>
                <v-icon
                  v-show="!filters.songsAscOrder"
                  :color="filters.orderOption == 0 ? 'primary' : ''"
                >mdi-sort-alphabetical-descending</v-icon>
              </v-list-item-icon>
            </v-list-item>
            <v-list-item @click.stop="onAuthorsAlph">
              <v-list-item-title>Authors</v-list-item-title>
              <v-list-item-icon>
                <v-icon
                  v-show="filters.authorsAscOrder"
                  :color="filters.orderOption == 1 || filters.groupByAuthor ? 'primary' : ''"
                >mdi-sort-alphabetical-ascending</v-icon>
                <v-icon
                  v-show="!filters.authorsAscOrder"
                  :color="filters.orderOption == 1 || filters.groupByAuthor ? 'primary' : ''"
                >mdi-sort-alphabetical-descending</v-icon>
              </v-list-item-icon>
            </v-list-item>
            <v-list-item @click.stop="onSongsDate">
              <v-list-item-title>Date modified</v-list-item-title>
              <v-list-item-icon>
                <v-icon
                  v-show="filters.songsDateOrder"
                  :color="filters.orderOption == 2 ? 'primary' : ''"
                >mdi-sort-calendar-ascending</v-icon>
                <v-icon
                  v-show="!filters.songsDateOrder"
                  :color="filters.orderOption == 2 ? 'primary' : ''"
                >mdi-sort-calendar-descending</v-icon>
              </v-list-item-icon>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-scroll-x-reverse-transition hide-on-leave>
          <v-btn
            v-if="!toggleSelectionTransition"
            text
            :icon="selectionEnabled"
            @click="toggleSelection"
          >
            <v-icon left v-if="!selectionEnabled">mdi-format-list-bulleted</v-icon>
            <v-icon v-else>mdi-playlist-remove</v-icon>
            <span v-if="!selectionEnabled">Select...</span>
          </v-btn>
        </v-scroll-x-reverse-transition>

        <v-spacer></v-spacer>
        <v-fab-transition group hide-on-leave>
          <v-btn icon v-if="selectionEnabled" :key="'delete'" @click="askIfDeleteSongs">
            <v-icon>mdi-delete-outline</v-icon>
          </v-btn>
          <v-btn icon v-if="selectionEnabled" :key="'favourite'" @click="onSetFavouriteSelected">
            <v-icon>mdi-star-outline</v-icon>
          </v-btn>
          <v-btn
            icon
            v-if="selectionEnabled"
            :key="'unfavourite'"
            @click="onUnsetFavouriteSelected"
          >
            <v-icon>mdi-star</v-icon>
          </v-btn>
        </v-fab-transition>
      </v-toolbar>
      <delete-dialog v-model="deleteSongsDialogOpened" v-on:accept="onDeleteSelected()" />
      <!-- <v-sheet class="mx-3">
				<v-switch v-model="filters.groupByAuthor" inset label="Group by author"></v-switch>
      </v-sheet>-->

      <v-list subheader>
        <v-skeleton-loader
          v-show="songListLoading"
          v-for="n in 3"
          :key="n"
          height="50"
          type="list-item-two-line"
        ></v-skeleton-loader>
        <v-scroll-y-transition group hide-on-leave>
          <v-list-item-group v-for="(group, n) in groupedSongs(filters)" :key="group.group">
            <v-divider v-show="n > 0" class="mx-4"></v-divider>
            <v-subheader>
              <v-icon v-if="filters.groupByAuthor" class="mr-3">mdi-account-circle-outline</v-icon>
              <v-icon
                v-else-if="group.group == 'Collection'"
                class="mr-3"
              >mdi-playlist-music-outline</v-icon>
              <v-icon v-else class="mr-3">mdi-star-outline</v-icon>
              {{ group.group ? group.group : "Unknown" }}
              <v-spacer></v-spacer>
              <v-fab-transition>
                <v-checkbox
                  v-model="groupSelection[group.group]"
                  @click.stop.prevent="onGroupSelect(group.group)"
                  v-if="selectionEnabled"
                ></v-checkbox>
              </v-fab-transition>
            </v-subheader>
            <v-scroll-y-transition group hide-on-leave>
              <v-list-item
                v-for="song in group.songs"
                :key="song.id"
                router
                :style="filters.groupByAuthor ? 'maxHeight: 40px' : 'maxHeight: 80px'"
                :to="'/song/' + song.id"
              >
                <v-fab-transition hide-on-leave>
                  <v-list-item-action class="mr-4" v-if="selectionEnabled">
                    <v-checkbox
                      v-model="selection[song.id]"
                      @click.stop.prevent="onSongSelect(group)"
                    ></v-checkbox>
                  </v-list-item-action>
                </v-fab-transition>
                <v-list-item-content>
                  <v-list-item-title>
                    <v-tooltip top>
                      <template v-slot:activator="{ on, attrs }">
                        <v-fab-transition>
                          <v-icon
                            v-show="song.input.public"
                            small
                            color="grey"
                            v-bind="attrs"
                            v-on="on"
                          >mdi-earth</v-icon>
                        </v-fab-transition>
                      </template>
                      <span>This song is public</span>
                    </v-tooltip>
                    <v-tooltip top>
                      <template v-slot:activator="{ on, attrs }">
                        <v-fab-transition>
                          <v-icon
                            v-show="song.createdBy !== user.uid"
                            small
                            v-bind="attrs"
                            v-on="on"
                          >mdi-bookmark-plus-outline</v-icon>
                        </v-fab-transition>
                      </template>
                      <span>This song was not created by you</span>
                    </v-tooltip>
                    {{ song.title }}
                  </v-list-item-title>
                  <v-list-item-subtitle v-if="!filters.groupByAuthor">{{ song.author }}</v-list-item-subtitle>
                </v-list-item-content>

                <v-list-item-action class="mr-n6">
                  <v-btn icon @click.prevent.stop="onFavouriteChange(song.id, song.favourite)">
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
                        <edit-public-song-dialog
                          v-model="editPublicSongDialogOpened"
                          v-on:accept="editPublicSong(currentSong)"
                        />
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
                    </v-list>
                  </v-menu>
                </v-list-item-action>
              </v-list-item>
            </v-scroll-y-transition>
          </v-list-item-group>
        </v-scroll-y-transition>
      </v-list>
    </v-navigation-drawer>
    <delete-dialog v-model="deleteSongDialogOpened" v-on:accept="deleteSong(currentSong.id)" />
  </div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  data() {
    return {
      selectionEnabled: false,
      currentSong: undefined,
      selection: {},
      editPublicSongDialogOpened: false,
      deleteSongDialogOpened: false,
      deleteSongsDialogOpened: false,
      groupSelection: {},
      filters: {
        search: "",
        groupByAuthor: false,
        songsAscOrder: false,
        authorsAscOrder: false,
        songsDateOrder: false,
        orderOption: 0,
      },

      toggleSelectionTransition: false,
    };
  },
  methods: {
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

    deleteSong(songId) {
      this.$store.dispatch("deleteSong", songId);
    },

    askIfDeleteSongs() {
      this.deleteSongsDialogOpened = true;
    },

    onDeleteSelected() {
      for (let key in this.selection) {
        if (this.selection[key] === true) {
          this.deleteSong(key);
        }
      }
    },

    onUnsetFavouriteSelected() {
      for (let key in this.selection) {
        if (this.selection[key] === true) {
          this.onFavouriteChange(key, false);
        }
      }
    },

    onSetFavouriteSelected() {
      for (let key in this.selection) {
        if (this.selection[key] === true) {
          this.onFavouriteChange(key, true);
        }
      }
    },

    onFavouriteChange(songId, currentFavourite) {
      this.$store.dispatch("setFavourite", {
        id: songId,
        value: !currentFavourite,
      });
    },
  },
  computed: {
    size() {
      return this.$vuetify.breakpoint;
    },
    scrollbarTheme() {
      return this.$vuetify.theme.dark ? "dark" : "light";
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

    // groupedSongs() {
    //   let groups = {};
    //   if (this.filters.groupByAuthor) {
    //     this.filteredSongs(this.filters).forEach((song) => {
    //       if (groups[song.author] == undefined) {
    //         groups[song.author] = [];
    //       }
    //       groups[song.author].push({ ...song, selected: false });
    //     });
    //   } else {
    //     this.filteredSongs(this.filters).forEach((song) => {
    //       let group;
    //       if (song.favourite) {
    //         group = "Favourite";
    //       } else {
    //         group = "Collection";
    //       }

    //       if (groups[group] == undefined) {
    //         groups[group] = [];
    //       }
    //       groups[group].push({ ...song, selected: false });
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

    ...mapGetters({
      userLogged: "getUserLogged",
      user: "getUser",
      openedStore: "getSongListOpened",
      songs: "getUserSongs",
      groupedSongs: "getFilteredUserSongs",
      songListLoading: "getSongListLoading",
    }),
  },
};
</script>

<style lang="scss" scoped></style>
