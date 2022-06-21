declare module "vosk" {
	declare function setLogLevel(level: number): void;
	declare class Model {
		constructor(modelPath: string);
		free(): void;
	}
	declare class SpeakerModel {
		constructor(modelPath: string);
		free(): void;
	}
	declare interface RecognizerOptions {
		model: Model;
		sampleRate: number;
	}
	declare interface RecognizedWord {
		conf: number;
		word: string;
		start: number;
		end: number;
	}
	declare interface RecognizerResult {
		result: RecognizedWord[];
	}
	declare class Recognizer {
		/**
		 * Create a Recognizer that will handle speech to text recognition.
		 * @constructor
		 * @param {T & BaseRecognizerParam} param The Recognizer parameters
		 *
		 *  Sometimes when you want to improve recognition accuracy and when you don't need
		 *  to recognize large vocabulary you can specify a list of phrases to recognize. This
		 *  will improve recognizer speed and accuracy but might return [unk] if user said
		 *  something different.
		 *
		 *  Only recognizers with lookahead models support this type of quick configuration.
		 *  Precompiled HCLG graph models are not supported.
		 */
		constructor(param: RecognizerOptions);

		/**
		 * Releases the model memory
		 *
		 * The model object is reference-counted so if some recognizer
		 * depends on this model, model might still stay alive. When
		 * last recognizer is released, model will be released too.
		 */
		free(): void;

		/** Configures recognizer to output n-best results
		 *
		 * <pre>
		 *   {
		 *      "alternatives": [
		 *          { "text": "one two three four five", "confidence": 0.97 },
		 *          { "text": "one two three for five", "confidence": 0.03 },
		 *      ]
		 *   }
		 * </pre>
		 *
		 * @param max_alternatives - maximum alternatives to return from recognition results
		 */
		setMaxAlternatives(max_alternatives: number): void;

		/** Configures recognizer to output words with times
		 *
		 * <pre>
		 *   "result" : [{
		 *       "conf" : 1.000000,
		 *       "end" : 1.110000,
		 *       "start" : 0.870000,
		 *       "word" : "what"
		 *     }, {
		 *       "conf" : 1.000000,
		 *       "end" : 1.530000,
		 *       "start" : 1.110000,
		 *       "word" : "zero"
		 *     }, {
		 *       "conf" : 1.000000,
		 *       "end" : 1.950000,
		 *       "start" : 1.530000,
		 *       "word" : "zero"
		 *     }, {
		 *       "conf" : 1.000000,
		 *       "end" : 2.340000,
		 *       "start" : 1.950000,
		 *       "word" : "zero"
		 *     }, {
		 *       "conf" : 1.000000,
		 *       "end" : 2.610000,
		 *       "start" : 2.340000,
		 *       "word" : "one"
		 *     }],
		 * </pre>
		 *
		 * @param words - boolean value
		 */
		setWords(words: boolean): void;

		/** Same as above, but for partial results*/
		setPartialWords(words: boolean): void;

		/** Adds speaker recognition model to already created recognizer. Helps to initialize
		 * speaker recognition for grammar-based recognizer.
		 *
		 * @param spk_model Speaker recognition model
		 */
		setSpkModel(model: SpeakerModel): void;

		/**
		 * Accept voice data
		 *
		 * accept and process new chunk of voice data
		 *
		 * @param {Buffer} data audio data in PCM 16-bit mono format
		 * @returns true if silence is occured and you can retrieve a new utterance with result method
		 */
		acceptWaveform(data: Buffer): boolean;

		/**
		 * Accept voice data
		 *
		 * accept and process new chunk of voice data
		 *
		 * @param {Buffer} data audio data in PCM 16-bit mono format
		 * @returns true if silence is occured and you can retrieve a new utterance with result method
		 */
		acceptWaveformAsync(data: Buffer): Promise<boolean>;

		/** Returns speech recognition result in a string
		 *
		 * @returns the result in JSON format which contains decoded line, decoded
		 *          words, times in seconds and confidences. You can parse this result
		 *          with any json parser
		 * <pre>
		 * {
		 *   "result" : [{
		 *       "conf" : 1.000000,
		 *       "end" : 1.110000,
		 *       "start" : 0.870000,
		 *       "word" : "what"
		 *     }, {
		 *       "conf" : 1.000000,
		 *       "end" : 1.530000,
		 *       "start" : 1.110000,
		 *       "word" : "zero"
		 *     }, {
		 *       "conf" : 1.000000,
		 *       "end" : 1.950000,
		 *       "start" : 1.530000,
		 *       "word" : "zero"
		 *     }, {
		 *       "conf" : 1.000000,
		 *       "end" : 2.340000,
		 *       "start" : 1.950000,
		 *       "word" : "zero"
		 *     }, {
		 *       "conf" : 1.000000,
		 *      "end" : 2.610000,
		 *       "start" : 2.340000,
		 *       "word" : "one"
		 *     }],
		 *   "text" : "what zero zero zero one"
		 *  }
		 * </pre>
		 */
		resultString(): string;

		/**
		 * Returns speech recognition results
		 * @returns {Result<T>} The results
		 */
		result(): RecognizerResult;

		/**
		 * speech recognition text which is not yet finalized.
		 * result may change as recognizer process more data.
		 *
		 * @returns {PartialResults} The partial results
		 */
		partialResult(): RecognizerResult;

		/**
		 * Returns speech recognition result. Same as result, but doesn't wait for silence
		 * You usually call it in the end of the stream to get final bits of audio. It
		 * flushes the feature pipeline, so all remaining audio chunks got processed.
		 *
		 * @returns {Result<T>} speech result.
		 */
		finalResult(): RecognizerResult;

		/**
		 *
		 * Resets current results so the recognition can continue from scratch
		 */
		reset(): void;
	}
}
