import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import insomnia from "./plugins/insomnia";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";
import GeneralDialog from "./components/Dialogs/GeneralDialog.vue";
import DeleteDialog from "./components/Dialogs/DeleteDialog.vue";
import EditPublicSongDialog from "./components/Dialogs/EditPublicSongDialog.vue";
import SelectSongbookDialog from "./components/Dialogs/SelectSongbookDialog.vue";
import ShareSessionDialog from "./components/Dialogs/ShareSessionDialog.vue";
import moment from "moment";
import viewportSize from "./mixins/viewportSize";

firebase.initializeApp({
	apiKey: "AIzaSyAF_ixmGuQrZZWTPFLD3O8w-6fovmhlyQQ",
	authDomain: "guitarbuddy-bcd3c.firebaseapp.com",
	databaseURL: "https://guitarbuddy-bcd3c.firebaseio.com",
	projectId: "guitarbuddy-bcd3c",
	storageBucket: "guitarbuddy-bcd3c.appspot.com",
	messagingSenderId: "267513568910",
	appId: "1:267513568910:web:1e1ba1daa7f90ea6fc33df",
	measurementId: "G-JDZY638NH4",
});

const app = createApp(App);

app.config.globalProperties.$moment = moment;

app.use(router);
app.use(store);
app.use(vuetify);
app.use(insomnia);
app.mixin(viewportSize);
app.component("general-dialog", GeneralDialog);
app.component("delete-dialog", DeleteDialog);
app.component("edit-public-song-dialog", EditPublicSongDialog);
app.component("select-songbook-dialog", SelectSongbookDialog);
app.component("share-session-dialog", ShareSessionDialog);

store.dispatch("setUserStatusChange");

app.mount("#app");

// Functions
String.prototype.insert = function(index, string, space = " ") {
	if (index > 0) {
		let thisString = this.substring(0);
		while (thisString.length < index) {
			thisString = thisString + space;
		}

		return thisString.substring(0, index) + string + thisString.substring(index, thisString.length);
	}

	return string + this;
};

Array.prototype.last = function() {
	return this[this.length - 1];
};
