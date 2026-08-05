// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
// import AuthGuard from "../router/guard"; // Stále ho můžeme používat pro jiné cesty
import store from "../store"; // Potřebujeme store pro kontrolu přihlášení
import firebase from "firebase/compat/app";
import "firebase/compat/auth";

// Firebase restores a persisted session asynchronously, so on a hard page load
// the guard must wait for the first auth emission before deciding - otherwise
// deep links to guarded routes always bounce through /login. Created lazily:
// this module is imported before firebase.initializeApp() runs in main.js.
let authReady = null;
function waitForAuthReady() {
	if (!authReady) {
		authReady = new Promise((resolve) => {
			const unsubscribe = firebase.auth().onAuthStateChanged(() => {
				unsubscribe();
				resolve();
			});
		});
	}
	return authReady;
}

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

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
});

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isPlaySessionBaseRoute = to.name === 'PlaySessionBase'; // Cesta /play-session bez ID

  // Only routes whose outcome depends on auth wait for it; public pages render immediately
  if (requiresAuth || isPlaySessionBaseRoute) await waitForAuthReady();

  const userIsLoggedIn = store.getters.getUserLogged;
  const lastActiveSessionId = localStorage.getItem('lastActiveSessionId');

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