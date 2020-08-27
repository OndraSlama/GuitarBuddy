<template>
	<div>
		<v-navigation-drawer v-model="opened" :permanent="size.lgAndUp" :temporary="size.xs" app overflow clipped width="350">
			<!-- <div v-for="song in songs" :key="song.id" class="ma-3">
				<span>{{ song.title }}</span> <v-btn :to="'/song/' + song.id">Go to song</v-btn>
			</div> -->

			<v-list two-line subheader>
				<v-subheader>Collection</v-subheader>
				<v-list-item v-for="song in songs" :key="song.id" router :to="'/song/' + song.id">
					<!-- <v-list-item-action>
						<v-icon class="white--text">{{ link.icon }}</v-icon>
					</v-list-item-action> -->
					<v-list-item-content>
						<v-list-item-title>{{ song.title }}</v-list-item-title>
						<v-list-item-subtitle>{{ song.author }}</v-list-item-subtitle>
					</v-list-item-content>
					<v-list-item-action>
						<v-btn small icon @click="deleteSong(song.id)">
							<v-icon>mdi-delete</v-icon>
						</v-btn>
					</v-list-item-action>
				</v-list-item>
			</v-list>
		</v-navigation-drawer>
	</div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
	data() {
		return {};
	},
	methods: {
		deleteSong(id) {
			this.$store.commit("deleteSong", id);
		},
	},
	computed: {
		size() {
			console.log(this.$vuetify.breakpoint.name);
			return this.$vuetify.breakpoint;
		},
		opened: {
			get() {
				return this.openedStore;
			},
			set(val) {
				this.$store.commit("setSongListOpened", val);
			},
		},

		...mapGetters({
			songs: "getSongs",
		}),
	},
};
</script>

<style lang="scss" scoped></style>
