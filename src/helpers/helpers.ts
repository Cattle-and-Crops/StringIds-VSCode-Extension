import { env, window, Uri, workspace, WorkspaceEdit, Range } from 'vscode';
import path = require('path');

export const replacePartAtPos = (str: string, position: number, length: number, newText: string): string => {
	const before = str.substr(0, position);
	const after = str.substr(position + length, str.length);
	return before + newText + after;
};

/**
 * Returns a random integer between (and including) `min` and `max`.
 * @param min The lower end of the possible range.
 * @param max The upper end of the possible range.
 */
export const getRandomInt = (min: number, max: number): number => {
	return Math.floor(Math.random() * (max - min)) + min;
};

export const padNumber_v1 = (num: number, width: number, z: string = '0'): string => {
	const n = num + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

export const padNumber = (num: number, width: number, padString: string = '0') => {
	return num.toString().padStart(width, padString);
};

export const getFilenameFromPath = (path: string): string => {
	return path.replace(/^.*[\\\/]/, '');
};

/**
 * Capitalizes the string's first character.
 * @param text The string to be capitalized.
 * @param all If true, _all_ words in the string will be capitalized.
 */
export const capitalize = (text: string, all: boolean = false): string => {
	if (all) {
		return text.replace(/\w\S*/g, (word) => capitalize(word));
	}
	return text.replace(/^\w/, (c) => c.toUpperCase());
};

const arrayMoveMutate = (array: any[], from: number, to: number) => {
	const startIndex = to < 0 ? array.length + to : to;
	const item = array.splice(from, 1)[0];
	array.splice(startIndex, 0, item);
};
/**
 * Move an array item to a different position
 * @param array
 * @param from Index of item to move. If negative, it will begin that many elements from the end.
 * @param to Index of where to move the item. If negative, it will begin that many elements from the end.
 * @source [[npm] array-move](https://www.npmjs.com/package/array-move)
 */
export const arrayMove = (array: any[], from: number, to: number): any[] => {
	array = array.slice();
	arrayMoveMutate(array, from, to);
	return array;
};

/**
 * Escapes quotes, newLines and tab characters
 * @param text The string containing the text
 * @param quotes If `true`, unescaped quotes (" -> \\") and apostrophes (' -> \\') will be escaped. *Default:* `true`
 * @param newLines If `true`, new lines (-> \\n) and tabs (-> \\t) will be escaped. *Default:* `true`
 * @returns The escaped string
 */
export const customEscape = (text: string, quotes: boolean = true, newLines: boolean = true) => {
	// Escape " and ', but skip already escaped \" and \' with a negative lookbehind
	// @source: https://stackoverflow.com/a/25713682
	if (quotes) {
		text = text.replace(/(?<!\\)("|')/gm, '\\$1');
	}

	// Escape line breaks and tabs
	if (newLines) {
		text = text
			.replace(/(\r\n)/g, '\\n')
			.replace(/(\n\r)/g, '\\n')
			.replace(/(\n)/g, '\\n')
			.replace(/(\r)/g, '\\r')
			.replace(/(\t)/g, '\\t');
	}

	return text;
};

/**
 * Replaces CRLF line breaks in an `expandedDescription` attribute with escaped LFs ("\n").
 * @param text The document's complete text
 */
export const escapeMultiLineAttributes = (text: string = '') => {
	// https://regex101.com/r/cQiGu7/1
	const match = text.match(/expandedDescription="([^"]+)"/gm);

	if (match) {
		const lineBreaks = /\r\n/gm;
		for (const result of match) {
			let escapedText = result.replace(lineBreaks, '\\n');
			text = text.replace(result, escapedText);
		}
	}

	return text;
};

/**
 * Replaces consecutive occurences of "\t"
 * @param text The string containing the text
 * @param minConsecutiveAmount The minimum amount of consecutive tab characters. Default: 2
 */
export const removeMultipleTabs = (text: string, minConsecutiveAmount: number = 2) => {
	text = text.replace(new RegExp(`(\\t){${minConsecutiveAmount},}`, 'g'), '');
	return text;
};

/**
 * Unescapes quotes, newLines and tab characters
 * @param text The string containing the text
 * @param quotes If `true`, escaped quotes (\\" -> ") and apostrophes (\\' -> ') will be unescaped. *Default:* `true`
 * @param newLines If `true`, new lines (\\n -> \n) and tabs (\\t -> \t) will be unescaped. *Default:* `true`
 * @returns The unescaped string
 */
export const customUnescape = (text: string, quotes: boolean = true, newLines: boolean = true) => {
	// Unescape " and '
	if (quotes) {
		text = text.replace(/\\("|')/gm, '$1');
	}

	// Escape line breaks and tabs
	if (newLines) {
		text = text.replace(/(\\n)/g, '\n').replace(/(\\r)/g, '\r').replace(/(\\t)/g, '\t');
	}

	return text;
};

/**
 * Writes the provided text to the user's clipboard
 * @param text The text to be written to the clipboard
 * @param message The success message to be shown
 */
export const writeTextToClipboard = (text: string, message?: string) => {
	env.clipboard.writeText(text).then(() => {
		if (message && message.length > 0) {
			window.showInformationMessage(message);
		}
	});
};

/**
 * Creates a new, empty, unsaved document and pastes the provided text
 * @param text The content to be pasted
 * @param filename The new file's filename including file suffix
 * @source [StackOverflow](https://stackoverflow.com/questions/41068197/vscode-create-unsaved-file-and-add-content)
 */
export const pasteTextInNewDocument = (text: string, filename: string) => {
	const newFile = Uri.parse('untitled:' + path.join(filename));
	workspace.openTextDocument(newFile).then(async (document) => {
		const edit = new WorkspaceEdit();
		// edit.insert(newFile, new Position(0, 0), text);
		edit.replace(newFile, new Range(0, 0, document.lineCount, 999999), text);

		const success = await workspace.applyEdit(edit);
		if (success) {
			window.showTextDocument(document);
		} else {
			window.showErrorMessage("Document couldn't be created correctly");
		}
	});
};
