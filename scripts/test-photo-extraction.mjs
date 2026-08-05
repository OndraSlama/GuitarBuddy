// Prompt-tuning harness for the song photo extraction. Calls the Gemini API
// directly with an API key, bypassing Firebase AI Logic, so the prompt and
// schema in src/functions/songPhotoExtraction.mjs can be iterated on without
// clicking through the app.
//
// Usage (from the repo root):
//   GEMINI_API_KEY=... node scripts/test-photo-extraction.mjs [image ...]
//
// The key is read from the GEMINI_API_KEY env var or from .env.local / .env
// (GEMINI_API_KEY or VITE_GEMINI_API_KEY). Without image arguments, every
// image in .local/ is sent as pages of a single song.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { DEFAULT_EXTRACTION_MODEL, buildExtractionPrompt, extractionResponseSchema, normalizeExtractedSong } from "../src/functions/songPhotoExtraction.mjs";

const DATABASE_URL = "https://guitarbuddy-bcd3c.firebaseio.com";
const MIME_TYPES = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".heic": "image/heic",
	".heif": "image/heif",
};

function loadApiKey() {
	if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
	for (const envFile of [".env.local", ".env"]) {
		if (!existsSync(envFile)) continue;
		const match = /^\s*(?:VITE_)?GEMINI_API_KEY\s*=\s*(.+?)\s*$/m.exec(readFileSync(envFile, "utf8"));
		if (match) return match[1].replace(/^["']|["']$/g, "");
	}
	return undefined;
}

function resolveImagePaths() {
	const args = process.argv.slice(2);
	if (args.length > 0) return args;
	if (!existsSync(".local")) return [];
	return readdirSync(".local")
		.filter((name) => MIME_TYPES[path.extname(name).toLowerCase()])
		.map((name) => path.join(".local", name));
}

function toImagePart(imagePath) {
	const mimeType = MIME_TYPES[path.extname(imagePath).toLowerCase()];
	if (!mimeType) throw new Error(`Unsupported image type: ${imagePath}`);
	return { inlineData: { mimeType, data: readFileSync(imagePath).toString("base64") } };
}

async function fetchDatabaseKeys(node) {
	try {
		const response = await fetch(`${DATABASE_URL}/${node}.json?shallow=true`);
		return Object.keys((await response.json()) || {});
	} catch {
		console.warn(`Could not fetch ${node} from the database, continuing with an empty list.`);
		return [];
	}
}

const apiKey = loadApiKey();
if (!apiKey) {
	console.error("No API key found. Set GEMINI_API_KEY or put it into .env.local.");
	process.exit(1);
}

const imagePaths = resolveImagePaths();
if (imagePaths.length === 0) {
	console.error("No images found. Pass image paths as arguments or put them into .local/.");
	process.exit(1);
}

const model = process.env.GEMINI_MODEL || DEFAULT_EXTRACTION_MODEL;
const [labels, authors] = await Promise.all([fetchDatabaseKeys("labels"), fetchDatabaseKeys("authors")]);

console.log(`Model: ${model}`);
console.log(`Images: ${imagePaths.join(", ")}`);
console.log(`Context: ${labels.length} labels, ${authors.length} authors\n`);

const started = Date.now();
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
	method: "POST",
	headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
	body: JSON.stringify({
		contents: [{ role: "user", parts: [{ text: buildExtractionPrompt({ labels, authors }) }, ...imagePaths.map(toImagePart)] }],
		generationConfig: {
			responseMimeType: "application/json",
			responseSchema: extractionResponseSchema,
			temperature: 0.1,
		},
	}),
});

if (!response.ok) {
	console.error(`Request failed (${response.status}):\n${await response.text()}`);
	process.exit(1);
}

const body = await response.json();
const rawText = body.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
console.log(`Done in ${((Date.now() - started) / 1000).toFixed(1)} s, usage: ${JSON.stringify(body.usageMetadata)}\n`);

let parsed;
try {
	parsed = JSON.parse(rawText);
} catch {
	console.error("Response is not valid JSON:\n" + rawText);
	process.exit(1);
}

const { songSource, warnings } = normalizeExtractedSong(parsed);
console.log("--- Extracted song ---");
console.log(`Title:    ${songSource.title}`);
console.log(`Author:   ${songSource.author}`);
console.log(`Labels:   ${songSource.labels.join(", ")}`);
console.log(`Notation: ${songSource.standardNotation ? "standard" : "german/czech"}`);
if (warnings.length > 0) console.log(`Warnings: ${warnings.join(" | ")}`);
console.log("\n" + songSource.text);
