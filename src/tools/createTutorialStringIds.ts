import { window, Range } from 'vscode';
import { getFilenameFromPath, padNumber } from '../helpers/helpers';

export async function createTutorialStringIds() {
	const editor = window.activeTextEditor;

	if (editor) {
		const document = editor.document;
		const filename = getFilenameFromPath(document.uri.path).toLocaleLowerCase();

		if ('file' === document.uri.scheme && filename.endsWith('.xml')) {
			let stringIdBase = getStringIdBaseFromFilename(filename);

			let text = document.getText();

			// Go through text
			const splitText = text.trim().split('\n');
			const ret = [];
			let step = 0;
			let stringId = '';
			let num = '';

			for (let lineNumber in splitText) {
				let line = splitText[lineNumber];
				let trimmed = line.trim();

				if (trimmed.startsWith('<name ')) {
					stringId = `${stringIdBase}-TITL`;
					line = line.replace(/stringId=".*?"/, `stringId="${stringId}"`);
				} else if (trimmed.startsWith('<description ')) {
					if (trimmed.search('type="short"') !== -1) {
						stringId = `${stringIdBase}-DESS`;
					} else if (trimmed.search('type="long"') !== -1) {
						stringId = `${stringIdBase}-DESL`;
					}
					line = line.replace(/stringId=".*?"/, `stringId="${stringId}"`);
				} else if (trimmed.startsWith('<condition ')) {
					step++;
					num = padNumber(step, 2);
					stringId = `${stringIdBase}-S${num}_`;
					line = line.replace(/stringId=".*?"/, `stringId="${stringId}"`);
				} else if (trimmed.startsWith('<window')) {
					stringId = `${stringIdBase}-S${num}I`;
					line = line.replace(/stringId=".*?"/, `stringId="${stringId}"`);
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
	}
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
	}
	let stringIdBase = stringIdBaseAr.join('');

	return stringIdBase;
};
