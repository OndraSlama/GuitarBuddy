<template>
  <div>
    <v-main class="elevation-2 ma-0 pa-10">
      <p class="text-h2 mb-6">Add new song</p>
      <v-row>
        <v-col cols="12" md="6" lg="4">
          <v-text-field
            class="my-3"
            v-model="songInput.title"
            label="Song Title"
            :rules="rules"
            hide-details="auto"
            outlined
          ></v-text-field>
          <v-text-field v-model="songInput.author" label="Author" outlined></v-text-field>
          <v-textarea
            solo
            class="monospace"
            v-model="songInput.text"
            label="Song text with chords"
            :rules="rules"
            auto-grow
          ></v-textarea>

          <v-row align-content="center">
            <v-col class="text-center">
              <v-btn-toggle v-model="songInput.chordsAboveText" rounded mandatory>
                <v-btn>
                  <span>In text</span>
                </v-btn>
                <v-btn>
                  <span>Above</span>
                </v-btn>
              </v-btn-toggle>
            </v-col>
            <!-- <v-spacer class="></v-spacer> -->
            <v-col class="text-center">
              <v-btn rounded large color="primary">Import</v-btn>
            </v-col>
          </v-row>
        </v-col>
        <v-divider class="hidden-md-and-up"></v-divider>
        <v-col cols="12" md="6" lg="8">
          <SongSheet :song="parseSong()"></SongSheet>
        </v-col>
      </v-row>
    </v-main>
  </div>
</template>

<script>
// import { Multipane, MultipaneResizer } from "vue-multipane";
// import ChordSheetJS from "chordsheetjs";
import SongSheet from "../components/SongSheet";

export default {
  data() {
    return {
      toggle_exclusive: undefined,
      songInput: {
        title: "",
        author: "",
        text: "[A#] is a chord, Bb is a chord. But H isn't",
        chordsAboveText: true,
      },
      rules: [(value) => !!value || "Required."],
    };
  },
  methods: {
    parseSong() {
      let lineArray = this.splitLinesAndFindChords(
        this.songInput.text,
        this.songInput.chordsAboveText
      );
      let curentSection = 0;
      let currentName = "";
      let finalLineArray = [];
      lineArray.forEach((line, index) => {
        if (line.text.trim().length == 0 && line.chords.length == 0) {
          if (index - 1 >= 0 && lineArray[index - 1].section == line.section) {
            curentSection++;
          }
        } else if (line.lineType === "delimiter") {
          if (index - 1 >= 0 && lineArray[index - 1].section == line.section) {
            curentSection++;
          }
          currentName = line.text;
        } else if (line.lineType === "lyrics") {
          finalLineArray.push({
            section: curentSection,
            sectionName: currentName,
            lyrics: line.text,
            chords: line.chords,
          });
        }
      });

      return {
        lines: finalLineArray,
        title: this.songInput.title,
        author: this.songInput.author,
      };
    },

    splitLinesAndFindChords(text, chordsAboveText) {
      var notes = "[A-H]",
        accidentals = "(bb|b|#)?",
        chords = "(maj|min|m|mi|M|\\+|-|dim|aug|sus)?",
        suspends = "[0-9]*(sus)?[0-9]*";

      var chordRegexString =
        notes + accidentals + chords + suspends + "(\\/[A-H](b|#)?)?";
      var chordAloneRegexString =
        "(?<=(\\b))[\t]*" + chordRegexString + "(?=(\\s|$))";
      var chordBracketRegexString = "\\[\\s*(" + chordRegexString + ")\\s*\\]";

      // Parse text
      text = text.replace(/[\s]*\(?r(ef)?(\.|:|\))\)?[\s]*/gi, "\nChorus\n");
      text = text.replace(/[\s]*\(?(\d)(\.|:|\))\)?[\s]*/gi, "\nVerse $1\n");
      text = text.replace(/[\s]*\(?bridge(\.|:|\))\)?[\s]*/gi, "\nBridge\n");
      text = text.replace(/[\s]*\(?ending(\.|:|\))\)?[\s]*/gi, "\nEnding\n");
      text = text.replace(/\n\n[\n]+/g, "\n\n");

      let lineArray = [];
      let match;
      let aloneChordsregex = RegExp(chordAloneRegexString, "g");
      let bracketChordsRegex = RegExp(chordBracketRegexString, "g");

      text.split("\n").forEach((line) => {
        let lineType = "lyrics";
        let chords = [];
        if (/\s*(Chorus|Verse \d|Bridge|Ending)\s*/i.test(line)) {
          lineType = "delimiter";
          line = line.trim().toLowerCase();
        } else if (
          chordsAboveText &&
          this.isChordsLine(line, aloneChordsregex)
        ) {
          lineType = "chords";
          while ((match = aloneChordsregex.exec(line))) {
            chords.push([match.index, match[0]]);
          }
        } else if (!chordsAboveText) {
          while ((match = bracketChordsRegex.exec(line))) {
            chords.push([match.index, match[1]]);
            line = line.replace(match[0], "");
          }
          while ((match = /\[(.*)\]/.exec(line))) {
            let foundChords = match[1].split(/\s*,\s/);
            foundChords.forEach((chord, index) => {
              if (index - 1 >= 0) {
                chords.push([
                  match.index +
                    (chords[index - 1][0] + chords[index - 1][1].length + 1),
                  chord,
                ]);
              } else {
                chords.push([match.index, chord]);
              }
            });
            line = line.replace(match[0], "");
          }
        }
        lineArray.push({
          text: line,
          lineType: lineType,
          chords: chords,
        });
      });

      if (!chordsAboveText) {
        return lineArray;
      }

      for (let i = 0; i < lineArray.length; i++) {
        if (lineArray[i].lineType === "chords") {
          let j = i;
          while (
            lineArray[j].lineType != "lyrics" ||
            lineArray[j].chords.length != 0
          ) {
            j++;
            if (j >= lineArray.length) {
              j = i;
              lineArray[j].text = "";
              lineArray[j].lineType = "lyrics";
              break;
            }
          }
          lineArray[j].chords = lineArray[i].chords;
        }
      }

      return lineArray.filter((e) => {
        return e.lineType != "chords";
      });
    },

    getWordsInString(string) {
      return string.split(/(\s+)/).filter((e) => e.trim().length > 0);
    },

    isChordsLine(line, aloneChordsregex) {
      return (
        (line.match(aloneChordsregex) || []).length >
        (1 / 3) * this.getWordsInString(line).length
      );
    },
  },
  computed: {
    formatedSong() {
      this.parseSong();
      return this.parseSong();
    },
  },
  components: {
    SongSheet,
  },
};
</script>

<style lang="scss" scoped>
.monospace {
  font-family: "Roboto Mono", monospace;
}
</style>
