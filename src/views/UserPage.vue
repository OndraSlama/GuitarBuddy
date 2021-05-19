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
			<div>
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

						<!-- <v-tooltip top>
							<template v-slot:activator="{ on, attrs }">
								<v-btn text large @click="currentPreferences.multipleColumns = false" v-bind="attrs" :color="!currentPreferences.multipleColumns ? 'primary' : ''" v-on="on">
									<v-icon left>mdi-table-column</v-icon>
									<span> Standard </span>
								</v-btn>
							</template>
							<span>Song in one long column</span>
						</v-tooltip>

						<v-tooltip top>
							<template v-slot:activator="{ on, attrs }">
								<v-btn text large @click="currentPreferences.multipleColumns = true" v-bind="attrs" :color="currentPreferences.multipleColumns ? 'primary' : ''" v-on="on" class="mr-n5">
									<v-icon left>mdi-view-dashboard-outline</v-icon>
									<span> Dynamic </span>
								</v-btn>
							</template>
							<span>Stack song in multiple columns to fit screen</span>
						</v-tooltip> -->
					</div>
				</div>
			</div>
			{{ currentPreferences }}
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

	created() {
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
