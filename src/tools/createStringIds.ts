import { Range, window } from 'vscode';
import { getFilenameFromPath, padNumber } from '../helpers/helpers';

/**
 * Creates `stringId` entries for the mission name, descriptions and all conditions and its windows.
 * Only sets them if the element already has a `stringId` attribute.
 */
export async function createStringIds() {
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
	 * @param attribute The stringId attribute ("stringId", "titleStringId", "expandedStringId"). *Default: "stringId"*
	 */
	const setLineStringId = (line: string, value: string, attribute: string = 'stringId') =>
		line.replace(new RegExp(`${attribute}=".*?"`, 'i'), `${attribute}="${value}"`);

	let windowType = null;
	let conditionNum = 0;
	let conditionNumPadded = '';
	let elementNum = 0;
	for (let lineNumber in splitText) {
		let line = splitText[lineNumber];
		let trimmed = line.trim();

		// name -> TITL
		if (trimmed.startsWith('<name ')) {
			line = setLineStringId(line, `${stringIdBase}TITL`);

			// description -> DESS/DESL
		} else if (trimmed.startsWith('<description ')) {
			if (trimmed.search('type="short"') !== -1) {
				line = setLineStringId(line, `${stringIdBase}DESS`);
			} else if (trimmed.search('type="long"') !== -1) {
				line = setLineStringId(line, `${stringIdBase}DESL`);
			}

			// condition -> S000
		} else if (trimmed.startsWith('<condition ')) {
			conditionNum++;
			conditionNumPadded = padNumber(conditionNum, 3);
			line = setLineStringId(line, `${stringIdBase}S${conditionNumPadded}`);
			line = setLineStringId(
				line,
				`${stringIdBase}S${conditionNumPadded}-EXPA`,
				'expandedStringId'
			);

			// window gamepad -> S000-GPAD
		} else if (trimmed.search(/\<window[\s|\>].*gamepad=\"/gm) > -1) {
			line = setLineStringId(line, `${stringIdBase}S${conditionNumPadded}-GPAD`);
			line = setLineStringId(
				line,
				`${stringIdBase}S${conditionNumPadded}-GTIT`,
				'titleStringId'
			);
			elementNum = 0;
			windowType = 'G';

			// window -> S000-INFO
		} else if (trimmed.startsWith('<window')) {
			line = setLineStringId(line, `${stringIdBase}S${conditionNumPadded}-INFO`);
			line = setLineStringId(
				line,
				`${stringIdBase}S${conditionNumPadded}-ITIT`,
				'titleStringId'
			);
			elementNum = 0;
			windowType = 'I';

			// window page element -> S000-I000/S000-G000
		} else if (trimmed.search(/\<element[\s|\>].*type=\"text\"/gm) > -1) {
			elementNum++;
			line = setLineStringId(
				line,
				`${stringIdBase}S${conditionNumPadded}-${windowType + padNumber(elementNum, 3)}`
			);
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
 * Takes a filename with the format of `tutorial_1_2_3.xml` and returns the mission's stringId base ("TUTO-0102-T003").
 * @param {string} filename - The mission's filename including suffix
 * @returns {string} The stringId base in the format of TUTO-0102-T003
 */
const getStringIdBaseFromFilename = (filename: string): string | null => {
	let base = 'BASE';
	for (const type of [
		['campaign', 'CAMP'],
		['mission', 'MISS'],
		['tutorial', 'TUTO'],
	]) {
		if (filename.toLowerCase().search(type[0]) > -1) {
			base = type[1];
			break;
		}
	}
	let ret = [base];

	if (base === 'TUTO') {
		let matches = filename.match(/(\d+).*?(\d+).*?(\d+)/);
		if (matches && matches.length === 4) {
			// TUTO-0101-T001
			ret.push('-');
			ret.push(padNumber(Number(matches[1]), 2));
			ret.push(padNumber(Number(matches[2]), 2));
			ret.push('-T' + padNumber(Number(matches[3]), 3));

			return ret.join('');
		}
	} else if (base === 'MISS' || base === 'CAMP') {
		let matches = filename.match(/(\d+)/g);
		if (matches && matches[1]) {
			ret.push('-MI' + padNumber(Number(matches[1]), 2));

			return ret.join('');
		}
	}

	return null;
};

/**
 * Provides an input box with a pre-calculated `stringId` base and an option to enter a custom one
 * @param {string} filename the file's name
 * @returns {Promise<string>} The proposed or entered `stringId` base
 */
async function getStringIdBase(filename: string): Promise<string> {
	const proposal = getStringIdBaseFromFilename(filename);
	const regex = /^([A-Za-z0-9_])+$/gm;

	// Show the input box and wait for input
	let result = await window.showInputBox({
		value: proposal ? proposal : undefined,
		valueSelection: undefined,
		placeHolder: 'ABCD-1234-SE_I',
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

	if (result === undefined) {
		console.log('StringId Base input box cancelled');
		return '';
	}

	return `${result}-`;
}
