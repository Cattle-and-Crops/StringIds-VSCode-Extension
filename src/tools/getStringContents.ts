import { window, workspace } from 'vscode';
import { customEscape, pasteTextInNewDocument, writeTextToClipboard } from '../helpers/helpers';

let parser = require('fast-xml-parser');

/**
 * Gathers all stringId entries and corresponding texts and renders them in a new
 * empty file in column format. Can then be pasted in the CNC translations table.
 */
export async function getStringContents() {
	const config = workspace.getConfiguration('cnc-mission-stringids', undefined);

	const editor = window.activeTextEditor;
	if (!editor) {
		return;
	}

	const document = editor.document;
	if ('file' !== document.uri.scheme) {
		return;
	}

	/*
	1. Get language selection (English, German, Custom)
		-> German:	Output = XXXX	text
		-> English:	Output = XXXX		text
		-> Custom:	Output = XXXX			text
	2. Parse XML with fast-xml-parser
	3. Iterate through name, descriptions, conditions, windows and gather stringId and text
	4. Create output text
	5. Paste in new empty file
	6. Copy to clipboard
	*/

	// Get language
	const language = await getLanguage();
	let columnSeparators: { [key: string]: number } = {
		German: 1,
		English: 2,
		Custom: 3,
	};
	let columnSeparator = '\t'.repeat(language ? columnSeparators[language] : 1);

	// Parse file contents as XML
	let text = document.getText();
	let parsedData = parser.parse(text, {
		attributeNamePrefix: '@_',
		attrNodeName: 'attr', //default is 'false'
		textNodeName: '#text',
		ignoreAttributes: false,
		ignoreNameSpace: false,
		allowBooleanAttributes: true,
		parseNodeValue: true,
		parseAttributeValue: true,
		trimValues: true,
		cdataTagName: '__cdata', //default is 'false'
		cdataPositionChar: '\\c',
		parseTrueNumberOnly: false,
		arrayMode: false, //"strict"
		// attrValueProcessor: (val, attrName) => he.decode(val, {isAttributeValue: true}),//default is a=>a
		// tagValueProcessor : (val, tagName) => he.decode(val), //default is a=>a
		// stopNodes: ["parse-me-as-string"]
	});

	if (!parsedData) {
		console.error(`XML file contents couldn't be parsed`);
		window.showInformationMessage(`XML file contents couldn't be parsed`);
		return;
	}

	// Gather output data
	const outputData = getOutputData(parsedData);

	// Create output text
	const outputText = createOutputText(outputData, columnSeparator);

	// Paste in new document
	if (config && config.getStringContent.pasteStringIdsInNewFile) {
		pasteTextInNewDocument(outputText, 'stringIds.tsv');
	}

	// Copy to clipboard
	if (config && config.getStringContent.copyStringIdsToClipboard) {
		writeTextToClipboard(outputText, 'StringIds and texts copied to clipboard');
	}
}

/**
 * Let's the user choose one of three language options and returns it
 */
async function getLanguage() {
	const result = await window.showQuickPick(['German', 'English', 'Custom'], {
		placeHolder: "Select this document's text language",
	});

	return result;
}

/**
 * Gathers name, description and condition stringId and texts
 * @param parsedData The parsed XML object
 */
function getOutputData(parsedData: any) {
	type stringIdEntry = { [key: string]: string };
	const output: stringIdEntry[] = [];

	/**
	 * Applies a function to the obj, which can be a parameter directly, or an array of parameters to the function
	 * @param obj The object or array of objects to apply the function to
	 * @param callbackFunction The function to be applied to the obj
	 */
	const youOrAllOfYou = (obj: any | any[], callbackFunction: Function) => {
		try {
			if (Array.isArray(obj)) {
				for (const entry of obj) {
					callbackFunction(entry);
				}
			} else {
				callbackFunction(obj);
			}
		} catch (error) {
			console.error(error);
		}
	};

	/**
	 * Checks if the object exists, has all necessary attributes and adds the stringId and text to the output array
	 * @param object The XML element's parsed object
	 * @param stringIdAttribute The entry's stringId attribute name ("stringId", "titleStringId", "expandedStringId"). *Default: "stringId"*
	 * @param stringAttribute The entry's stringId fallback attribute, if existing. Otherwise the element's text will be used
	 */
	const addOutputEntry = (object: any, stringIdAttribute: string = 'stringId', stringAttribute?: string) => {
		if (object && object.attr) {
			const stringId = object.attr[`@_${stringIdAttribute}`];
			if (stringId) {
				let text;
				if ('titleStringId' === stringIdAttribute) {
					text = 'TODO: CUSTOM WINDOW TITLE';
				} else if (stringAttribute && stringAttribute.length > 0) {
					text = object.attr[`@_${stringAttribute}`];
				} else if (object['#text'] && object['#text'].length > 0) {
					text = object['#text'];
				}

				if (text) {
					let escapedText = customEscape(text);
					// escapedText = removeMultipleTabs(text);
					return output.push({ [stringId]: escapedText }) > 0;
				}
			}
		}
		return false;
	};

	let m = parsedData.mission;
	if (m) {
		// Mission name
		addOutputEntry(m.name);

		// Mission description
		if (m.description) {
			youOrAllOfYou(m.description, addOutputEntry);
		}

		// Conditions
		if (m.stop && m.stop.conditions && m.stop.conditions.condition) {
			youOrAllOfYou(m.stop.conditions.condition, (condition: any) => {
				// Condition
				addOutputEntry(condition, 'stringId', 'description');
				addOutputEntry(condition, 'expandedStringId', 'expandedDescription');

				// Condition > window
				if (condition.window) {
					youOrAllOfYou(condition.window, (window: any) => {
						addOutputEntry(window);
						// Note: titleStringId doesn't have a fallback text, so treat it as special case
						addOutputEntry(window, 'titleStringId');

						// Condition > window > page
						if (window.page) {
							youOrAllOfYou(window.page, (page: any) => {
								// Condition > window > page > element
								if (page.element) {
									youOrAllOfYou(page.element, (element: any) => {
										if (element && element.attr && 'text' === element.attr['@_type']) {
											addOutputEntry(element);
										}
									});
								}
							});
						}
					});
				}
			});
		}
	}

	return output;
}

/**
 * Serializes output data array to .tsv friendly text
 * @param data The output data array
 * @param separator Separation string between first and second data column
 */
function createOutputText(data: any[], separator: string) {
	let texts = data.map((entry) => Object.keys(entry)[0] + separator + Object.values(entry)[0]);
	return texts.join('\n');
}
