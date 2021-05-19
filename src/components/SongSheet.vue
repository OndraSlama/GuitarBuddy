<template>
	<fullscreen :fullscreen.sync="fullscreen" :background="$vuetify.theme.dark ? '#121212' : '#ffffff'">
		<v-sheet style="position: relative" :class="type === 'modal' ? 'elevation-0' : 'elevation-2'">
			<!----------------------------------- Header toolbar ----------------------------------->
			<v-toolbar height="50px" class="elevation-0">
				<v-toolbar-items>
					<v-btn v-show="type === 'modal'" icon @click.stop="$emit('cancel')" class="ml-n3">
						<v-icon>mdi-window-close</v-icon>
					</v-btn>
					<v-btn icon @click="changeTranspose(-1)">
						<v-icon>mdi-minus</v-icon>
					</v-btn>
					<v-btn text :icon="collapse" class="mx-n2" @click="changeTranspose(-transpose)">
						<!-- <v-icon left>mdi-format-font-size-increase</v-icon> -->
						<span v-if="!collapse">Transpose ({{ transpose }})</span>
						<span v-else>{{ transpose }}</span>
					</v-btn>
					<v-btn icon @click="changeTranspose(1)">
						<v-icon>mdi-plus</v-icon>
					</v-btn>
				</v-toolbar-items>
				<v-spacer></v-spacer>
				<v-toolbar-items>
					<v-btn v-show="editable" text :icon="collapse" @click.stop="askIfEditSong(song)">
						<v-icon left>mdi-pencil-outline</v-icon>
						<span v-show="!collapse">Edit</span>
					</v-btn>
					<edit-public-song-dialog v-model="editPublicSongDialogOpened" v-on:accept="editPublicSong(currentSong)" />

					<v-btn v-show="deletable" text :icon="collapse" @click.stop="askIfDeleteSong(song)">
						<v-icon left>mdi-delete-outline</v-icon>
						<span v-show="!collapse">Delete</span>
					</v-btn>
					<delete-dialog v-model="deleteSongDialogOpened" v-on:accept="deleteSong(currentSong.id)" />
					<!-- <v-select @click.stop.prevent prepend-icon="mdi-format-size" v-model="currentFontSizePreference" :items="fontSizePreferences" label="Font size" solo flat></v-select> -->

					<v-fab-transition>
						<v-btn large icon @click="onFullscreenToggle">
							<v-icon v-if="fullscreen">mdi-fullscreen-exit</v-icon>
							<v-icon v-else>mdi-fullscreen</v-icon>
						</v-btn>
					</v-fab-transition>
				</v-toolbar-items>

				<!----------------------------------- Dropdown menu ----------------------------------->
				<v-toolbar-items>
					<v-menu rounded="large" transition="slide-y-transition" bottom>
						<template v-slot:activator="{ on: onMenu }">
							<v-fab-transition>
								<v-btn icon @click.stop.prevent large :disabled="fullscreen" v-on="{ ...onMenu }">
									<v-icon>mdi-dots-vertical</v-icon>
								</v-btn>
							</v-fab-transition>
						</template>
						<v-list class="py-0">
							<v-list-item :disabled="true">
								<v-list-item-icon>
									<v-icon :disabled="true">mdi-printer</v-icon>
								</v-list-item-icon>
								<v-list-item-title>Print</v-list-item-title>
							</v-list-item>

							<v-list-item :disabled="true">
								<v-list-item-icon>
									<v-icon :disabled="true">mdi-download-outline</v-icon>
								</v-list-item-icon>
								<v-list-item-title>Download pdf</v-list-item-title>
							</v-list-item>

							<v-list-item :disabled="true">
								<v-list-item-icon>
									<v-icon :disabled="true">mdi-export-variant</v-icon>
								</v-list-item-icon>
								<v-list-item-title>Export as txt</v-list-item-title>
							</v-list-item>

							<v-divider class="my-1"></v-divider>

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
									<v-select @click.stop.prevent v-model="currentFontSizePreference" :items="fontSizePreferences" label="Font size" class="mt-n4 ml-n2 mb-n12 py-0" solo flat></v-select>
								</v-list-item-content>
							</v-list-item>

							<v-list-item>
								<v-tooltip top>
									<template v-slot:activator="{ on, attrs }">
										<v-list-item-icon v-bind="attrs" v-on="on">
											<v-icon large class="ml-n1 mr-n3">{{ currentNotation == "German (A H C D E F G)" ? "mdi-alpha-b" : "mdi-alpha-h" }}</v-icon>
										</v-list-item-icon>
									</template>
									<span>Chord notation</span>
								</v-tooltip>
								<v-list-item-content>
									<v-select @click.stop.prevent v-model="currentNotation" :items="notations" item-text="text" item-value="value" label="Notation" class="mt-n4 ml-n2 mb-n12 py-0" solo flat></v-select>
								</v-list-item-content>
							</v-list-item>

							<v-list-item @click.stop="showTabs = !showTabs">
								<v-list-item-icon>
									<v-icon>mdi-help-circle-outline</v-icon>
								</v-list-item-icon>
								<!-- <v-list-item-content> -->
								<v-row style="height: 50px ">
									<v-col style="height: 50px; min-width: 150px; flex-grow: 5">
										Show chord tabs
									</v-col>
									<v-col>
										<v-switch class="my-0 py-0" style="height: 30px; width:50px" @click.stop v-model="showTabs" inset></v-switch>
									</v-col>
								</v-row>
								<!-- </v-list-item-content> -->
							</v-list-item>
						</v-list>
					</v-menu>
				</v-toolbar-items>
			</v-toolbar>
			<v-divider></v-divider>
			<div class="px-7 py-3">
				<v-row v-if="songValid" class="">
					<v-col class>
						<div class="display-2 text--primary" style="min-width: 200px">
							{{ song.title ? song.title : "Song preview" }}
						</div>
						<div class="text-h5 text--secondary">{{ song.author }}</div>
					</v-col>

					<v-col class="text-start ml-n5" style="max-width: 290px; min-width: 290px" align-self="start">
						<v-tooltip top>
							<template v-slot:activator="{ on, attrs }">
								<v-btn text large @click="onColumnChange(false)" v-bind="attrs" :color="!multipleColumns ? 'primary' : ''" v-on="on">
									<v-icon left>mdi-table-column</v-icon>
									<span> Standard </span>
									<!-- <span>Column</span> -->
								</v-btn>
							</template>
							<span>Song in one long column</span>
						</v-tooltip>

						<v-tooltip top>
							<template v-slot:activator="{ on, attrs }">
								<v-btn text large @click="onColumnChange(true)" v-bind="attrs" :color="multipleColumns ? 'primary' : ''" v-on="on" class="mr-n5">
									<v-icon left>mdi-view-dashboard-outline</v-icon>
									<span> Dynamic </span>
									<!-- <span>Dynamic</span> -->
								</v-btn>
							</template>
							<span>Stack song in multiple columns to fit screen</span>
						</v-tooltip>
					</v-col>
				</v-row>
				<!----------------------------------- Chord pictures ----------------------------------->
				<v-scroll-y-transition hide-on-leave>
					<div v-if="showTabs" class="d-flex">
						<div v-for="chord in distinctChords" :key="chord.symbol" style="max-width: 100px" class="ml-3">
							<div :id="chord.symbol"></div>
						</div>
					</div>
				</v-scroll-y-transition>
				<!----------------------------------- Song text ----------------------------------->
				<div v-if="songValid && song.sections.length > 0" :class="['text--primary', 'song-sheet', 'mt-3', multipleColumns ? 'multiple-columns' : '']" ref="songSheet">
					<v-card :class="['mb-3 ', 'section', 'elevation-0', multipleColumns ? 'multiple-columns mt-3 mr-6' : '']" :style="{ 'font-size': sectionFontSize + 'px' }" @keydown="dynamicSectionFontSize = maxFontSize" v-for="(section, i) in songSections" :key="i">
						<v-divider v-if="!multipleColumns && i > 0" class="mb-3"></v-divider>
						<div v-html="formatSection(section)"></div>
					</v-card>
				</div>
			</div>
		</v-sheet>
		<v-snackbar v-model="snackbar"> Screen won't turn off while in fullscreen mode </v-snackbar>
	</fullscreen>
</template>

<script>
import { mapGetters } from "vuex";
import { Chord } from "@tonaljs/tonal";
import jtab from "jtab";
export default {
	props: ["song", "expanded", "type"],

	data() {
		return {
			transpose: 0,
			dynamicSectionFontSize: 20,
			currentFontSizePreference: "Small",
			currentNotation: "German (A H C D E F G)",
			maxFontSize: 35,
			fullscreen: false,
			showTabs: true,
			snackbar: false,
			multipleColumns: true,
			updatingFontSize: true,
			editPublicSongDialogOpened: false,
			deleteSongDialogOpened: false,
		};
	},

	methods: {
		onColumnChange(multipleColumns) {
			//   this.minFontSize = 9;
			this.multipleColumns = multipleColumns;
			this.dynamicSectionFontSize = this.maxFontSize;
		},

		changeTranspose(change) {
			this.transpose += change;
			this.transpose = Math.max(-12, Math.min(this.transpose, 12));
		},

		formatSection(section) {
			let textWithChordsAbove = "<span class='" + section.name + "'><div class='font-weight-black mb-1'>" + section.name.charAt(0).toUpperCase() + section.name.slice(1) + "</div>";
			(section.lines || []).forEach((e) => {
				let chordLine = "";
				if (e.chords?.length) {
					e.chords.forEach((ch, i) => {
						if (i == 0) {
							chordLine = chordLine.insert(ch[0], "<span class='chord'>" + this.postprocessChord(this.transposeChord(ch[1])).symbol + "</span>");
						} else {
							chordLine = chordLine.insert(chordLine.length + (ch[0] - (e.chords[i - 1][0] + e.chords[i - 1][1].symbol.length)), "<span class='chord'>" + this.postprocessChord(this.transposeChord(ch[1])).symbol + "</span>");
						}
					});
					chordLine += "<br>";
				}
				textWithChordsAbove += chordLine + e.lyrics + "<br>";
			});
			return textWithChordsAbove + "</span>";
		},

		// formatSection2(section) {
		// 	let textWithChordsAbove = "<span class='" + section.name + "'><div class='font-weight-black mb-1'>" + section.name.charAt(0).toUpperCase() + section.name.slice(1) + "</div>";
		// 	(section.lines || []).forEach((e) => {
		// 		let chordLine = "";
		// 		if (e.chords?.length) {
		// 			e.chords.forEach((ch, i) => {
		// 				if (i == 0) {
		// 					chordLine = chordLine.insert(ch[0], "<span class='chord'>" + this.transposeChord(ch[1]).symbol + "</span>");
		// 				} else {
		// 					chordLine = chordLine.insert(chordLine.length + (ch[0] - (e.chords[i - 1][0] + e.chords[i - 1][1].symbol.length)), "<span class='chord'>" + this.transposeChord(ch[1]).symbol + "</span>");
		// 				}
		// 			});
		// 			chordLine += "<br>";
		// 		}
		// 		textWithChordsAbove += chordLine + e.lyrics + "<br>";
		// 	});
		// 	return textWithChordsAbove + "</span>";
		// },

		postprocessChord(chord) {
			let chordSymbol = chord.symbol;
			if (this.currentNotation == "German (A H C D E F G)") {
				chordSymbol = chordSymbol.replace("B", "A#");
				chordSymbol = chordSymbol.replace("H", "B");
			}
			return Chord.get(chordSymbol);
		},

		transposeChord(chord) {
			var scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
			return Chord.get(
				chord.symbol.replace(/[CDEFGAB]#?/g, (match) => {
					let i = (scale.indexOf(match) + this.transpose) % scale.length;
					return scale[i < 0 ? i + scale.length : i];
				})
			);
		},

		renderTabs() {
			if (this.showTabs && !this.updatingFontSize) {
				this.distinctChords.forEach((chord) => {
					jtab.render(document.getElementById(chord.symbol), chord.symbol);
				});
			}
		},

		updateFontSize() {
			//   if (this.multipleColumns) {
			this.updatingFontSize = false;
			if (this.$refs.songSheet == undefined) return;
			const width = this.$refs.songSheet.clientWidth;
			const overflowDiff = width - this.$refs.songSheet.scrollWidth;
			if (overflowDiff < 0 && this.dynamicSectionFontSize > this.minFontSize) {
				this.dynamicSectionFontSize -= Math.max(this.dynamicSectionFontSize * 0.05, 1.5);
				this.updatingFontSize = true;
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
			if (this.fullscreen) {
				this.snackbar = true;
				this.vueInsomnia().on();
			} else {
				this.vueInsomnia().off();
			}
		},

		askIfEditSong(song) {
			if (this.userLogged) {
				if (this.user.uid !== song.createdBy) {
					this.editPublicSongDialogOpened = true;
					this.currentSong = song;
				} else {
					this.editSong(song);
				}
			}
		},

		editPublicSong(song) {
			song.input.public = false;
			this.$store.dispatch("addSong", song).then((newSongId) => {
				this.$router.push("/edit-song/" + newSongId);
				this.$store.dispatch("deleteSong", song.id);
			});
		},

		editSong(song) {
			this.$router.push("/edit-song/" + song.id);
		},

		askIfDeleteSong(song) {
			if (this.userLogged) {
				if (this.user.uid === song.createdBy) {
					this.deleteSongDialogOpened = true;
					this.currentSong = song;
				} else {
					this.deleteSong(song.id);
				}
			}
		},

		deleteSong(songId) {
			this.$store.dispatch("deleteSong", songId);
		},
	},

	computed: {
		editable() {
			return this.song !== undefined && this.song.id !== undefined && this.type !== "editor-view";
		},

		deletable() {
			return this.editable && this.userIsCreator;
		},

		collapse() {
			return this.viewportSize.smAndDown || this.expanded;
		},

		userIsCreator() {
			if (this.song === undefined && this.song.id === undefined) return false;
			if (!this.userLogged) return false;
			return this.song.createdBy === this.user.uid;
		},

		songId() {
			return this.song?.id ?? "";
		},

		distinctChords() {
			let chords = [];
			(this.song?.sections ?? []).forEach((section) => {
				(section.lines ?? []).forEach((line) => {
					(line.chords ?? []).forEach((chord) => {
						let transposed = this.transposeChord(chord[1]);
						if (!chords.map((e) => e.symbol).includes(transposed.symbol)) {
							chords.push(transposed);
						}
					});
				});
			});

			return chords;
		},

		minFontSize() {
			switch (this.fontSizePreferences.indexOf(this.currentFontSizePreference)) {
				case 0:
					return 9;
				case 1:
					return 14;
				case 2:
					return 22;
			}

			return 12;
		},

		songSections() {
			return this.song.sections;
		},

		sectionFontSize() {
			if (!this.multipleColumns) {
				return this.minFontSize; //Math.min(Math.max(this.minFontSize, 16), this.dynamicSectionFontSize);
			} else {
				return this.dynamicSectionFontSize;
			}
		},
		songValid() {
			return this.song !== undefined && this.song.title !== undefined && this.song.author !== undefined && this.song.sections !== undefined;
		},
		...mapGetters({
			songListLoading: "getSongListLoading",
			user: "getUser",
			userLogged: "getUserLogged",
			preferences: "getUserPreferences",
			notations: "getNotations",
			fontSizePreferences: "getFontSizePreferences",
		}),
	},

	created() {
		window.addEventListener("resize", this.onResize);
	},
	destroyed() {
		window.removeEventListener("resize", this.onResize);
	},
	updated() {
		this.updateFontSize();
		this.renderTabs();
	},
	mounted() {
		this.multipleColumns = !this.viewportSize.xs;
		this.currentFontSizePreference = this.preferences.fontSize;
		this.currentNotation = this.preferences.notation;

		this.updateFontSize();
		this.renderTabs();
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
	// display: inline-block;
	// border: 1px solid green;
	// font-size: 100%;
	// margin-right: 20px;
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
	// border: 1px solid green;
	display: flex;
	flex-flow: column wrap;
	justify-content: space-around;
	// align-items: center;
	// align-content: space-around;
	max-height: 90vh;
}
</style>
