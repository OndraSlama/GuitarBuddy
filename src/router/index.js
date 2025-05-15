// src/router/index.js
import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
// import AuthGuard from "../router/guard"; // Stále ho můžeme používat pro jiné cesty
import store from "../store"; // Potřebujeme store pro kontrolu přihlášení

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
		path: "/play-session/:id",
		name: "PlaySessionWithId",
		component: () => import("../views/PlaySession.vue"),
		meta: { requiresAuth: false, isPlaySessionRoute: true }
	},
	{
		path: "/play-session", // Cesta bez ID
		name: "PlaySessionBase",
		component: () => import("../views/PlaySession.vue"),
		meta: { requiresAuth: true, isPlaySessionRoute: true }
	},
	{
		path: "/add-song",
		name: "AddSong",
		component: () => import("../views/AddSong.vue"),
		meta: { requiresAuth: true }
	},
	{
		path: "/song/:id",
		name: "SongSheet",
		component: () => import("../views/SingleSong.vue"),
		meta: { requiresAuth: false }
	},
	{
		path: "/edit-song/:id",
		name: "EditSong",
		component: () => import("../views/EditSong.vue"),
		meta: { requiresAuth: true }
	},
	{
		path: "/login",
		name: "LoginPage",
		props: (route) => ({ redirect: route.query.redirect }),
		component: () => import("../views/LoginPage.vue"),
		meta: { requiresAuth: false }
	},
	{
		path: "/user",
		name: "UserPage",
		component: () => import("../views/UserPage.vue"),
		meta: { requiresAuth: true }
	},
];

const router = new VueRouter({
	mode: "history",
	base: process.env.BASE_URL,
	routes,
});

router.beforeEach((to, from, next) => {
  const userIsLoggedIn = store.getters.getUserLogged;
  const lastActiveSessionId = localStorage.getItem('lastActiveSessionId');
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isPlaySessionBaseRoute = to.name === 'PlaySessionBase'; // Cesta /play-session bez ID

  if (isPlaySessionBaseRoute && !userIsLoggedIn && lastActiveSessionId) {
    // Uživatel kliknul na "Play Session" v menu, není přihlášen, ale má session v localStorage
    console.log(`Router Guard: Redirecting to last active session: /play-session/${lastActiveSessionId}`);
    next({ name: 'PlaySessionWithId', params: { id: lastActiveSessionId }, replace: true });
  } else if (requiresAuth && !userIsLoggedIn) {
    // Pokud cesta vyžaduje přihlášení a uživatel není přihlášen
    console.log(`Router Guard: Auth required for "${to.path}", redirecting to login.`);
    next({ name: 'LoginPage', query: { redirect: to.fullPath } });
  } else {
    // Ve všech ostatních případech (cesta nevyžaduje auth, nebo uživatel je přihlášen)
    next();
  }
});

export default router;