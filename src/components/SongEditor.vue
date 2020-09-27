<template>
  <div>
    <v-form @submit.prevent="onSubmit" ref="form" lazy-validation>
      <v-toolbar
        class="elevation-0 mb-2"
        height="40px"
        :color="$vuetify.theme.dark ? '#121212' : ''"
      >
        <v-toolbar-items>
          <v-btn icon class="ml-n4" @click="$emit('back')">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
        </v-toolbar-items>
        <v-spacer></v-spacer>
        <v-toolbar-items>
          <v-switch class="mt-2" v-model="tempSource.public" inset label="Public"></v-switch>
        </v-toolbar-items>
      </v-toolbar>
      <v-text-field
        class="mb-3"
        v-model="tempSource.title"
        label="Song Title"
        :rules="rules"
        hide-details="auto"
        outlined
      ></v-text-field>
      <v-text-field v-model="tempSource.author" label="Author" outlined></v-text-field>

      <v-textarea
        outlined
        rows="15"
        class="text-area text-no-wrap pt-3 mt-n3"
        v-model="tempSource.text"
        label="Song text with chords"
        :rules="rules"
        auto-grow
      ></v-textarea>

      <v-toolbar class="elevation-0" :color="$vuetify.theme.dark ? '#121212' : ''">
        <v-btn-toggle v-model="tempSource.chordsAboveText" rounded mandatory class="ml-n5">
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn icon v-bind="attrs" v-on="on">
                <v-icon>mdi-code-brackets</v-icon>
              </v-btn>
            </template>
            <span>Chords in text surrounded by [] brackets</span>
          </v-tooltip>
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn icon v-bind="attrs" v-on="on">
                <v-icon>mdi-format-text-variant</v-icon>
              </v-btn>
            </template>
            <span>Chords above text aligned with spaces</span>
          </v-tooltip>
        </v-btn-toggle>
        <v-tooltip top>
          <template v-slot:activator="{ on: onMenu }">
            <v-menu rounded="large" transition="slide-y-transition" bottom>
              <template v-slot:activator="{ on: onTooltip }">
                <v-btn icon class="ml-2" large v-on="{ ...onMenu, ...onTooltip }">
                  <v-icon>mdi-playlist-edit</v-icon>
                </v-btn>
              </template>
              <v-list class="py-0">
                <v-list-item @click.stop.prevent="tempSource.trimLines = !tempSource.trimLines">
                  <v-checkbox v-model="tempSource.trimLines" @click.stop.prevent></v-checkbox>
                  <v-list-item-title>Trim lines</v-list-item-title>
                </v-list-item>
                <v-list-item
                  @click.stop.prevent="variableToFixed"
                  :disabled="!tempSource.chordsAboveText"
                >
                  <v-list-item-title>Fix Chord Alignment (experimental)</v-list-item-title>
                </v-list-item>
                <!-- <v-list-item @click.stop.prevent="fixedToVariable">
									<v-list-item-title>Fixed width -> Variable width spaces</v-list-item-title>
                </v-list-item>-->
              </v-list>
            </v-menu>
          </template>
          <span>Aditional tools</span>
        </v-tooltip>

        <v-spacer></v-spacer>

        <v-btn v-if="type === 'edit'" @click="$emit('delete')" icon>
          <v-icon>mdi-delete-outline</v-icon>
        </v-btn>
        <v-btn @click="reset" icon>
          <v-icon>mdi-cancel</v-icon>
        </v-btn>
        <v-btn
          fab
          large
          type="submit"
          class="ml-2 mr-n5"
          color="primary"
          :disabled="!validInput || !userLogged"
        >
          <v-icon v-if="type === 'add'">mdi-upload-outline</v-icon>
          <v-icon v-if="type === 'edit'">mdi-content-save-outline</v-icon>
        </v-btn>
      </v-toolbar>
    </v-form>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
// import calculateSize from "calculate-size";
import measureText from "../functions/measureText";
import normalizeText from "../functions/normalizeText";
export default {
  data() {
    return {
      rules: [(value) => !!value || ""],
      tempSource: undefined,
    };
  },

  props: {
    songSource: {
      type: Object,
      default: function () {
        return {
          title: "",
          author: "",
          text: "",
          chordsAboveText: true,
          trimLines: false,
          public: true,
        };
      },
    },
    type: {
      validator: function (value) {
        return ["add", "edit"].indexOf(value) !== -1;
      },
    },
  },

  methods: {
    reset() {
      if (this.type === "add") {
        this.tempSource = {
          title: "",
          author: "",
          text: "",
          chordsAboveText: true,
          trimLines: false,
          public: true,
        };
        this.$refs.form.resetValidation();
      } else {
        this.$emit("cancel");
      }
    },

    onSubmit() {
      this.$emit("song-submited", this.tempSource);
      this.reset();
    },

    trimLines(sections) {
      sections = sections.map((section) => {
        section.lines = section.lines.map((line) => {
          while (line.lyrics[0] === " " || line.lyrics[0] === " ") {
            line.lyrics = line.lyrics.substring(1);
            if (line.chords.length > 0 && line.chords[0][0] > 0) {
              line.chords.forEach((chord) => {
                chord[0] -= 1;
              });
            }
          }
          return line;
        });
        return section;
      });

      return sections;
    },

    variableToFixed() {
      console.log(this.relativeTextWidth(this.tempSource.text));
      console.log(this.tempSource.text.charCodeAt(0));
      let lines = this.tempSource.text.split("\n");
      lines.forEach((line, index) => {
        if (this.isChordsLine(line) && index + 1 < lines.length) {
          let lineParts = line.split(/(\s+)/).filter((e) => e.length > 0);
          let startPos = [0];
          let isWord = [];
          lineParts.forEach((part, j) => {
            if (j > 0) {
              startPos.push(
                startPos[j - 1] + this.relativeTextWidth(lineParts[j - 1])
              );
            }
            isWord.push(part.trim().length > 0);
          });

          let positionInLine = [];
          let comparingWord = 0;
          let cumulativeLength = 0;
          let i = 0;
          while (comparingWord < startPos.length) {
            cumulativeLength += this.relativeTextWidth(
              lines[index + 1].charAt(i) || " "
            );

            if (cumulativeLength >= startPos[comparingWord]) {
              positionInLine.push(i);
              comparingWord++;
            }
            i++;
            // const chordChar = line.charAt(i);
            // const lineChar = lines[index + 1].charAt(i);
          }
          lines[index] = "";
          for (let i = 0; i < positionInLine.length; i++) {
            const pos = positionInLine[i];
            if (isWord[i]) {
              lines[index] = lines[index].insert(pos, lineParts[i]);
            }
          }

          console.log(line.charCodeAt(0));
          console.log(index, lineParts);
          console.log(index, startPos);
          console.log(index, isWord);
          console.log(index, positionInLine);
          console.log(index, lines[index + 1]);
        }
      });

      this.tempSource.text = lines.join("\n");
    },

    fixedToVariable() {
      console.log("fixed to variable");
    },

    splitLinesAndFindChords(text, chordsAboveText) {
      // Clean text
      text = text.replace(/<[^>]*>?/gm, "");

      // Parse text
      text = this.replaceAndFill(
        text,
        "(^|\\n)[\\s]*[\\(\\[]?info(\\.|:|\\))?[\\)\\]?[\\s]*",
        "Info\n"
      );
      text = this.replaceAndFill(
        text,
        "(^|\\n)[\\s]*\\(?r(f|e|ef)?(\\.|:|\\))\\)?[\\s]*",
        "Chorus\n"
      );
      text = this.replaceAndFill(
        text,
        "(^|\\n)[\\s]*\\(?(\\d)(\\.|:|\\))?\\)?[\\s]*",
        "Verse $2\n"
      );
      text = this.replaceAndFill(
        text,
        "(^|\\n)[\\s]*\\(?bridge(\\.|:|\\))?\\)?[\\s]*",
        "Bridge\n"
      );
      text = this.replaceAndFill(
        text,
        "(^|\\n)[\\s]*\\(?ending(\\.|:|\\))?\\)?[\\s]*",
        "Ending\n"
      );

      // text = text.replace(/(^|\n)[\s]*\(?r(f|e|ef)?(\.|:|\))\)?[\s]*/gi, "\nChorus\n");
      // text = text.replace(/(^|\n)[\s]*\(?(\d)(\.|:|\))\)?[\s]*/gi, "\nVerse $2\n");
      // text = text.replace(/(^|\n)[\s]*\(?bridge(\.|:|\))\)?[\s]*/gi, "\nBridge\n");
      // text = text.replace(/(^|\n)[\s]*\(?ending(\.|:|\))\)?[\s]*/gi, "\nEnding\n");
      // text = text.replace(/\n\n[\n]+/g, "\n\n");

      let lineArray = [];
      let bracketMatch;
      let match;

      let lines = text.split("\n");
      lines.forEach((line) => {
        let lineType = "lyrics";
        let chords = [];
        if (/\s*(Intro|Chorus|Verse\s+\d|Bridge|Ending)\s*/i.test(line)) {
          match = /\s*(Intro|Chorus|Verse\s+\d|Bridge|Ending)\s*/i.exec(line);
          lineType = "delimiter";
          line = match[0].trim().toLowerCase();
        } else if (chordsAboveText && this.isChordsLine(line)) {
          lineType = "chords";
          while ((match = this.aloneChordsregex.exec(line))) {
            chords.push([match.index, match[0]]);
          }
        } else if (!chordsAboveText) {
          while ((bracketMatch = /\[(.*?)\]/.exec(line))) {
            let chordsInBracket = [];
            while ((match = this.chordsInBracketRegex.exec(bracketMatch[1]))) {
              if (chordsInBracket.length != 0) {
                let lastChord = chordsInBracket[chordsInBracket.length - 1];
                chordsInBracket.push([
                  lastChord[0] + lastChord[1].length + 1,
                  match[0],
                ]);
              } else {
                chordsInBracket.push([bracketMatch.index, match[0]]);
              }
            }

            chordsInBracket.forEach((chord) => {
              if (
                chords.length != 0 &&
                chords[chords.length - 1][0] >= chord[0]
              ) {
                let lastChord = chords[chords.length - 1];
                chord[0] = lastChord[0] + lastChord[1].length + 1;
              }
              chords.push(chord);
            });
            line = line.replace(bracketMatch[0], "");
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

    relativeTextWidth(str) {
      return measureText(normalizeText(str)) / measureText(" ");
    },

    replaceAndFill(text, regex, replacement) {
      let match;
      let replacementWithSpaces = replacement;
      while ((match = RegExp(regex, "i").exec(text))) {
        replacementWithSpaces = replacement;
        for (let i = 0; i < match[0].trim().length; i++) {
          replacementWithSpaces += " ";
        }
        replacementWithSpaces = replacementWithSpaces.replace("$2", match[2]);
        text = text.replace(match[0].trim(), replacementWithSpaces);
      }

      return text;
    },

    getWordsInString(string) {
      return string.split(/(\s+)/).filter((e) => e.trim().length > 0);
    },

    isChordsLine(line) {
      return (
        (line.match(this.aloneChordsregex) || []).length >
        (1 / 3) * this.getWordsInString(line).length
      );
    },
  },

  computed: {
    formatedSong() {
      let lineArray = this.splitLinesAndFindChords(
        this.tempSource.text,
        this.tempSource.chordsAboveText
      );

      let sections = [];

      lineArray.forEach((line) => {
        if (line.text.trim().length == 0 && line.chords.length == 0) {
          sections.push({
            name: "",
            lines: [],
          });
        } else if (line.lineType === "delimiter") {
          sections.push({
            name: line.text,
            lines: [],
          });
        } else if (line.lineType === "lyrics") {
          if (sections.length == 0)
            sections.push({
              name: "",
              lines: [],
            });

          sections[sections.length - 1].lines.push({
            lyrics: line.text,
            chords: line.chords,
          });
        }
      });

      if (this.tempSource.trimLines) sections = this.trimLines(sections);

      return {
        sections: sections.filter((section) => {
          return section.name != "" || section.lines.length > 0;
        }),
        title: this.tempSource.title,
        author: this.tempSource.author,
      };
    },

    chordRegexString() {
      var notes = "[A-H]",
        accidentals = "(bb|b|#)?",
        chords = "(maj|min|m|mi|M|\\+|-|dim|aug|sus)?",
        suspends = "[0-9]*(sus)?[0-9]*";

      const chord = notes + accidentals + chords + suspends;
      return chord + "(\\/" + chord + ")?";
    },

    aloneChordsregex() {
      return RegExp(
        "(?<=(\\b))[\\t]*" + this.chordRegexString + "(?=(\\s|$))",
        "g"
      );
    },

    chordsInBracketRegex() {
      return RegExp(
        "(?<=(\\s|,|;|\\[|^))" + this.chordRegexString + "(?=(\\s|,|,;|\\]|$))",
        "g"
      );
    },

    validSource() {
      return this.tempSource !== undefined && this.tempSource !== null;
    },
    validInput() {
      if (this.tempSource.title.length == 0) return false;
      if (this.tempSource.text.length == 0) return false;
      return true;
    },
    ...mapGetters({
      userLogged: "getUserLogged",
      user: "getUser",
      showTooltips: "getShowTooltips",
    }),
  },

  created() {
    this.tempSource = { ...this.songSource };
    this.$emit("input", this.formatedSong);
  },

  watch: {
    songSource: {
      handler: function () {
        this.tempSource = { ...this.songSource };
      },
      deep: true,
    },
    tempSource: {
      handler: function () {
        this.$emit("input", this.formatedSong);
      },
      deep: true,
    },

    trimLines: function () {
      this.$emit("input", this.formatedSong);
    },
  },
};
</script>

<style lang="scss" scoped>
.text-area {
  font-family: "Roboto Mono", monospace;
  white-space: pre !important;
  overflow-wrap: normal !important;
  overflow: auto;
  max-height: clamp(300px, 62vh, 100vh);
}
</style>
