<template>
  <v-app>
    <nav-bar></nav-bar>
    <v-main>
      <router-view></router-view>
    </v-main>
    <app-footer></app-footer>
  </v-app>
</template>

<script>
import NavBar from "../src/components/NavBar";
import Footer from "../src/components/Footer";
export default {
  name: "App",

  components: { "nav-bar": NavBar, "app-footer": Footer },

  data: () => ({
    //
  }),
};
</script>

<style >
.chord {
  color: rgb(255, 92, 92);
}
.thin-border {
  border: 1px solid rgb(104, 104, 104);
}
</style>
