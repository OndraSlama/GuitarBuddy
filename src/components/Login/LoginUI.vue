<template>
  <section id="firebaseui-auth-container" class="ml-n7"></section>
</template>

<script>
import * as firebase from "firebase";
import * as firebaseui from "firebaseui";
import "firebaseui/dist/firebaseui.css";
export default {
  props: ["next"],
  mounted() {
    let ui = firebaseui.auth.AuthUI.getInstance();
    if (!ui) {
      ui = new firebaseui.auth.AuthUI(firebase.auth());
    }
    var uiConfig = {
      signInSuccessUrl: this.next === undefined ? "/" : this.next,
      signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.FacebookAuthProvider.PROVIDER_ID,
      ],
    };
    ui.start("#firebaseui-auth-container", uiConfig);
  },
};
</script>

<style lang="scss" scoped>
</style>