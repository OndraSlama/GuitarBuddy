import NoSleep from "nosleep.js";

// Replacement for vue-insomnia (Vue 2 only): keeps the screen awake via nosleep.js.
// Browsers require a user gesture to start the wake lock, so enabling waits for
// the first pointer interaction after on() is called.
export default {
	install(app) {
		const noSleep = new NoSleep();
		let pendingEnable = null;

		app.config.globalProperties.vueInsomnia = () => ({
			on() {
				if (pendingEnable) return;
				pendingEnable = () => {
					noSleep.enable().catch(() => {});
					document.removeEventListener("click", pendingEnable);
					document.removeEventListener("touchstart", pendingEnable);
					pendingEnable = null;
				};
				document.addEventListener("click", pendingEnable);
				document.addEventListener("touchstart", pendingEnable);
			},
			off() {
				if (pendingEnable) {
					document.removeEventListener("click", pendingEnable);
					document.removeEventListener("touchstart", pendingEnable);
					pendingEnable = null;
				}
				noSleep.disable();
			},
		});
	},
};
