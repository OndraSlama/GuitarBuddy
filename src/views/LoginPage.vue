<template>
	<div>
		<p class="display-1">You must be logged in order to acces this page</p>
		<section id="firebaseui-auth-container"></section>
	</div>
</template>

<script>
import * as firebase from "firebase";
import * as firebaseui from "firebaseui";
import "firebaseui/dist/firebaseui.css";

export default {
	mounted() {
		let ui = firebaseui.auth.AuthUI.getInstance();
		if (!ui) {
			ui = new firebaseui.auth.AuthUI(firebase.auth());
		}
		var uiConfig = {
			signInSuccessUrl: "/song-book",
			signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID, firebase.auth.FacebookAuthProvider.PROVIDER_ID],
		};
		ui.start("#firebaseui-auth-container", uiConfig);
	},
};
</script>

<style lang="scss" scoped></style>
