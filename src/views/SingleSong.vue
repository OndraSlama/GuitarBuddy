<template>
  <div>
    <v-skeleton-loader
      v-show="songListLoading || song == null"
      type="article"
    ></v-skeleton-loader>
    <v-scroll-x-transition hide-on-leave>
      <song-sheet
        v-if="!songListLoading && !transitioning && song != null"
        :song="song"
      ></song-sheet>
    </v-scroll-x-transition>
  </div>
</template>

<script>
import SongSheet from "../components/SongSheet";

import { mapGetters } from "vuex";

export default {
  data() {
    return { transitioning: false };
  },

  methods: {
    updateNavigationTitle() {
      if (this.song !== null && this.song !== undefined) {
        this.$store.commit(
          "setCurrentPage",
          this.song?.title + " - " + (this.song.author.trim() || "Unknown")
        );
      }
    },
  },

  computed: {
    id() {
      return this.$route.params.id;
    },

    song() {
      return this.$store.getters.getCurrentSong(this.id);
    },

    songValid() {
      return this.song != undefined || this.song != null;
    },

    ...mapGetters({
      songListLoading: "getSongListLoading",
      loadedSong: "getLoadedSong",
    }),
  },
  components: {
    "song-sheet": SongSheet,
  },

  updated() {
    this.updateNavigationTitle();
  },

  created() {
    this.updateNavigationTitle();
  },

  watch: {
    "$route.params.id": function () {
      this.updateNavigationTitle();
      this.transitioning = true;
      setTimeout(() => {
        this.transitioning = false;
      }, 80);
    },
    song: function () {
      this.updateNavigationTitle();
      if (this.song === null || this.song === undefined) {
        this.$router.push("/song-book").catch(() => {});
      }
    },
  },
};
</script>

<style lang="scss" scoped></style>
