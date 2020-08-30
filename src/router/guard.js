import store from "../store";
export default (to, from, next) => {
	if (store.getters.getUserLogged) {
		next();
	} else {
		next("/login");
	}
};
