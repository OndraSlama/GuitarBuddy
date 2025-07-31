<template>
	<fullscreen :fullscreen.sync="fullscreen" :background="$vuetify.theme.dark ? '#121212' : '#ffffff'">
		<v-sheet style="position: relative" :class="type === 'modal' ? 'elevation-0' : 'elevation-2'">
			<!----------------------------------- Header toolbar ----------------------------------->
			<v-toolbar height="50px" class="elevation-0">
				<v-toolbar-items>
					<v-btn v-show="type === 'modal'" icon @click.stop="$emit('cancel')" class="ml-n5">
						<v-icon>mdi-window-close</v-icon>
					</v-btn>
					<v-btn icon @click="changeTranspose(-1)">
						<v-icon>mdi-minus</v-icon>
					</v-btn>
					<v-btn text :icon="collapse" class="mx-n2" @click="changeTranspose(-transpose)">
						<span v-if="!collapse">Transpose ({{ transpose }})</span>
						<span v-else>{{ transpose }}</span>
					</v-btn>
					<v-btn icon @click="changeTranspose(1)">
						<v-icon>mdi-plus</v-icon>
					</v-btn>
				</v-toolbar-items>
				<v-spacer></v-spacer>
				<v-toolbar-items>			
					<v-btn v-show="type !== 'session-view'" :disabled="playSessionActive" text :icon="collapse" @click.stop="sendToSession">
						<v-icon :left="!collapse">mdi-share-outline</v-icon>
						<span v-show="!collapse">to session</span>
					</v-btn>
					<v-btn v-show="editable && viewportSize.smAndUp" text :icon="collapse" @click.stop="askIfEditSong(song)">
						<v-icon :left="!collapse">mdi-pencil-outline</v-icon>
						<span v-show="!collapse">Edit</span>
					</v-btn>
					<edit-public-song-dialog v-model="editPublicSongDialogOpened" v-on:accept="editPublicSong(currentSong)" />

					<v-btn v-show="deletable && viewportSize.smAndUp" text :icon="collapse" @click.stop="askIfDeleteSong(song)">
						<v-icon :left="!collapse">mdi-delete-outline</v-icon>
						<span v-show="!collapse">Delete</span>
					</v-btn>
					<delete-dialog v-model="deleteSongDialogOpened" v-on:accept="deleteSong(currentSong.id)" />

					<v-fab-transition>
						<v-btn large icon @click="fullscreen = !fullscreen">
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

							<v-list-item v-show="!viewportSize.smAndUp" :disabled="!editable" @click.stop="askIfEditSong(song)">
								<v-list-item-icon>
									<v-icon>mdi-pencil-outline</v-icon>
								</v-list-item-icon>
			
								<v-list-item-title  >
									Edit
								</v-list-item-title>
							</v-list-item>

							<v-list-item v-show="!viewportSize.smAndUp" :disabled="!deletable" @click.stop="askIfDeleteSong(song)">
								<v-list-item-icon>
									<v-icon>mdi-delete-outline</v-icon>
								</v-list-item-icon>
			
								<v-list-item-title  >
									Delete
								</v-list-item-title>
							</v-list-item>

							<v-divider v-show="!viewportSize.smAndUp" class="my-1"></v-divider>
							
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
									<v-select @click.stop.prevent v-model="currentPreferences.fontSize" :items="fontSizePreferences" label="Font size" class="mt-n4 ml-n2 mb-n12 py-0" solo flat></v-select>
								</v-list-item-content>
							</v-list-item>

							<v-list-item>
								<v-tooltip top>
									<template v-slot:activator="{ on, attrs }">
										<v-list-item-icon v-bind="attrs" v-on="on">
											<v-icon large class="ml-n1 mr-n3">{{ currentPreferences.notation == "German (A H C D E F G)" ? "mdi-alpha-b" : "mdi-alpha-h" }}</v-icon>
										</v-list-item-icon>
									</template>
									<span>Chord notation</span>
								</v-tooltip>
								<v-list-item-content>
									<v-select @click.stop.prevent v-model="currentPreferences.notation" :items="notations" item-text="text" item-value="value" label="Notation" class="mt-n4 ml-n2 mb-n12 py-0" solo flat></v-select>
								</v-list-item-content>
							</v-list-item>

							<v-list-item>
								<v-tooltip top>
									<template v-slot:activator="{ on, attrs }">
										<v-list-item-icon v-bind="attrs" v-on="on">
											<v-icon>mdi-arrow-down</v-icon>
										</v-list-item-icon>
									</template>
									<span>Scroll speed</span>
								</v-tooltip>
								<v-list-item-content>
									<v-slider @click.stop.prevent v-model="currentPreferences.scrollSpeed"  class="mt-n4 ml-n2 mb-n12 py-0" solo flat></v-slider>
								</v-list-item-content>
							</v-list-item>

							<v-list-item @click.stop="currentPreferences.showTabs = !currentPreferences.showTabs">
								<v-list-item-icon>
									<v-icon>mdi-help-circle-outline</v-icon>
								</v-list-item-icon>
								<v-row style="height: 50px ">
									<v-col style="height: 50px; min-width: 150px; flex-grow: 5">
										Show chord tabs
									</v-col>
									<v-col>
										<v-switch class="my-0 py-0" style="height: 30px; width:50px" @click.stop v-model="currentPreferences.showTabs" inset></v-switch>
									</v-col>
								</v-row>
							</v-list-item>

							<v-divider class="my-1"></v-divider>

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


						</v-list>
					</v-menu>
				</v-toolbar-items>
			</v-toolbar>
			<v-divider></v-divider>
			<!----------------------------------- Song ----------------------------------->
			<div class="px-7 py-3 song-container">
				<v-row v-if="songValid" class="">
					<v-btn fab class="primary elevation-3" @click="togglePageScroll" fixed :style="{ bottom: viewportSize.mdAndUp ? '40px' : '80px', right: '40px' }" :key="123">
						<v-icon>{{ scrollActive ?  "mdi-close" : "mdi-arrow-down" }}</v-icon>
					</v-btn>

					<v-col class>
						<div class="display-2 text--primary" style="min-width: 200px">
							{{ song.title ? song.title : "Song preview" }}
						</div>
						<div class="text-h5 text--secondary">{{ song.author }}</div>
						<div class="d-flex">
							<v-chip class="mr-3 mt-2" v-for="label in song.labels" label outlined :key="label"> {{ label }} </v-chip>
						</div>
					</v-col>

					<v-col class="text-start ml-n5" style="max-width: 290px; min-width: 290px" align-self="start">
						<v-tooltip top>
							<template v-slot:activator="{ on, attrs }">
								<v-btn text large @click="onColumnChange(false)" v-bind="attrs" :color="!currentPreferences.multipleColumns ? 'primary' : ''" v-on="on">
									<v-icon left>mdi-table-column</v-icon>
									<span> Standard </span>
								</v-btn>
							</template>
							<span>Song in one long column</span>
						</v-tooltip>

						<v-tooltip top>
							<template v-slot:activator="{ on, attrs }">
								<v-btn text large @click="onColumnChange(true)" v-bind="attrs" :color="currentPreferences.multipleColumns ? 'primary' : ''" v-on="on" class="mr-n5">
									<v-icon left>mdi-view-dashboard-outline</v-icon>
									<span> Dynamic </span>
								</v-btn>
							</template>
							<span>Stack song in multiple columns to fit screen</span>
						</v-tooltip>
					</v-col>
				</v-row>
				<!----------------------------------- Chord pictures ----------------------------------->
				<v-scroll-y-transition hide-on-leave>
					<div v-if="currentPreferences.showTabs" class="d-flex flex-wrap">
						<div v-for="chord in distinctChords" :key="chord.symbol || chord.original" style="max-width: 100px" class="mr-3">
							<!-- Only show tab diagram for recognized chords, ignore unrecognized ones -->
							<div v-if="!chord.original" :id="chord.symbol"></div>
						</div>
					</div>
				</v-scroll-y-transition>
				<!----------------------------------- Song text ----------------------------------->
				<div v-if="songValid && song.sections.length > 0" :class="['text--primary', 'song-sheet', 'mt-3', ...sectionClasses]" ref="songSheet">
					<v-card :class="['mb-3 ', 'section', 'elevation-0', 'no-scroll', section.name.toLowerCase(), ...sectionClasses]" :style="{ 'font-size': sectionFontSize + 'px' }" @keydown="dynamicSectionFontSize = maxFontSize" v-for="(section, i) in songSections" :key="i">
						<v-divider v-if="!currentPreferences.multipleColumns && i > 0" class="mb-3"></v-divider>
						<div v-html="formatSection(section)"></div>
					</v-card>
				</div>
			</div>
		</v-sheet>
		<v-snackbar v-model="snackbar"> Screen won't turn off while on this page </v-snackbar>
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
			forceOneColumn: false,
			maxFontSize: 40,
			currentPreferences: {
				fontSize: "Small",
				notation: "German (A H C D E F G)",
				showTabs: true,
				multipleColumns: true,
				scrollSpeed: 40,
			},
			fullscreen: false,
			snackbar: false,
			updatingFontSize: true,
			editPublicSongDialogOpened: false,
			deleteSongDialogOpened: false,
			scrollActive: false,
		};
	},

	methods: {
		sendToSession() {
			this.$store.dispatch("updatePlaySession", {
				...this.playSession,
				currentSong: this.song,
			});
			this.$router.push("/play-session");
			this.$emit("cancel");
		},
		onColumnChange(multipleColumns) {
			this.currentPreferences.multipleColumns = multipleColumns;
			this.dynamicSectionFontSize = this.maxFontSize;
			this.$nextTick(() => {
				this.updateFontSize();
			});
		},

		changeTranspose(change) {
			this.transpose += change;
			this.transpose = Math.max(-12, Math.min(this.transpose, 12));
		},

		formatSection(section) {
			let textWithChordsAbove = "<span class='" + section.name + "'><div class='font-weight-black mb-1'>" + section.name.charAt(0).toUpperCase() + section.name.slice(1) + "</div>";
			(section.lines || []).forEach((e) => {
				if (e.chords?.length) {
					// Create an array to build the line with chord positions
					let lineWithChords = this.buildLineWithChords(e.lyrics, e.chords);
					textWithChordsAbove += '<div class="line-with-chords">' + lineWithChords + "</div>";
				} else {
					textWithChordsAbove += '<div class="line-without-chords">' + e.lyrics + "</div>";
				}
			});
			return textWithChordsAbove + "</span>";
		},

		buildLineWithChords(lyrics, chords) {
			// Sort chords by position to ensure proper order
			const sortedChords = [...chords].sort((a, b) => a[0] - b[0]);
			
			let result = "";
			let currentPosition = 0;
			let lastChordEnd = 0;
			
			sortedChords.forEach((chord) => {
				const [position, chordObj] = chord;
				const chordSymbol = this.postprocessChord(this.transposeChord(chordObj));
				const chordLength = chordSymbol.length;
				const minSpacing = chordLength + 1;
				
				// Calculate the actual position considering minimum spacing from previous chord
				let adjustedPosition = Math.max(position, lastChordEnd);
				
				// Add text or spaces before chord position
				const spacesNeeded = adjustedPosition - currentPosition;
				if (spacesNeeded > 0) {
					// If we have lyrics text available, use it
					if (currentPosition < lyrics.length && adjustedPosition <= lyrics.length) {
						const textToAdd = lyrics.substring(currentPosition, adjustedPosition);
						result += this.escapeHtml(textToAdd);
					} else {
						// If no lyrics or we've passed the end of lyrics, add spaces
						const availableText = Math.max(0, lyrics.length - currentPosition);
						if (availableText > 0) {
							result += this.escapeHtml(lyrics.substring(currentPosition, lyrics.length));
						}
						const remainingSpaces = spacesNeeded - availableText;
						if (remainingSpaces > 0) {
							result += '&nbsp;'.repeat(remainingSpaces);
						}
					}
				}
				
				// Add chord with wrapper
				result += `<span class="chord-wrapper"><span class="chord">${chordSymbol}</span></span>`;
				
				// Update positions
				currentPosition = adjustedPosition;
				lastChordEnd = currentPosition + minSpacing;
			});
			
			// Add remaining text
			if (currentPosition < lyrics.length) {
				result += this.escapeHtml(lyrics.substring(currentPosition));
			}
			
			return result;
		},

		escapeHtml(text) {
			const div = document.createElement('div');
			div.textContent = text;
			return div.innerHTML;
		},
		postprocessChord(chord) {
			// Handle unrecognized chords that might not have a symbol
			let chordSymbol = chord.symbol || chord.original || '';
			
			if (this.currentPreferences.notation == "German (A H C D E F G)") {
				chordSymbol = chordSymbol.replace("B", "H");
				chordSymbol = chordSymbol.replace("A#", "B");
			}
			return chordSymbol;
		},

		transposeChord(chord) {
			// If chord has no symbol or is unrecognized, return it as-is
			if (!chord.symbol) {
				return chord;
			}
			
			var scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
			
			// Try to transpose known chord parts, but keep unrecognized parts intact
			let transposedSymbol = chord.symbol.replace(/[CDEFGAB]#?/g, (match) => {
				let i = (scale.indexOf(match) + this.transpose) % scale.length;
				return scale[i < 0 ? i + scale.length : i];
			});
			
			// Try to get a valid chord object from Tonal
			let transposedChord = Chord.get(transposedSymbol);
			
			// If Tonal can't recognize the chord, create a custom object
			if (transposedChord.empty) {
				return {
					symbol: transposedSymbol,
					empty: false,
					original: chord.symbol
				};
			}
			
			return transposedChord;
		},

		renderTabs() {
			if (this.currentPreferences.showTabs && !this.updatingFontSize) {
				this.distinctChords.forEach((chord) => {
					try {
						// Only try to render tabs for chords that Tonal recognizes
						if (!chord.original && chord.symbol) {
							jtab.render(document.getElementById(chord.symbol), chord.symbol);
						}
					} catch {
						console.log("");
					}
				});
			}
		},

		updateFontSize() {
			if (!this.currentPreferences.multipleColumns) {
				return
			}
			console.log("updating font size");
			this.updatingFontSize = false;
			this.forceOneColumn = false;
			if (this.$refs.songSheet == undefined) return;

			const width = this.$refs.songSheet.clientWidth;
			const overflowDiff = width - this.$refs.songSheet.scrollWidth;
			if (overflowDiff < 0 && this.dynamicSectionFontSize > this.minFontSize) {
				this.dynamicSectionFontSize -= Math.max(this.dynamicSectionFontSize * 0.08, 1);
				this.updatingFontSize = true;
				
				this.$nextTick(() => {
					this.updateFontSize();
				});
			}

			if (!this.updatingFontSize && overflowDiff < 0) {
				this.forceOneColumn = true		
			}
		},

		onResize() {
			this.dynamicSectionFontSize = this.maxFontSize;
			this.$nextTick(() => {
				this.updateFontSize();
			});
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

		togglePageScroll(){
			this.scrollActive = !this.scrollActive;
			if (this.scrollActive) {
				this.pageScroll()
			}			
		},

		pageScroll(){
			if (!this.scrollActive) {
				return
			}

			window.scrollBy(0, 1);
			const scrollDelay = this.currentPreferences.scrollSpeed ? (500 - 500 * this.currentPreferences.scrollSpeed / 100) : 250;
			setTimeout(() => {
				this.pageScroll();
			}, Math.max(50, scrollDelay)); // Ensure delay is not too small
		}
	
	},

	computed: {
		sectionClasses(){
			let classes = [];
			if (this.currentPreferences.multipleColumns) {
				classes.push("dynamic-sections");
				if (!this.forceOneColumn) {
					classes.push("no-scroll");
				}
			}
			return classes
		},

		playSessionActive() {
			return !this.playSession?.id;
		},

		editable() {
			return this.song !== undefined && this.song.id !== undefined && this.type !== "editor-view" && this.type !== "session-view";
		},

		deletable() {
			return this.editable && this.userIsCreator && this.type !== "session-view";
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
						// Include chord if it has a symbol or original text
						let chordSymbol = transposed.symbol || transposed.original || '';
						if (chordSymbol && !chords.map((e) => e.symbol || e.original || '').includes(chordSymbol)) {
							chords.push(transposed);
						}
					});
				});
			});

			return chords;
		},

		minFontSize() {
			if (!this.currentPreferences || !this.currentPreferences.fontSize) return 12;
			switch (this.fontSizePreferences.indexOf(this.currentPreferences.fontSize)) {
				case 0:
					return 11;
				case 1:
					return 16;
				case 2:
					return 22;
			}

			return 12;
		},

		songSections() {
			return this.song.sections;
		},

		sectionFontSize() {
			if (!this.currentPreferences.multipleColumns) {
				return this.minFontSize;
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
			playSession: "getPlaySession",
			fontSizePreferences: "getFontSizePreferences",
		}),
	},

	created() {
		this.currentPreferences = { ...this.preferences };
		window.addEventListener("resize", this.onResize);
	},
	destroyed() {
		window.removeEventListener("resize", this.onResize);
	},
	updated() {
		this.renderTabs();
	},
	mounted() {
		this.currentPreferences = { ...this.preferences };
		this.updateFontSize();
		this.renderTabs();

		this.snackbar = true;
		if (typeof this.vueInsomnia === 'function') {
			this.vueInsomnia().on();
		}
	},

	unmounted() {
		if (typeof this.vueInsomnia === 'function') {
			this.vueInsomnia().off();
		}
	},

	watch: {
		preferences: {
			handler(newPrefs) {
				this.currentPreferences = { ...newPrefs };
				this.$nextTick(() => {
					this.updateFontSize();
					this.renderTabs();
				});
			},
			deep: true,
		},
		minFontSize: function() {
			this.dynamicSectionFontSize = this.maxFontSize;
			this.$nextTick(() => {
				this.updateFontSize();
			});
		},
		expanded: function() {
			this.dynamicSectionFontSize = this.maxFontSize;
			this.$nextTick(() => {
				this.updateFontSize();
			});
		},
	},
};
</script>

<style lang="scss">
.section {
	display: block;
	white-space: pre-wrap;
	word-wrap: break-word;
	overflow-wrap: break-word;
	font-family: "Roboto Mono", monospace;
	max-width: 100%;
	overflow-x: hidden;
	padding-top: 1.5em;
}

.line-with-chords {
	line-height: 2.5em;
	// padding-top: 0em;
}

.line-without-chords {
    padding-bottom: 0.4em;
	line-height: 1.2em;
}

.section.dynamic-sections {
	display: inline-block;
	background-color: rgba(139, 139, 139, 0.082);
	border-radius: 5px;
	margin-right: 5px;
	padding: 10px;
	border-style: dotted;
	max-width: 100%;
	overflow-x: hidden;
	white-space: pre-wrap;
	word-wrap: break-word;
	overflow-wrap: break-word;
}

.section.dynamic-sections.chorus {
	background-color: rgba(150, 111, 3, 0.137);
}

.section.dynamic-sections.intro {
	background-color: rgba(2, 63, 194, 0.096);
}

.section.dynamic-sections.ending {
	background-color: rgba(34, 194, 2, 0.096);
}

.section.dynamic-sections.bridge {
	background-color: rgba(133, 2, 194, 0.055);
}

.chord-wrapper {
	position: relative;
	display: inline;
    font-size: 0.9em;
    line-height: 0.8;
}

.chord-wrapper .chord {
	position: absolute;
	top: -1.2em;
	left: 0;
	white-space: nowrap;
	z-index: 1;
	font-size: 0.9em;
	color: #d32f2f;
	font-weight: bold;
	pointer-events: none;
}

.floating-buttons {
	position: absolute;
	right: 20px;
}

.song-sheet {
	overflow-y: auto;
	overflow-x: hidden;
	max-width: 100%;
}
.song-sheet.dynamic-sections {
	display: flex;
	flex-flow: column wrap;
	justify-content: space-around;
    
	
}

.no-scroll{
	max-height: 85vh;	
}

.song-container {
	max-width: 100%;
	overflow-x: hidden;
}
</style>