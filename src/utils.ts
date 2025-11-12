import { generate as generateWords } from 'random-words';
import { DEFAULT_WORD_COUNT } from './constants';

export const createPrompt = (wordCount = DEFAULT_WORD_COUNT) =>
	generateWords({
		exactly: wordCount,
		join: ' ',
		formatter: (word) => word.toLowerCase()
	}) as string;

export const formatSeconds = (milliseconds: number) =>
	(milliseconds / 1000).toFixed(1);

export const isPrintableKey = (key: {
	sequence?: string;
	ctrl?: boolean;
	meta?: boolean;
	option?: boolean;
	raw?: string;
}) => {
	if (!key.sequence || key.sequence.length !== 1) {
		return false;
	}

	if (key.ctrl || key.meta || key.option) {
		return false;
	}

	if (key.raw && key.raw.startsWith('\u001b')) {
		return false;
	}

	const code = key.sequence.charCodeAt(0);
	return code >= 32 && code <= 126;
};

