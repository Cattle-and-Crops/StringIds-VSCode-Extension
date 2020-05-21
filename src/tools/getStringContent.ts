import { env, Range, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { getFilenameFromPath } from '../helpers/helpers';
import * as path from 'path';

let parser = require('fast-xml-parser');

/**
 * Gathers all stringId entries and corresponding texts and renders them in a new
 * empty file in column format. Can then be pasted in the CNC translations table.
 */
export async function getStringContents() {
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
	let tabSeparator = '\t';
	switch (language) {
		case 'German':
			tabSeparator = '\t';
			break;
		case 'English':
			tabSeparator = '\t\t';
			break;
		case 'Custom':
			tabSeparator = '\t\t\t';
			break;
		default:
			tabSeparator = '\t';
	}

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
	const outputText = createOutputText(outputData, tabSeparator);

	// Paste in new document
	pasteTextInNewDocument(outputText);

	// Copy to clipboard
	writeTextToClipboard(outputText, 'StringIds and texts copied to clipboard');
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
	 * Checks if the object exists, has all necessary attributes and adds the stringId and text to the output array
	 * @param object The XML element's parsed object
	 * @param hasDescriptionAttr Optionally defines if the `description` attribute should be used instead of the inner text
	 */
	const addOutputEntry = (object: any, hasDescriptionAttr?: boolean) => {
		if (object && object.attr) {
			const stringId = object.attr['@_stringId'];
			const text = hasDescriptionAttr ? object.attr['@_description'] : object['#text'];
			if (stringId && text) {
				return output.push({ [stringId]: text }) > 0;
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
			if (Array.isArray(m.description)) {
				for (const description of m.description) {
					addOutputEntry(description);
				}
			} else {
				addOutputEntry(m.description);
			}
		}

		// Conditions
		if (m.stop && m.stop.conditions && m.stop.conditions.condition) {
			for (const condition of m.stop.conditions.condition) {
				// Condition
				addOutputEntry(condition, true);

				// Condition window
				if (condition.window) {
					if (Array.isArray(condition.window)) {
						for (const window of condition.window) {
							addOutputEntry(window);
						}
					} else {
						addOutputEntry(condition.window);
					}
				}
			}
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
	let texts = [];
	for (let entry of data) {
		let line = Object.keys(entry)[0] + separator + Object.values(entry)[0];
		texts.push(line);
	}
	let text = texts.join('\n');
	return text;
}

/**
 * Creates a new, empty, unsaved document and pastes the provided text
 * @param text The content to be pasted
 * @source [StackOverflow](https://stackoverflow.com/questions/41068197/vscode-create-unsaved-file-and-add-content)
 */
function pasteTextInNewDocument(text: string) {
	const newFile = Uri.parse('untitled:' + path.join('stringIds.tsv'));
	workspace.openTextDocument(newFile).then(async (document) => {
		const edit = new WorkspaceEdit();
		// edit.insert(newFile, new Position(0, 0), text);
		edit.replace(newFile, new Range(0, 0, 999999, 999999), text);

		const success = await workspace.applyEdit(edit);
		if (success) {
			window.showTextDocument(document);
		} else {
			window.showErrorMessage("Document couldn't be created correctly");
		}
	});
}

/**
 * Writes the provided text to the user's clipboard
 * @param text The text to be written to the clipboard
 * @param message The success message to be shown
 */
function writeTextToClipboard(text: string, message?: string) {
	env.clipboard.writeText(text).then(() => {
		if (message && message.length > 0) {
			window.showInformationMessage(message);
		}
	});
}
