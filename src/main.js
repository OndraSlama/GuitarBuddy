import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";

Vue.config.productionTip = false;

new Vue({
	router,
	store,
	vuetify,
	render: (h) => h(App),
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
