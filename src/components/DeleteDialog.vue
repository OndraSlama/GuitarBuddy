<template>
  <v-dialog
    v-model="dialogOpened"
    scrollable
    :overlay="false"
    max-width="450px"
    transition="dialog-transition"
  >
    <v-card class="py-4">
      <!-- <v-card-title primary-title> -->
      <h3 class="display-1 ma-4 text--secondary text-center">Login to Guitar Buddy</h3>
      <!-- </v-card-title> -->
      <!-- <login-ui></login-ui> -->
    </v-card>
  </v-dialog>
</template>

<script>
// import LoginUI from "../Login/LoginUI";
// import { mapGetters } from "vuex";

export default {
  computed: {
    dialogOpened: {
      get() {
        return this.$store.getters.getDialogOpened;
      },
      set(value) {
        this.$store.commit("setDialogOpened", value);
      },
    },
    // ...mapGetters({
    // 	dialogOpened: "getDialogOpened",
    // }),
  },
  //   components: {
  //     "login-ui": LoginUI,
  //   },
};
</script>

<style lang="scss" scoped>
</style>