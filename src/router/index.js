import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
// import  from "../views/Home.vue";

Vue.use(VueRouter);

const routes = [
	{
		path: "/",
		name: "Home",
		component: Home,
	},
	{
		path: "/about",
		name: "About",
		component: () => import("../views/About.vue"),
	},
	{
		path: "/song-book",
		name: "SongBook",
		component: () => import("../views/SongBook.vue"),
	},
	{
		path: "/add-song",
		name: "AddSong",
		component: () => import("../views/AddSong.vue"),
	},
];

const router = new VueRouter({
	mode: "history",
	base: process.env.BASE_URL,
	routes,
});

export default router;
