import { Range, window } from 'vscode';

export function convertWindowsToDynamicHeight() {
	const editor = window.activeTextEditor;
	if (!editor) {
		return;
	}

	const document = editor.document;
	if (document.languageId !== 'xml') {
		window.showErrorMessage("This isn't an XML file");
		return;
	}

	let text = document.getText();

	// (1) Switch 'position' and ' size' if in wrong order, also add either of the two if missing
	text = setPositionSizeAttributes(text);

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
function setPositionSizeAttributes(text: string) {
	let ret = text;

	// (1) Add missing "size" attribute
	ret = ret.replace(/<window((?!size).)*$/gm, (match: string) => {
		return '<window size="small" ' + match.substring('<window '.length);
	});

	// (2) Add missing "position" attribute
	ret = ret.replace(/<window((?!position).)*$/gm, (match: string) => {
		return '<window position="default" ' + match.substring('<window '.length);
	});

	// (3) position vs size order
	ret = ret.replace(/<window size="(.*?)"\s+?position="(.*?)"/gm, '<window position="$2" size="$1"');

	return ret;
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
	const regex = /^(\t*)<window([^\n\r]*?)stringId="(.*?)"(.*?)>(.*?)<\/window>/gms;
	const callback = (match: string, indent: string, beforeStringId: string, stringId: string, afterStringId: string, content: string) => {
		if (!content.includes('<page')) {
			// <window> line
			let ret = `${indent}<window`;
			if (!match.includes('position="')) {
				ret += ` position="${position}"`;
			}
			if (!match.includes('size="')) {
				ret += ` size="${size}"`;
			}
			ret += beforeStringId + afterStringId + '>\n';

			// <page> line
			ret += `${indent}	<page${continueButton ? ' showContinue="true"' : ''}>\n`;

			// <element /> line and closing tags
			if (changeStringId) {
				stringId = stringId.replace('-INFO', '-I001');
			}
			ret += `${indent}		<element type="text" stringId="${stringId}">${content.trim()}</element>
${indent}	</page>
${indent}</window>`;

			return ret;
		}

		return match;
	};

	let newText = text.replace(regex, callback);
	return newText;
}

function addDynamicHeight(text: string) {
	// https://regex101.com/r/GWUyee/1
	const regex = /^(\t*)<window(.*?)position="(.+?)"(.*?)size="(.+?)"(.*?>.*?<\/window>)/gms;
	const callback = (
		match: string,
		indent: string,
		beforePosition: string,
		position: string,
		beforeSize: string,
		size: string,
		afterSize: string
	) => {
		// Remove numbers from 'size' value
		size = size.replace(/[0-9]/g, '');

		let newText = `${indent}<window${beforePosition}position="${position}"${beforeSize}size="${size}"`;

		// Insert Dynamic Height
		if (!afterSize.includes('dynamicHeight')) {
			// Has button
			const hasButton = afterSize.includes('showContinue="true"');

			// Multiple pages
			const multiPages = (afterSize.match(/<page/gms) || []).length > 1;

			// Get max height
			const maxHeight = getOptimalSize(position, hasButton, multiPages);

			newText += ` dynamicHeight="true" maxHeight="${maxHeight}"`;
		}

		newText += afterSize;
		return newText;
	};

	let newText = text.replace(regex, callback);
	return newText;
}

const sizes: any = {
	content: {
		offset: 60,
		paddingBottom: 20,
		pages: 40,
		button: 60,
	},

	default: {
		total: 1080,
		topMargin: 90,
		bottomMargin: 120,
	},
	center: {
		total: 1080,
		topMargin: 120, // quickSlots, as the window is vertically centered
		bottomMargin: 120, // quickSlots
	},
	centerTop: {
		total: 1080,
		topMargin: 20,
		bottomMargin: 120,
	},
	rightCenter: {
		total: 1080,
		topMargin: 300, // speedometer, as the window is vertically centered
		bottomMargin: 300, // speedometer
	},
	rightTop: {
		total: 1080,
		topMargin: 0,
		bottomMargin: 300, // speedometer
	},
	rightUnderCondition: {
		total: 1080,
		topMargin: 175, // condition
		bottomMargin: 300, // speedometer
	},
	underCondition: {
		total: 610,
		topMargin: 0,
		bottomMargin: 0,
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

	let data = sizes[position];
	if (!data) {
		data = sizes.underCondition;
	}

	// Calculation
	ret = data.total - data.topMargin - data.bottomMargin;

	ret -= sizes.content.offset;
	if (button) {
		ret -= sizes.content.button;
	}
	if (pages) {
		ret -= sizes.content.pages;
	}

	return ret;
}
