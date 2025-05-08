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
        callbacks: {
            signInSuccessWithAuthResult: function(authResult, redirectUrl) {
            console.log('FirebaseUI signInSuccessWithAuthResult:', authResult);
            console.log('FirebaseUI redirectUrl:', redirectUrl);
            return true;
            },
            signInFailure: function(error) {
            console.error('FirebaseUI signInFailure:', error);
            return Promise.resolve(); // Nebo jiná logika pro reset UI
            },
            uiShown: function() {
            console.log('FirebaseUI uiShown');
            }
        }
        };
    ui.start("#firebaseui-auth-container", uiConfig);
  },
};
</script>

<style lang="scss" scoped>
</style>