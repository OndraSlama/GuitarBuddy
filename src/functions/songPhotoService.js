import { getApp } from "firebase/app";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { DEFAULT_EXTRACTION_MODEL, buildExtractionPrompt, extractionResponseSchema, normalizeExtractedSong } from "./songPhotoExtraction.mjs";

const MAX_IMAGE_DIMENSION = 2048;
const JPEG_QUALITY = 0.85;

export async function extractSongFromPhotos(files, { labels = [], authors = [] } = {}) {
	const ai = getAI(getApp(), { backend: new GoogleAIBackend() });
	const model = getGenerativeModel(ai, {
		model: import.meta.env.VITE_GEMINI_MODEL || DEFAULT_EXTRACTION_MODEL,
		generationConfig: {
			responseMimeType: "application/json",
			responseSchema: extractionResponseSchema,
			temperature: 0.1,
		},
	});

	const imageParts = await Promise.all(files.map(toImagePart));

	let result;
	try {
		result = await model.generateContent([{ text: buildExtractionPrompt({ labels, authors }) }, ...imageParts]);
	} catch (e) {
		console.error("Song photo extraction failed:", e);
		throw new Error(friendlyServiceError(e));
	}

	let parsed;
	try {
		parsed = JSON.parse(result.response.text());
	} catch {
		throw new Error("The AI returned an unreadable response. Please try again.");
	}

	return normalizeExtractedSong(parsed);
}

function friendlyServiceError(e) {
	const message = String((e && e.message) || "");
	if (message.includes("App Check")) {
		return "App Check rejected the request. Either configure App Check for this app or set Firebase AI Logic to unenforced in the Firebase console.";
	}
	if (message.includes("blocked") || message.includes("403")) {
		return "The AI service is not enabled for this Firebase project (enable Firebase AI Logic in the Firebase console).";
	}
	if (message.includes("429")) {
		return "The AI service is currently over its usage limit. Please try again in a while.";
	}
	return "Could not reach the AI service. Please check your connection and try again.";
}

async function toImagePart(file) {
	try {
		return { inlineData: { mimeType: "image/jpeg", data: await downscaleToJpegBase64(file) } };
	} catch {
		// Some camera formats (e.g. HEIC outside Safari) cannot be decoded by
		// the browser; Gemini accepts them directly, so send the original bytes.
		return { inlineData: { mimeType: file.type || "image/jpeg", data: await fileToBase64(file) } };
	}
}

// Phone photos are 5-10 MB; downscaling keeps requests well under the 20 MB
// inline-data limit and cuts latency without hurting text legibility.
async function downscaleToJpegBase64(file) {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(1, Math.round(bitmap.width * scale));
	canvas.height = Math.max(1, Math.round(bitmap.height * scale));
	canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	bitmap.close();
	return canvas.toDataURL("image/jpeg", JPEG_QUALITY).split(",")[1];
}

function fileToBase64(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result).split(",")[1]);
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}
