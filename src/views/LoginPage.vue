<template>
  <div>
    <p
      v-if="willRedirect"
      class="display-1 text--secondary text-center mb-10"
    >You must be logged in to access this page</p>
    <p
      v-if="!willRedirect"
      class="display-1 text--secondary text-center mb-10"
    >Login to Guitar Buddy</p>
    <login-ui :next="this.redirect"></login-ui>
    <!-- <v-row>
      <v-col class="text-center">
        <v-scale-transition hide-on-leave>
          <v-btn x-large v-show="!dialogOpened" @click="openLoginDialog">Login</v-btn>
        </v-scale-transition>
      </v-col>
    </v-row>-->
  </div>
</template>

<script>
import LoginUI from "../components/Login/LoginUI";
import { mapGetters } from "vuex";
export default {
  data() {
    return {};
  },
  props: ["redirect"],
  computed: {
    willRedirect() {
      return !(this.redirect === undefined);
    },
    ...mapGetters({
      dialogOpened: "getDialogOpened",
      userLogged: "getUserLogged",
    }),
  },
  methods: {},
  created() {
    this.$store.commit("setCurrentPage", "Login");
  },
  components: {
    "login-ui": LoginUI,
  },

  watch: {
    userLogged() {
      if (this.userLogged) {
        this.$router.push(this.redirect);
      }
    },
  },
};
</script>

<style lang="scss" scoped></style>
