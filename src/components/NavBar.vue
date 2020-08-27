<template>
  <div>
    <v-app-bar clipped-left flat app :hide-on-scroll="size.smAndDown">
      <v-app-bar-nav-icon class="hidden-lg-and-up" @click.stop="toggleSongList()"></v-app-bar-nav-icon>

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
          <v-icon :left="!size.xsAndDown">{{route.icon}}</v-icon>
          <span class="hidden-xs-and-down">{{route.name}}</span>
        </v-btn>
      </v-toolbar-items>

      <v-spacer></v-spacer>

      <!-- <v-btn icon>
        <v-icon>mdi-magnify</v-icon>
      </v-btn>-->

      <!-- <v-btn icon>
        <v-icon>mdi-heart</v-icon>
      </v-btn>-->

      <!-- <v-btn icon>
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>-->

      <v-btn icon @click="$vuetify.theme.dark = !$vuetify.theme.dark">
        <v-icon>mdi-invert-colors</v-icon>
      </v-btn>
      <v-btn text @click="login">
        <v-icon left>mdi-login-variant</v-icon>
        <span>Sign In</span>
      </v-btn>
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
        <span class="hidden-xs-and-down">{{route.name}}</span>
        <v-icon>{{route.icon}}</v-icon>
      </v-btn>
    </v-bottom-navigation>
  </div>
</template>

<script>
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
    login() {
      console.log("logging in");
    },
    toggleSongList() {
      this.$store.commit("toggleSongListOpened");
    },
  },
  computed: {
    size() {
      console.log(this.$vuetify.breakpoint.name);
      return this.$vuetify.breakpoint;
    },
  },
};
</script>

<style lang="scss" scoped>
</style>