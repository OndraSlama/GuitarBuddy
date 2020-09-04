<template>
  <div>
    <p class="text-h3 text--secondary text-end font-weight-light text-sm-h2 mb-6">Add new song</p>
    <v-row>
      <v-col cols="12" md="6" lg="4">
        <song-editor v-on:song-submited="importSong" v-on:input="formatedSong = $event" type="add"></song-editor>
      </v-col>
      <v-divider class="hidden-md-and-up"></v-divider>
      <v-col cols="12" md="6" lg="8">
        <song-sheet :song="formatedSong" class="pl-md-6"></song-sheet>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import SongSheet from "../components/SongSheet";
import SongEditor from "../components/SongEditor";
import { mapGetters } from "vuex";

export default {
  data() {
    return {
      formatedSong: undefined,
    };
  },
  methods: {
    importSong(songInput) {
      if (this.formatedSong == undefined) {
        alert("Undefined formated song");
        return;
      }
      let newSong = {
        ...this.formatedSong,
        createdBy: this.user.uid,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        input: {
          ...songInput,
        },
      };
      this.$store.dispatch("addSong", newSong);
    },
  },
  computed: {
    ...mapGetters({
      userLogged: "getUserLogged",
      user: "getUser",
      showTooltips: "getShowTooltips",
    }),
  },
  components: {
    "song-sheet": SongSheet,
    "song-editor": SongEditor,
  },
};
</script>

<style lang="scss" scoped></style>
