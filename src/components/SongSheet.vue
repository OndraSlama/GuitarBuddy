<template>
	<fullscreen :fullscreen.sync="fullscreen" :background="$vuetify.theme.dark ? '#121212' : '#ffffff'">
		<!-- <template v-slot:extension> -->
		<!-- </template> -->
		<v-sheet class="px-7 py-3 elevation-4" style="position: relative">
			<v-row class="floating-buttons">
				<v-fab-transition>
					<v-btn v-show="!fullscreenButtonTransition" large icon @click="onFullscreenToggle">
						<v-icon v-if="fullscreen">mdi-fullscreen-exit</v-icon>
						<v-icon v-else>mdi-fullscreen</v-icon>
					</v-btn>
				</v-fab-transition>
				<v-menu rounded="large" transition="slide-y-transition" bottom>
					<template v-slot:activator="{ on: onMenu }">
						<v-fab-transition>
							<v-btn v-show="!fullscreenButtonTransition" icon @click.stop.prevent large :disabled="fullscreen" v-on="{ ...onMenu }">
								<v-icon>mdi-dots-vertical</v-icon>
							</v-btn>
						</v-fab-transition>
					</template>
					<v-list class="py-0">
						<v-list-item :disabled="floatingBtnsDisabled || !userIsCreator" :to="'/edit-song/' + songId">
							<v-list-item-icon>
								<v-icon :disabled="floatingBtnsDisabled || !userIsCreator">mdi-pencil-outline</v-icon>
							</v-list-item-icon>
							<v-list-item-title>Edit</v-list-item-title>
						</v-list-item>
						<v-list-item :disabled="floatingBtnsDisabled || !userIsCreator" @click="$store.dispatch('deleteSong', songId)">
							<v-list-item-icon>
								<v-icon :disabled="floatingBtnsDisabled || !userIsCreator">mdi-delete-outline</v-icon>
							</v-list-item-icon>
							<v-list-item-title>Delete</v-list-item-title>
						</v-list-item>

						<v-list-item>
							<v-tooltip top>
								<template v-slot:activator="{ on, attrs }">
									<v-list-item-icon v-bind="attrs" v-on="on">
										<v-icon>mdi-format-size</v-icon>
									</v-list-item-icon>
								</template>
								<span>Font size preference</span>
							</v-tooltip>
							<v-list-item-content>
								<!-- <v-slider
                  @click.prevent.stop
                  :min="6"
                  :max="26"
                  step="1"
                  v-model="minFontSize"
                  style="width: 200px"
                ></v-slider>-->

								<v-select @click.stop.prevent v-model="currentFontSizePreference" :items="fontSizePreferences" label="Font size" class="my-n3" solo></v-select>
							</v-list-item-content>
						</v-list-item>
					</v-list>
				</v-menu>
			</v-row>
			<v-row v-if="songValid">
				<v-col align-self="end">
					<p class="subtitle text--primary">{{ song.author }}</p>
					<p class="display-2 text--primary">{{ song.title ? song.title : "Song preview" }}</p>
				</v-col>
				<!-- <v-spacer v-for="n in 10" :key="n"></v-spacer> -->

				<v-col class="text-start" style="maxWidth: 110px" align-self="end">
					<v-btn-toggle v-model="multipleColumns" rounded mandatory>
						<v-tooltip top>
							<template v-slot:activator="{ on, attrs }">
								<v-btn @click="onColumnChange" v-bind="attrs" v-on="on">
									<v-icon>mdi-table-column</v-icon>
									<!-- <span>Column</span> -->
								</v-btn>
							</template>
							<span>Song in one long column</span>
						</v-tooltip>

						<v-tooltip top>
							<template v-slot:activator="{ on, attrs }">
								<v-btn icon @click="onColumnChange" v-bind="attrs" v-on="on">
									<v-icon>mdi-view-dashboard-outline</v-icon>
									<!-- <span>Dynamic</span> -->
								</v-btn>
							</template>
							<span>Stack song in multiple columns to fit screen</span>
						</v-tooltip>
					</v-btn-toggle>
				</v-col>
			</v-row>
			<div v-if="songValid && song.sections.length > 0" :class="['text--primary', 'song-sheet', 'mt-3', multipleColumns ? 'multiple-columns' : '']" ref="songSheet">
				<v-sheet :class="['mb-3 ', 'section', multipleColumns ? 'multiple-columns mt-3' : '']" :style="{ 'font-size': sectionFontSize + 'px' }" @keydown="dynamicSectionFontSize = maxFontSize" v-for="(section, i) in songSections" :key="i">
					<v-divider v-if="!multipleColumns && i > 0" class="mb-5"></v-divider>
					<div v-html="formatSection(section)"></div>
				</v-sheet>
			</div>
		</v-sheet>
	</fullscreen>
</template>

<script>
import { mapGetters } from "vuex";
export default {
	props: ["song", "expanded"],

	data() {
		return {
			multipleColumns: false,
			dynamicSectionFontSize: 20,
			fontSizePreferences: ["Small", "Medium", "Large"],
			currentFontSizePreference: "Small",
			maxFontSize: 35,
			fullscreen: false,
			fullscreenButtonTransition: false,
		};
	},

	methods: {
		onColumnChange() {
			//   this.minFontSize = 9;
			this.dynamicSectionFontSize = this.maxFontSize;
		},

		formatSection(section) {
			let textWithChordsAbove = "<span class='" + section.name + "'><div class='font-weight-black mb-1'>" + section.name.charAt(0).toUpperCase() + section.name.slice(1) + "</div>";
			(section.lines || []).forEach((e) => {
				let chordLine = "";
				if (e.chords != undefined && e.chords.length != 0) {
					e.chords.forEach((ch, i) => {
						if (i == 0) {
							chordLine = chordLine.insert(ch[0], "<span class='chord'>" + ch[1] + "</span>");
						} else {
							chordLine = chordLine.insert(chordLine.length + (ch[0] - (e.chords[i - 1][0] + e.chords[i - 1][1].length)), "<span class='chord'>" + ch[1] + "</span>");
						}
					});
					chordLine += "<br>";
				}
				textWithChordsAbove += chordLine + e.lyrics + "<br>";
			});
			return textWithChordsAbove + "</span>";
		},

		updateFontSize() {
			//   if (this.multipleColumns) {
			if (this.$refs.songSheet == undefined) return;
			const width = this.$refs.songSheet.clientWidth;
			const overflowDiff = width - this.$refs.songSheet.scrollWidth;
			if (overflowDiff < 0 && this.dynamicSectionFontSize > this.minFontSize) {
				this.dynamicSectionFontSize *= 0.95;
			}

			//   } else {
			//     this.dynamicSectionFontSize = 16;
			//   }
		},

		onResize() {
			this.dynamicSectionFontSize = this.maxFontSize;
			this.updateFontSize();
		},

		onFullscreenToggle() {
			this.fullscreen = !this.fullscreen;
		},
	},

	computed: {
		floatingBtnsDisabled() {
			return this.song === undefined || this.song.id === undefined;
		},

		userIsCreator() {
			if (this.song === undefined && this.song.id === undefined) return false;
			if (!this.userLogged) return false;
			return this.song.createdBy === this.user.uid;
		},

		songId() {
			if (this.song !== undefined) {
				return this.song.id;
			} else {
				return "";
			}
		},

		minFontSize() {
			switch (this.fontSizePreferences.indexOf(this.currentFontSizePreference)) {
				case 0:
					return 9;
				case 1:
					return 13;
				case 2:
					return 18;
			}

			return 12;
		},

		songSections() {
			return this.song.sections;
		},

		sectionFontSize() {
			if (!this.multipleColumns) {
				return Math.min(Math.max(this.minFontSize, 16), this.dynamicSectionFontSize);
			} else {
				return this.dynamicSectionFontSize;
			}
		},
		size() {
			return this.$vuetify.breakpoint;
		},
		songValid() {
			return this.song !== undefined && this.song.title !== undefined && this.song.author !== undefined && this.song.sections !== undefined;
		},
		...mapGetters({
			songListLoading: "getSongListLoading",
			user: "getUser",
			userLogged: "getUserLogged",
		}),
	},

	created() {
		this.fullscreenButtonTransition = true;
		setTimeout(() => {
			this.fullscreenButtonTransition = false;
		}, 400);
		window.addEventListener("resize", this.onResize);
	},
	destroyed() {
		window.removeEventListener("resize", this.onResize);
	},
	updated() {
		this.updateFontSize();
	},
	watch: {
		minFontSize: function() {
			this.dynamicSectionFontSize = this.maxFontSize;
			this.updateFontSize();
		},
		expanded: function() {
			this.dynamicSectionFontSize = this.maxFontSize;
			this.updateFontSize();
		},
	},
};
</script>

<style lang="scss" scoped>
.section {
	display: block;
	// border: 1px solid blue;
	white-space: pre;
	font-family: "Roboto Mono", monospace;
}

.section.multiple-columns {
	display: inline-block;
	//   border: 1px solid green;
	font-size: 100%;
}

.floating-buttons {
	position: absolute;
	right: 20px;
}

.song-sheet {
	overflow-y: auto;
	// border: 1px solid green;
	// align-items: center;
}
.song-sheet.multiple-columns {
	display: flex;
	flex-flow: column;
	flex-wrap: wrap;
	max-height: 90vh;
}
</style>
