<template>
  <div>
    <v-app-bar clipped-left flat app :hide-on-scroll="size.smAndDown">
      <v-app-bar-nav-icon v-if="userLogged" class="hidden-lg-and-up" @click.stop="toggleSongList()"></v-app-bar-nav-icon>

      <v-toolbar-title class="hidden-sm-and-down">@hordeon</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items class="hidden-sm-and-down">
        <v-btn
          :v-show="size.smAndUp"
          v-for="route in routes"
          :key="route.name"
          text
          :to="route.link"
        >
          <v-icon :left="!size.xsAndDown">{{ route.icon }}</v-icon>
          <span class="hidden-xs-and-down">{{ route.name }}</span>
        </v-btn>
      </v-toolbar-items>

      <v-spacer></v-spacer>

      <v-btn icon @click="$vuetify.theme.dark = !$vuetify.theme.dark">
        <v-icon>mdi-invert-colors</v-icon>
      </v-btn>
      <v-toolbar-items>
        <v-btn v-if="!userLogged" text @click="signIn">
          <v-icon left>mdi-login-variant</v-icon>
          <span>Sign In</span>
        </v-btn>
        <!-- <login-dialog></login-dialog> -->
        <v-btn v-if="userLogged" text @click.stop="signOut">
          <v-icon left>mdi-login-variant</v-icon>
          <span>Sign Out</span>
        </v-btn>
        <v-btn icon v-if="userLogged" to="/user">
          <img
            style="width:45px;height:45px;border-radius:50%"
            :src="user.photoURL"
            :alt="user.displayName"
          />
        </v-btn>
      </v-toolbar-items>
    </v-app-bar>

    <v-bottom-navigation class="hidden-md-and-up" fixed grow>
      <v-btn
        small
        :v-show="size.smAndUp"
        v-for="route in routes"
        :key="route.name"
        text
        :to="route.link"
      >
        <span class="hidden-xs-and-down">{{ route.name }}</span>
        <v-icon>{{ route.icon }}</v-icon>
      </v-btn>
    </v-bottom-navigation>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  data() {
    return {
      routes: [
        { name: "Home", link: "/", icon: "mdi-home-outline" },
        {
          name: "My Songs",
          link: "/song-book",
          icon: "mdi-playlist-music-outline",
        },
        {
          name: "Add Song",
          link: "/add-song",
          icon: "mdi-plus-circle-outline",
        },
      ],
    };
  },
  methods: {
    signOut() {
      this.$store
        .dispatch("logout")
        .then(this.$router.push("/login").catch(() => {}));
    },
    signIn() {
      //   this.$store.commit("setDialogOpened", true);
      this.$router.push("/login").catch(() => {});
    },
    toggleSongList() {
      this.$store.commit("toggleSongListOpened");
    },
  },
  computed: {
    size() {
      return this.$vuetify.breakpoint;
    },
    ...mapGetters({
      userLogged: "getUserLogged",
      user: "getUser",
    }),
  },
};
</script>

<style lang="scss" scoped></style>
