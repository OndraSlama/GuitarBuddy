<template>
	<div class="text-center" v-if="user">
		<div>
			<div class="headline">
				<div>
					{{ user.displayName }}
				</div>
			</div>
		</div>

		<!-- Zobrazit loader, dokud nejsou preference načteny -->
		<v-progress-circular indeterminate color="primary" class="my-10" v-if="!initialPreferencesLoaded"></v-progress-circular>

		<v-card v-if="initialPreferencesLoaded" class="mt-4 mx-auto" style="width:clamp(500px, 75%, 1000px)">
			<v-card-title primary-title>
				Preferences
			</v-card-title>

			<div class="pb-2">
				<div class="d-flex justify-space-between mx-4" style="height:50px;">
					<div class=" align-self-center">Preferred font size</div>
					<div class="" style="width: 50%">
						<v-select v-model="currentPreferences.fontSize" :items="fontSizePreferences" label="Font size" solo flat></v-select>
					</div>
				</div>

				<div class="d-flex justify-space-between mx-4" style="height:50px;">
					<div class=" align-self-center">Chord notation</div>
					<div class="" style="width: 50%">
						<v-select v-model="currentPreferences.notation" :items="notations" label="Chord notation" solo flat></v-select>
					</div>
				</div>

				<div class="d-flex justify-space-between mx-4" style="height:50px;">
					<div class=" align-self-center">Song text layout</div>
					<div class="d-flex align-center justify-space-around" style="width: 50%">
						<v-btn class="mr-4 elevation-0" @click="currentPreferences.multipleColumns = false" :color="!currentPreferences.multipleColumns ? 'primary' : ''">
							<v-icon :left="viewportSize.lgAndUp">mdi-table-column</v-icon>
							<span v-if="viewportSize.lgAndUp">Column</span>
						</v-btn>
						<v-switch v-model="currentPreferences.multipleColumns" inset color="gray"> </v-switch>
						<v-btn class="mr-4 elevation-0" @click="currentPreferences.multipleColumns = true" :color="currentPreferences.multipleColumns ? 'primary' : ''">
							<v-icon :left="viewportSize.lgAndUp">mdi-view-dashboard-outline</v-icon>
							<span v-if="viewportSize.lgAndUp">Dynamic</span>
						</v-btn>
					</div>
				</div>

				<div class="d-flex justify-space-between mx-4" style="height:50px;">
					<div class=" align-self-center">Show chord tabs</div>
					<div class="align-self-center pl-2" style="width: 50%">
						<v-switch class="mt-0 mb-n2 py-0" style="height: 30px; width:50px" @click.stop v-model="currentPreferences.showTabs" inset></v-switch>
					</div>
				</div>
				<div class="d-flex justify-space-between mx-4" style="height:50px;">
					<div class=" align-self-center">Scroll speed</div>
					<div class="align-self-center pl-2" style="width: 50%">
						<v-slider @click.stop.prevent v-model="currentPreferences.scrollSpeed" solo flat></v-slider>
					</div>
				</div>
			</div>
			<v-divider></v-divider>
			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn text @click="resetChanges" :disabled="!isDirty || isLoading">
					Reset
				</v-btn>
				<v-btn color="primary" @click="savePreferences" :disabled="!isDirty || isLoading" :loading="isLoading">
					Save Changes
				</v-btn>
			</v-card-actions>
		</v-card>
		<v-snackbar v-model="snackbar" :timeout="4000" :color="snackbarColor">
			{{ snackbarMessage }}
			<template v-slot:action="{ attrs }">
				<v-btn text v-bind="attrs" @click="snackbar = false">
					Close
				</v-btn>
			</template>
		</v-snackbar>
	</div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
	data() {
		return {
			currentPreferences: {}, // Bude inicializováno v mounted nebo watcherem
			isLoading: false,
			snackbar: false,
			snackbarMessage: "",
			snackbarColor: "success",
			initialPreferencesLoaded: false, // Nový flag pro sledování načtení
		};
	},

	computed: {
		...mapGetters({
			user: "getUser",
			storePreferences: "getUserPreferences", // Toto je getter, který vrací default, pokud nejsou načteny
			notations: "getNotations",
			fontSizePreferences: "getFontSizePreferences",
			// Přidáme getter pro defaultní preference pro porovnání
			defaultPreferencesFromStore: "getDefaultPreferences",
		}),
		isDirty() {
			// Porovnáváme aktuální lokální stav s tím, co je ve store (což by měly být uložené/poslední známé preference)
			return JSON.stringify(this.currentPreferences) !== JSON.stringify(this.storePreferences);
		}
	},

	methods: {
		// Metoda pro inicializaci/reset lokálních currentPreferences z Vuex store
		syncLocalPreferencesFromStore() {
			console.log("UserPage: Syncing local preferences from store.");
			this.currentPreferences = JSON.parse(JSON.stringify(this.storePreferences));
		},

		async savePreferences() {
			if (!this.isDirty) {
				this.snackbarMessage = "No changes to save.";
				this.snackbarColor = "info";
				this.snackbar = true;
				return;
			}
			console.log("Attempting to save preferences:", JSON.parse(JSON.stringify(this.currentPreferences)));

			this.isLoading = true;
			try {
				await this.$store.dispatch("updatePreferences", this.currentPreferences);
				console.log("Preferences dispatch reported success from component.");
				this.snackbarMessage = "Preferences saved successfully!";
				this.snackbarColor = "success";
				this.snackbar = true;
				// isDirty se stane false, jakmile watcher storePreferences aktualizuje currentPreferences
			} catch (error) {
				console.error("Error saving preferences from component:", error);
				this.snackbarMessage = `Failed to save preferences: ${error?.message || "Unknown error. Check console."}`;
				this.snackbarColor = "error";
				this.snackbar = true;
			} finally {
				this.isLoading = false;
			}
		},
		resetChanges() {
			this.syncLocalPreferencesFromStore(); // Resetuje na aktuální stav ve store
			this.snackbarMessage = "Changes discarded.";
			this.snackbarColor = "info";
			this.snackbar = true;
		}
	},

	mounted() {
		if (this.user) {
			this.$store.commit("setCurrentPage", this.user.displayName);
		}
	},

	watch: {
		storePreferences: {
			handler(newPrefs) {
				console.log("UserPage: storePreferences watcher triggered. NewPrefs:", newPrefs);
				if (!this.initialPreferencesLoaded || !this.isDirty) {
					this.syncLocalPreferencesFromStore();
				}

				if (Object.keys(newPrefs).length > 0) {
					if (this.user) {
						console.log("UserPage: Setting initialPreferencesLoaded to true.");
						this.initialPreferencesLoaded = true;
					}
				}
			},
			deep: true,
			immediate: true, // Spustí handler okamžitě po vytvoření komponenty s aktuální hodnotou storePreferences
		},
		user(newUser) {
            // Pokud se uživatel změní (např. přihlášení), resetujeme flag, aby se preference znovu načetly/zvalidovaly
            this.initialPreferencesLoaded = false;
			if (newUser) {
				this.$store.commit("setCurrentPage", newUser.displayName);
			} else {
				// Uživatel odhlášen, můžeme resetovat
				this.currentPreferences = JSON.parse(JSON.stringify(this.defaultPreferencesFromStore));
			}
		}
	},
};
</script>

<style lang="scss" scoped></style>