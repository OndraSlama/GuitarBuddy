<template>
  <div>
    <v-skeleton-loader v-show="songListLoading || song == null" type="article"></v-skeleton-loader>
    <v-scroll-x-transition hide-on-leave>
      <song-sheet v-if="!songListLoading && !transitioning && song != null" :song="song"></song-sheet>
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

  computed: {
    id() {
      return this.$route.params.id;
    },

    songValid() {
      return this.song != undefined || this.song != null;
    },

    ...mapGetters({
      songListLoading: "getSongListLoading",
      song: "getLoadedSong",
    }),
  },

  components: {
    "song-sheet": SongSheet,
  },

  created() {
    this.$store.dispatch("loadSong", this.id);
  },

  watch: {
    "$route.params.id": function () {
      this.$store.dispatch("loadSong", this.id);
      this.transitioning = true;
      setTimeout(() => {
        this.transitioning = false;
      }, 80);
    },
  },
};
</script>

<style lang="scss" scoped></style>
