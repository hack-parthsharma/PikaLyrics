import fastify from "fastify";
import vosk, { Recognizer, RecognizerResult } from "vosk";
import fs from "fs/promises";
import fss from "fs";
import path from "path";
import wav, { Reader } from "wav";
import { Readable } from "stream";
import { stringifySync, NodeList } from "subtitle";
import ffmpeg from "fluent-ffmpeg";
import axios from "axios";
import youtubedl from "youtube-dl-exec";
import { spawn } from "child_process";

const app = fastify();

const model = new vosk.Model("model");
const speakerModel = new vosk.SpeakerModel("model-spk");
const WORDS_PER_LINE = 7;

app.post("/", async (request, res) => {
	try {
		const videoURL = (request.body as any).url as string | null;
		if (!videoURL) return res.send("No video URL provided");
		console.log("[Received VIDEO URL]", videoURL);
		const videoID = videoURL.split("?v=")[1];

		const wavPath = `${process.cwd()}/build/${videoID}.wav`;
		const monoWavPath = `${process.cwd()}/build/${videoID}.mono.wav`;

		if (!fss.existsSync(wavPath)) {
			const videoRes = await youtubedl(videoURL, {
				referer: videoURL,
				audioFormat: "wav",
				extractAudio: true,
				noCheckCertificate: true,
				callHome: false,
				quiet: true,
				output: `${process.cwd()}/build/%(id)s.%(ext)s`,
			});
			console.log(videoRes);
		}

		const ffmpegOut = spawn("ffmpeg", [
			"-y",
			"-i",
			wavPath,
			"-ac",
			"1",
			monoWavPath,
		]);

		const data = await new Promise((resolve, reject) =>
			ffmpegOut.on("exit", (code, signal) => {
				const reader = new Reader();
				const readerReadable = new Readable().wrap(reader);

				const results: RecognizerResult[] = [];

				reader.on("format", async ({ sampleRate }) => {
					const rec = new Recognizer({ model, sampleRate });
					rec.setSpkModel(speakerModel);
					rec.setWords(true);
					try {
						for await (const data of readerReadable) {
							let result: RecognizerResult;
							if (rec.acceptWaveform(data)) {
								result = rec.result();
							} else {
								result = rec.finalResult();
							}
							if (result.hasOwnProperty("result")) {
								console.log("[DATA]");
								results.push(result);
							}
						}
					} finally {
						rec.free();
					}
				});

				fss
					.createReadStream(monoWavPath)
					.on("end", () => {
						try {
							model.free();
							speakerModel.free();
							const subs: NodeList = [];
							for (const element of results) {
								const words = element.result;
								if (words.length == 1) {
									subs.push({
										type: "cue",
										data: {
											start: words[0].start * 1000,
											end: words[0].end * 1000,
											text: words[0].word,
										},
									});
									continue;
								}
								let start_index: number = 0;
								let text: string = words[0].word + " ";
								for (let i = 1; i < words.length; i++) {
									text += words[i].word + " ";
									if (i % WORDS_PER_LINE == 0) {
										subs.push({
											type: "cue",
											data: {
												start: words[start_index].start * 1000,
												end: words[i].end * 1000,
												text: text.slice(0, text.length - 1),
											},
										});
										start_index = i;
										text = "";
									}
								}
								if (start_index != words.length - 1)
									subs.push({
										type: "cue",
										data: {
											start: words[start_index].start * 1000,
											end: words[words.length - 1].end * 1000,
											text: text,
										},
									});
							}
							console.log("[Subs]", subs);
							resolve(stringifySync(subs, { format: "SRT" }));
						} catch (error) {
							console.error("[SRT AST manifestation]", error);
							reject(error);
						}
					})
					.pipe(reader);
			})
		);

		res.send(data);
	} catch (error) {
		console.error("[Error] [POST /]", error);
	}
});

app.listen({ port: 3000 });
