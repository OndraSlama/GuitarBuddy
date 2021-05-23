<template>
	<div class="text-center" v-if="user">
		<div>
			<img :src="user.photoURL" style="width:clamp(100px, 30%, 200px);clamp(100px, 30%, 200px);border-radius:50%; border:4px solid #333" />
		</div>
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

				<!-- <div @click.stop="currentPreferences.showTabs = !showTabs">
					<v-row style="height: 50px ">
						<v-col style="height: 50px; min-width: 150px; flex-grow: 5">
							Show chord tabs
						</v-col>
						<v-col>
							<v-switch class="my-0 py-0" style="height: 30px; width:50px" @click.stop v-model="currentPreferences.showTabs" inset></v-switch>
						</v-col>
					</v-row>
				</div> -->
			</div>

			<!-- <v-divider></v-divider> -->

			<!-- {{ currentPreferences }} -->
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
		this.$store.commit("setCurrentPage", this.user.displayName);
		this.currentPreferences = { ...this.storePreferences };
	},

	watch: {
		currentPreferences: {
			handler: function() {
				this.$store.dispatch("updatePreferences", this.currentPreferences);
			},
			deep: true,
		},
	},
};
</script>

<style lang="scss" scoped></style>
