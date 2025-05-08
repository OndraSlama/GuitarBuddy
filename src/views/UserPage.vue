<template>
	<div class="text-center" v-if="user">
		<div>
			<div class="headline">
				<div>
					{{ user.displayName }}
				</div>
			</div>
		</div>
		<v-card class="mt-4 mx-auto" style="width:clamp(500px, 75%, 1000px)">
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
		</v-card>
	</div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
	data() {
		return {
			currentPreferences: {},
		};
	},

	computed: {
		...mapGetters({
			user: "getUser",
			storePreferences: "getUserPreferences",
			notations: "getNotations",
			fontSizePreferences: "getFontSizePreferences",
		}),
	},

	mounted() {
		if (this.user) {
			this.$store.commit("setCurrentPage", this.user.displayName);
		}
		this.currentPreferences = { ...this.storePreferences };
	},

	watch: {
		currentPreferences: {
			handler: function(newVal) {
                console.log("updating preferences", newVal);
                this.$store.dispatch("updatePreferences", this.currentPreferences);
			},
			deep: true,
		},
		storePreferences: {
			handler(newPrefs) {
                this.currentPreferences = { ...newPrefs };
			},
			deep: true,
		}
	},
};
</script>

<style lang="scss" scoped></style>