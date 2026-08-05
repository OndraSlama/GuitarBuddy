// Prompt and response contract for extracting a song from photos of a song
// sheet. Kept free of browser and Firebase imports so the prompt-tuning
// script (scripts/test-photo-extraction.mjs) can reuse it in plain Node.

export const DEFAULT_EXTRACTION_MODEL = "gemini-3.6-flash";

const MAX_LIST_ITEMS = 150;

const SECTION_MARKER = /^(intro|verse(\s+\d+)?|chorus|bridge|ending)$/i;

export const extractionResponseSchema = {
	type: "OBJECT",
	properties: {
		isSong: { type: "BOOLEAN", description: "Whether the provided image(s) contain song lyrics." },
		title: { type: "STRING", description: "Song title as printed on the sheet." },
		author: { type: "STRING", description: "Performer or writer of the song, empty string if unknown." },
		labels: { type: "ARRAY", items: { type: "STRING" }, description: "Up to 3 tags for the song." },
		standardNotation: { type: "BOOLEAN", description: "False when the sheet uses German/Czech chord notation (H for B natural)." },
		text: { type: "STRING", description: "Lyrics with inline [chord] brackets and {Section} markers." },
		warnings: { type: "ARRAY", items: { type: "STRING" }, description: "Short notes about unreadable or guessed parts." },
	},
	required: ["isSong", "title", "author", "labels", "standardNotation", "text", "warnings"],
	propertyOrdering: ["isSong", "title", "author", "labels", "standardNotation", "text", "warnings"],
};

export function buildExtractionPrompt({ labels = [], authors = [] } = {}) {
	const labelList = labels.slice(0, MAX_LIST_ITEMS).join(", ");
	const authorList = authors.slice(0, MAX_LIST_ITEMS).join(", ");

	return `You are transcribing a photographed or scanned song sheet (lyrics with chords) into a structured song for a songbook app.

If the image(s) do not contain song lyrics, set isSong to false and explain why in warnings.
When multiple images are provided, they are consecutive pages or parts of the same song, in order; merge them into one song.

Rules for the "text" field:
- Transcribe the lyrics exactly as printed, keeping the original language, diacritics and punctuation. Never translate or paraphrase.
- Write chords inline in square brackets immediately before the syllable they belong to, e.g. "[Ami]Spatřil jsem [D7]kometu". If the sheet prints chords on separate lines above the lyrics, merge each chord into the lyric line below it at the matching position.
- Copy chord symbols exactly as printed. Never convert between chord notations (keep H, B, Es, As, mi, -, + and similar exactly as written).
- Mark song sections by putting {Verse 1}, {Verse 2}, {Chorus}, {Bridge}, {Intro} or {Ending} on its own line before the section. Convert printed markers such as "1.", "2.", "R:", "Ref.:" into these and remove them from the lyrics. Do not output any other {...} directives.
- Separate sections with a single empty line.
- If a repeated chorus is only referenced on the sheet (e.g. a bare "R:" with no or shortened text), output the {Chorus} marker with only the text that is actually printed there.
- Skip page headers, footers, page numbers, watermarks, chord diagrams and anything else that is not part of the song itself.

Rules for the other fields:
- title: the song title as printed.
- author: the performer or writer of the song.${authorList ? ` If it is one of these known authors, use exactly this spelling: ${authorList}.` : ""}
- labels: up to 3 fitting tags (genre, language, mood).${labelList ? ` Strongly prefer these existing tags and only invent a new one when none fits: ${labelList}.` : ""}
- standardNotation: false when the chords use German/Czech note names (H for B natural, B meaning B flat, flats like Es or As); true when they use international names (B for B natural, flats with the letter b). When no telling chord appears, use false for Czech, Slovak, German or Polish lyrics and true otherwise.
- warnings: short notes about anything unreadable, guessed or uncertain. Empty array when the transcription is clean.`;
}

// Maps the model response to the shape SongEditor expects as songSource.
// Throws with a user-presentable message when the response is unusable.
export function normalizeExtractedSong(raw) {
	if (!raw || typeof raw !== "object") {
		throw new Error("The AI returned an unexpected response. Please try again.");
	}

	const warnings = Array.isArray(raw.warnings) ? raw.warnings.filter((w) => typeof w === "string" && w.trim().length > 0) : [];

	if (!raw.isSong) {
		throw new Error(warnings.length > 0 ? "No song found in the photo: " + warnings.join(" ") : "No song found in the photo.");
	}

	const text = cleanExtractedText(typeof raw.text === "string" ? raw.text : "");
	if (text.length === 0) {
		throw new Error("Could not read any lyrics from the photo.");
	}

	const labels = Array.isArray(raw.labels) ? [...new Set(raw.labels.filter((l) => typeof l === "string" && l.trim().length > 0).map((l) => l.trim()))].slice(0, 3) : [];

	return {
		songSource: {
			title: typeof raw.title === "string" ? raw.title.trim() : "",
			author: typeof raw.author === "string" ? raw.author.trim() : "",
			text,
			labels,
			chordsAboveText: false,
			standardNotation: !!raw.standardNotation,
			trimLines: true,
			public: true,
		},
		warnings,
	};
}

// The song parser turns any standalone {x} line into a section header, so
// stray ChordPro directives ({key: C}, {capo: 2}, ...) would render as bogus
// sections; only the section markers the parser knows are let through.
function cleanExtractedText(text) {
	return text
		.replace(/\r\n?/g, "\n")
		.split("\n")
		.filter((line) => {
			const directive = /^\s*\{([^}]*)\}\s*$/.exec(line);
			return !directive || SECTION_MARKER.test(directive[1].trim());
		})
		.join("\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}
