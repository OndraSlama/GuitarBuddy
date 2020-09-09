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
              @click="goupByAuthor = !goupByAuthor"
              icon
              large
              class="ml-1"
            >
              <v-icon v-if="!goupByAuthor">mdi-account-details-outline</v-icon>
              <v-icon v-if="goupByAuthor">mdi-playlist-star</v-icon>
            </v-btn>
          </template>
          <span v-if="!goupByAuthor">Group by author</span>
          <span v-if="goupByAuthor">Group by favourite</span>
        </v-tooltip>
      </v-row>

      <v-toolbar
        class="elevation-0 mt-n3"
        height="40px"
        :color="$vuetify.theme.dark ? '#121212' : ''"
      >
        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn icon v-bind="attrs" v-on="on">
              <v-icon>mdi-filter-variant</v-icon>
            </v-btn>
          </template>
          <span>Filters</span>
        </v-tooltip>

        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn v-bind="attrs" v-on="on" icon @click="selectionEnabled = !selectionEnabled">
              <v-icon :color="selectionEnabled?'green':''">mdi-format-list-bulleted</v-icon>
            </v-btn>
          </template>
          <span>Selection</span>
        </v-tooltip>

        <v-spacer></v-spacer>

        <v-btn icon :disabled="!selectionEnabled" @click="onDeleteSelected">
          <v-icon>mdi-delete-outline</v-icon>
        </v-btn>
        <v-btn icon :disabled="!selectionEnabled" @click="onSetFavouriteSelected">
          <v-icon>mdi-star-outline</v-icon>
        </v-btn>
        <v-btn icon :disabled="!selectionEnabled" @click="onUnsetFavouriteSelected">
          <v-icon>mdi-star</v-icon>
        </v-btn>
      </v-toolbar>
      <!-- <v-sheet class="mx-3">
				<v-switch v-model="goupByAuthor" inset label="Group by author"></v-switch>
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
          <v-list-item-group v-for="group in groupedSongs" :key="group.group">
            <v-divider class="mx-4"></v-divider>
            <v-subheader>
              <v-icon v-if="goupByAuthor" class="mr-3">mdi-account-circle-outline</v-icon>
              <v-icon
                v-else-if="group.group == 'Collection'"
                class="mr-3"
              >mdi-playlist-music-outline</v-icon>
              <v-icon v-else class="mr-3">mdi-star-outline</v-icon>
              {{ group.group }}
              <v-spacer></v-spacer>
              <v-checkbox
                v-model="groupSelection[group.group]"
                @click.stop.prevent="onGroupSelect(group.group)"
                v-if="selectionEnabled"
              ></v-checkbox>
            </v-subheader>
            <v-scroll-y-transition group hide-on-leave>
              <v-list-item
                v-for="song in group.songs"
                :key="song.id"
                router
                :style=" goupByAuthor ? 'maxHeight: 40px' : 'maxHeight: 80px'"
                :to="'/song/' + song.id"
              >
                <v-list-item-action class="mr-4" v-if="selectionEnabled">
                  <v-checkbox
                    v-model="selection[song.id]"
                    @click.stop.prevent="onSongSelect(group)"
                  ></v-checkbox>
                </v-list-item-action>
                <v-list-item-content>
                  <v-list-item-title>{{ song.title }}</v-list-item-title>
                  <v-list-item-subtitle v-if="!goupByAuthor">{{ song.author }}</v-list-item-subtitle>
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
                  </v-menu>

                  <!-- <v-btn small icon @click.stop.prevent="" :to="'/edit-song/' + song.id">
										<v-icon>mdi-pencil-outline</v-icon>
                  </v-btn>-->
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
      selectionEnabled: false,
      selection: {},
      groupSelection: {},
      goupByAuthor: false,
      filters: {
        search: "",
      },
    };
  },
  methods: {
    onGroupSelect(groupName) {
      this.groupedSongs.forEach((group) => {
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

    deleteSong(songId) {
      this.$store.dispatch("deleteSong", songId);
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

    groupedSongs() {
      let groups = {};
      if (this.goupByAuthor) {
        this.filteredSongs(this.filters).forEach((song) => {
          if (groups[song.author] == undefined) {
            groups[song.author] = [];
          }
          groups[song.author].push({ ...song, selected: false });
        });
      } else {
        this.filteredSongs(this.filters).forEach((song) => {
          let group;
          if (song.favourite) {
            group = "Favourite";
          } else {
            group = "Collection";
          }

          if (groups[group] == undefined) {
            groups[group] = [];
          }
          groups[group].push({ ...song, selected: false });
        });
      }

      let groupsArray = [];

      for (let key in groups) {
        groupsArray.push({ group: key, songs: groups[key] });
      }
      return groupsArray.sort((a, b) => {
        if (a.group === "Favourite") return -1;
        if (b.group === "Favourite") return 1;
      });
    },

    ...mapGetters({
      userLogged: "getUserLogged",
      openedStore: "getSongListOpened",
      songs: "getUserSongs",
      filteredSongs: "getFilteredUserSongs",
      songListLoading: "getSongListLoading",
    }),
  },
};
</script>

<style lang="scss" scoped></style>
