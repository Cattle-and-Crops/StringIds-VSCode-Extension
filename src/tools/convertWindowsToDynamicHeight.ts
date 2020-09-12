import { Range, window } from 'vscode';
import { getFilenameFromPath, padNumber } from '../helpers/helpers';

/**
 *
 *
 */

export async function convertWindowsToDynamicHeight() {
	const editor = window.activeTextEditor;
	if (!editor) {
		return;
	}

	const document = editor.document;
	if (document.languageId !== 'xml') {
		window.showErrorMessage("This isn't an XML file");
		return;
	}

	// TODO
	/*
	https://regex101.com/r/cGS4ta/5/

	find <window ... content ... lazy </window>
	<window.*size=("|')(\w+)\1
		if size == (\w+)\d\d\d -> replace with $1
	<window.*position=("|')(\w+)\1 -> position = $2
	content:
		are there <page.*<page without any <window before them after that? -> pages = true
		is there showContrinue="true" after that without any <window before that? -> button == true
	 */

	let text = document.getText();

	// (1) Switch 'position' and ' size' if in wrong order
	text = setWindowAttributeOrder(text);

	// (2) Convert old type windows to "new" ones
	text = convertOldWindows(text);

	// (3) Add dynamic height attributes
	text = addDynamicHeight(text);

	// (4) Update document
	editor.edit((editBuilder) => {
		editBuilder.replace(new Range(0, 0, document.lineCount, 5000), text);
	});
}

/**
 * Makes sure that `position` and `size` attributes are in the correct order in `window` elements.
 *
 * @param text The complete input xml content
 * @returns Complete XML content
 */
function setWindowAttributeOrder(text: string) {
	return text.replace(/<window size="(.*?)"\s+?position="(.*?)"/gm, '<window position="$2" size="$1"');
}

/**
 * Converts "old" windows (without pages and elements) to the "new" versions
 *
 * @param text The complete input xml content
 * @param position The window's new position attribute. Default: "underCondition"
 * @param size The window's new size attribute. Default: "underCondition"
 * @param continueButton If true, the window will get a "CONTINUE" button. Default: `false`
 * @param changeStringId If true, the window's stringId will be changed from "...-INFO" to "...-I001". Default: `false`
 * @returns Complete XML content
 */
function convertOldWindows(
	text: string,
	position: string = 'underCondition',
	size: string = 'underCondition',
	continueButton: boolean = false,
	changeStringId: boolean = false
) {
	const regex = /^(\t*)<window\s+(?!size|position)(.*?)stringId="(.*?)"(.*?)>(.*?)<\/window>/gms;
	const callback = (
		match: string,
		indentBase: string,
		beforeStringId: string,
		stringId: string,
		afterStringId: string,
		content: string
	) => {
		if (changeStringId) {
			stringId = stringId.replace('-INFO', '-I001');
		}
		return `${indentBase}<window position="${position}" size="${size}"${beforeStringId}${afterStringId}>
${indentBase}	<page showContinue="${continueButton ? 'true' : 'false'}">
${indentBase}		<element type="text" stringId="${stringId}">${content.trim()}</element>
${indentBase}	</page>
${indentBase}</window>`;
	};

	let newText = text.replace(regex, callback);
	return newText;
}

function addDynamicHeight(text: string) {
	/*
	// const windowRegex = /<window(.*?)>(.*?)<\/window>/gms;
	const windowRegex = /<window.*?position="(.+?)" size="(.+?)".*?>(.*?)<\/window>/gms;
	// const windows = text.match(windowRegex);
	let match = windowRegex.exec(text);
	while (match !== null) {
		if (match && match.length >= 3) {
			// let sizePosMatch = //gm.exec(match[1]);
			let sizeMatch = match[1].match(/(size="(.+?)")/gm);
			let posMatch = match[1].match(/(position="(.+?)")/gm);
		}

		match = windowRegex.exec(text);
	}
	*/

	/* 	if (windows) {
		for (const window of windows) {

			const match1 = window.match(windowRegex);
		}
	} */

	return text;
}

const sizes: any = {
	content: {
		offset: 60,
		paddingBottom: 20,
		pages: 40,
		button: 60,
	},
	replaceSize: {
		medium550: 'medium',
		underCondition250: 'underCondition',
		underCondition300: 'underCondition',
	},

	underCondition: {
		total: 610,
		topMargin: 0,
		bottomMargin: 0,
	},
	center: {
		total: 1080,
		topMargin: 120,
		bottomMargin: 120,
	},
};

/**
 * Calculates the `maxHeight` for a window given the provided position, button and pages attributes.
 *
 * @param position The window's position
 * @param button Indicates if the window uses a button
 * @param pages Indicates if the window uses multiple pages
 */
function getOptimalSize(position: string = 'underCondition', button: boolean = false, pages: boolean = false): number {
	let ret = 580;

	const data = sizes[position];
	if (data) {
		ret = data.total - data.topMargin - data.bottomMargin;

		ret -= sizes.content.offset;
		if (button) {
			ret -= sizes.content.button;
		}
		if (pages) {
			ret -= sizes.content.pages;
		}
	}

	return ret;
}
