<template>
  <div>
    <v-form @submit.prevent="onSubmit" ref="form" lazy-validation>
      <v-text-field
        class="my-3"
        v-model="tempSource.title"
        label="Song Title"
        :rules="rules"
        hide-details="auto"
        outlined
      ></v-text-field>
      <v-text-field v-model="tempSource.author" label="Author" outlined></v-text-field>
      <v-toolbar class="elevation-0 my-n3" :color="$vuetify.theme.dark ? '#121212' : ''">
        <v-spacer></v-spacer>
        <v-switch v-model="tempSource.public" inset label="Public"></v-switch>
      </v-toolbar>

      <v-textarea
        solo
        class="text-area"
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
                <v-list-item @click="trimLines()">
                  <v-list-item-title>Trim lines</v-list-item-title>
                  <v-list-item-icon>
                    <v-icon>mdi-keyboard-space</v-icon>
                  </v-list-item-icon>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
          <span>Aditional text tools</span>
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
export default {
  data() {
    return {
      rules: [(value) => !!value || "Required."],
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
    trimLines() {
      this.tempSource.lines.forEach((line) => {
        console.log(line);
      });
    },

    reset() {
      if (this.type === "add") {
        this.tempSource = {
          title: "",
          author: "",
          text: "",
          chordsAboveText: true,
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
      text = this.replaceAndFill(
        text,
        "(^|\\n)[\\s]*\\(?r(ef)?(\\.|:|\\))\\)?[\\s]*",
        "Chorus\n"
      );
      text = this.replaceAndFill(
        text,
        "(^|\\n)[\\s]*\\(?(\\d)(\\.|:|\\))\\)?[\\s]*",
        "Verse $2\n"
      );
      text = this.replaceAndFill(
        text,
        "(^|\\n)[\\s]*\\(?bridge(\\.|:|\\))\\)?[\\s]*",
        "Bridge\n"
      );
      text = this.replaceAndFill(
        text,
        "(^|\\n)[\\s]*\\(?ending(\\.|:|\\))\\)?[\\s]*",
        "Ending\n"
      );
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

    isChordsLine(line, aloneChordsregex) {
      return (
        (line.match(aloneChordsregex) || []).length >
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
        title: this.tempSource.title,
        author: this.tempSource.author,
      };
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
    tempSource: {
      handler: function () {
        this.$emit("input", this.formatedSong);
      },
      deep: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.text-area {
  font-family: "Roboto Mono", monospace;
  white-space: pre;
}
</style>
