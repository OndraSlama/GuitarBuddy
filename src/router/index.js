import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import AuthGuard from "../router/guard";
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
		beforeEnter: AuthGuard,
	},
	{
		path: "/add-song",
		name: "AddSong",
		component: () => import("../views/AddSong.vue"),
		beforeEnter: AuthGuard,
	},
	{
		path: "/song/:id",
		name: "SongSheet",
		component: () => import("../views/SingleSong.vue"),
	},
	{
		path: "/edit-song/:id",
		name: "EditSong",
		component: () => import("../views/EditSong.vue"),
		beforeEnter: AuthGuard,
	},
	{
		path: "/login",
		name: "LoginPage",
		props: (route) => ({ redirect: route.query.redirect }),
		component: () => import("../views/LoginPage.vue"),
	},
	{
		path: "/user",
		name: "UserPage",
		component: () => import("../views/UserPage.vue"),
	},
];

const router = new VueRouter({
	mode: "history",
	base: process.env.BASE_URL,
	routes,
});

export default router;
