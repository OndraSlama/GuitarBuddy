import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import * as firebase from "firebase";
import DeleteDialog from "./components/Dialogs/DeleteDialog";
import EditPublicSongDialog from "./components/Dialogs/EditPublicSongDialog";
import fullscreen from "vue-fullscreen";
import moment from "moment";
import vueInsomnia from "vue-insomnia";
import viewportSize from "./mixins/viewportSize";

Vue.prototype.$moment = moment;
Vue.config.productionTip = false;

Vue.use(vueInsomnia);
Vue.use(fullscreen);
Vue.mixin(viewportSize);
Vue.component("delete-dialog", DeleteDialog);
Vue.component("edit-public-song-dialog", EditPublicSongDialog);

new Vue({
	router,
	store,
	vuetify,
	render: (h) => h(App),
	created() {
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

		store.dispatch("setUserStatusChange");
	},
}).$mount("#app");

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
