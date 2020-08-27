<template>
	<div class="mt-xs-4 pl-xs-0">
		<v-row align-content="center">
			<v-col>
				<p class="subtitle text--primary">{{ song.author }}</p>
				<p class="display-2 text--primary">{{ song.title }}</p>
			</v-col>
			<v-spacer></v-spacer>

			<v-col class="text-start" align-self="center">
				<v-btn-toggle v-model="multipleColumns" rounded mandatory>
					<v-btn @click="dynamicSectionFontSize = maxFontSize">
						<span>Column</span>
					</v-btn>
					<v-btn @click="dynamicSectionFontSize = maxFontSize">
						<span>Dynamic</span>
					</v-btn>
				</v-btn-toggle>
			</v-col>
		</v-row>
		<div :v-show="song.lines.length > 0" :class="['text--primary', 'song-sheet', 'mt-3', multipleColumns ? 'multiple-columns' : '']" ref="songSheet">
			<div :class="['mb-5 ', 'section', multipleColumns ? 'multiple-columns' : '']" :style="{ 'font-size': sectionFontSize + 'px' }" @keydown="dynamicSectionFontSize = maxFontSize" v-for="section in songSections" :key="section[0].section" v-html="formatSection(section)"></div>
		</div>
	</div>
</template>

<script>
export default {
	props: ["song"],

	data() {
		return {
			multipleColumns: false,
			dynamicSectionFontSize: 20,
			maxFontSize: 35,
		};
	},

	methods: {
		formatSection(section) {
			let textWithChordsAbove = "";
			section.forEach((e) => {
				let chordLine = "";
				if (e.chords.length != 0) {
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
			return textWithChordsAbove;
		},

		updateFontSize() {
			//   if (this.multipleColumns) {
			const width = this.$refs.songSheet.clientWidth;
			const overflowDiff = width - this.$refs.songSheet.scrollWidth;
			if (overflowDiff < 0 && this.dynamicSectionFontSize > 9) {
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
	},

	computed: {
		songSections() {
			if (this.song.lines.length == 0) {
				return [];
			}

			let sections = [];
			sections.push([]);
			this.song.lines.forEach((e, i) => {
				if (i - 1 >= 0 && e.section > this.song.lines[i - 1].section) {
					sections.push([]);
				}
				sections[sections.length - 1].push(e);
			});
			return sections;
		},
		sectionFontSize() {
			if (!this.multipleColumns) {
				return Math.min(16, this.dynamicSectionFontSize);
			} else {
				return this.dynamicSectionFontSize;
			}
		},
	},

	created() {
		window.addEventListener("resize", this.onResize);
	},
	destroyed() {
		window.removeEventListener("resize", this.onResize);
	},
	updated() {
		this.updateFontSize();
	},
};
</script>

<style lang="scss" scoped>
.section {
	display: block;
	//   border: 1px solid blue;
	white-space: pre;
	font-family: "Roboto Mono", monospace;
}

.section.multiple-columns {
	display: inline-block;
	//   border: 1px solid green;
	font-size: 100%;
}

.song-sheet {
	//   border: 1px solid green;
	align-items: center;
}
.song-sheet.multiple-columns {
	display: flex;
	flex-flow: column;
	flex-wrap: wrap;
	max-height: 93vh;
}
</style>
