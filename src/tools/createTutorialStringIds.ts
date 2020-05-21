import { Range, window } from 'vscode';
import { getFilenameFromPath, padNumber } from '../helpers/helpers';

/**
 * Creates `stringId` entries for the mission name, descriptions and all conditions and its windows.
 * Only sets them if the element already has a `stringId` attribute.
 */
export async function createTutorialStringIds() {
	const editor = window.activeTextEditor;
	if (!editor) {
		return;
	}

	const document = editor.document;
	if (document.languageId !== 'xml') {
		window.showErrorMessage("This isn't an XML file");
		return;
	}

	const filename = getFilenameFromPath(document.uri.path).toLocaleLowerCase();
	const stringIdBase = await getStringIdBase(filename);

	let text = document.getText();

	// Go through text
	const splitText = text.trim().split('\n');
	const ret = [];

	/**
	 * Sets the provided value into an existing stringId attribute and returns the result
	 * @param line Source line
	 * @param value New stringId value
	 */
	const setLineStringId = (line: string, value: string) =>
		line.replace(/stringId=".*?"/, `stringId="${value}"`);

	let step = 0;
	let num = '';
	for (let lineNumber in splitText) {
		let line = splitText[lineNumber];
		let trimmed = line.trim();

		if (trimmed.startsWith('<name ')) {
			line = setLineStringId(line, `${stringIdBase}-TITL`);
		} else if (trimmed.startsWith('<description ')) {
			if (trimmed.search('type="short"') !== -1) {
				line = setLineStringId(line, `${stringIdBase}-DESS`);
			} else if (trimmed.search('type="long"') !== -1) {
				line = setLineStringId(line, `${stringIdBase}-DESL`);
			}
		} else if (trimmed.startsWith('<condition ')) {
			step++;
			num = padNumber(step, 2);
			line = setLineStringId(line, `${stringIdBase}-S${num}_`);
		} else if (trimmed.search(/\<window[\s|\>].*gamepad=\"/gm) > -1) {
			line = setLineStringId(line, `${stringIdBase}-S${num}G`);
		} else if (trimmed.startsWith('<window')) {
			line = setLineStringId(line, `${stringIdBase}-S${num}I`);
		}

		ret.push(line);
	}

	ret.push('');
	const newText = ret.join('\n');

	// Apply changes to document
	editor.edit((editBuilder) => {
		editBuilder.replace(new Range(0, 0, document.lineCount, 5000), newText);
	});
	window.showInformationMessage('StringIds replaced');
}

/**
 * Takes a filename with the format of `tutorial_0_0_0.xml` and returns the mission's stringId base ("TUTO-CA00-CA00-MI00").
 * @param {string} filename - The mission's filename including suffix
 * @returns {string} The stringId base in the format of TUTO-CA00-CA00-MI00
 */
const getStringIdBaseFromFilename = (filename: string) => {
	let stringIdBaseAr = [];
	let pathBase = filename.match(/tutorial_(\d+)_(\d+)_(\d+).xml/);
	if (pathBase && pathBase.length === 4) {
		stringIdBaseAr.push('TUTO');
		stringIdBaseAr.push('-CA' + padNumber(Number(pathBase[1]), 2));
		stringIdBaseAr.push('-CA' + padNumber(Number(pathBase[2]), 2));
		stringIdBaseAr.push('-TU' + padNumber(Number(pathBase[3]), 2));

		return stringIdBaseAr.join('');
	}

	return null;
};

/**
 * Provides an input box with a pre-calculated `stringId` base and an option to enter a custom one
 * @param {string} filename the file's name
 * @returns {Promise<string>} The proposed or entered `stringId` base
 */
async function getStringIdBase(filename: string) {
	const proposal = getStringIdBaseFromFilename(filename);
	const regex = /^([A-Za-z0-9_])+$/gm;

	// Show the input box and wait for input
	let result = await window.showInputBox({
		value: proposal ? proposal : undefined,
		valueSelection: undefined,
		placeHolder: 'Enter a stringId base',
		prompt: 'Enter a stringId base',
		validateInput: (text) => {
			if (text.length === 0) {
				return 'Give me something!';
			}

			let blocks = text.split('-');
			for (const index in blocks) {
				const block = blocks[index];
				let test = block.match(regex);

				const msgEnd = `in block ${
					Number(index) + 1
				} ("${block}"). The stringId needs to be in blocks of 4 characters each (AAAA-AAAA-...).`;
				if (!test) {
					return `Invalid character ${msgEnd}`;
				}
				if (test.length > 1) {
					return `Invalid separator character ${msgEnd}`;
				}
				if (test[0].length < 4) {
					return `Less than 4 characters ${msgEnd}`;
				}
				if (test[0].length > 4) {
					return `More than 4 characters ${msgEnd}`;
				}
			}
			return null;
		},
	});

	return result;
}
