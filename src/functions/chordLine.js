const notes = "[A-H]",
	accidentals = "(bb|b|#|s|es|ses|sas)?",
	chords = "(maj|min|m|mi|M|\\+|-|dim|aug|sus)?",
	suspends = "[0-9]*(sus)?[0-9]*";

const chord = notes + accidentals + chords + suspends;

export const chordRegexString = chord + "(\\/" + chord + ")?";

export function aloneChordsRegex() {
	return RegExp("(?<=(\\b))[\\t]*" + chordRegexString + "(?=(\\s|$))", "g");
}

export function chordsInBracketRegex() {
	return RegExp("(?<=(\\s|,|;|\\[|^))" + chordRegexString + "(?=(\\s|,|,;|\\]|$))", "g");
}

export function getWordsInString(string) {
	return string.split(/(\s+)/).filter((e) => e.trim().length > 0);
}

export function isChordsLine(line) {
	return (line.match(aloneChordsRegex()) || []).length > (1 / 3) * getWordsInString(line).length;
}
