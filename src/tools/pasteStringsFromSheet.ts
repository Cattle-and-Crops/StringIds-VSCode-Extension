import { env, window, Range } from 'vscode';
import { customUnescape, pasteTextInNewDocument } from '../helpers/helpers';

/**
 * Pastes Strings from the CNC Translation Table (.tsv format) into a
 * mission .xml and matches them to the existing stringId attributes.
 */
export async function pasteStringsFromSheet() {
	const editor = window.activeTextEditor;
	if (!editor) {
		window.showErrorMessage("activeTextEditor couldn't be found");
		return null;
	}

	const document = editor.document;
	if (document.languageId !== 'xml') {
		window.showErrorMessage("This isn't an XML file");
		return null;
	}

	/*
	1. Get clipboard content
	2. Parse and create dictionary with stringIds as keys
	3. Go through XML line by line
		1. check for stringId attribute
		2. check for match against dictionary
		3. depending on type, unescape string
		4. depending on type, paste string
	*/

	// Get and parse data
	let data = await parseClipboardContent();
	if (!data) {
		window.showInformationMessage('No clipboard data found');
		return null;
	}

	let xmlText = document.getText();

	// Check for missing entries
	reportMissingEntries(data, xmlText);

	// Match to xml
	let newContent = createNewXmlContent(data, xmlText);
	if (newContent && newContent.length > 0) {
		newContent.push('');
		const newText = newContent.join('\n');

		// Apply changes to document
		editor.edit((editBuilder) => {
			editBuilder.replace(new Range(0, 0, document.lineCount, 5000), newText);
		});
		window.showInformationMessage('Strings replaced');
	}
}

/**
 * Returns the user's clipboard content as a string
 */
async function getClipboardContent() {
	// Async promise
	// env.clipboard.readText().then((text)=>{
	/* code */
	// });

	// Sync
	let clipboard = await env.clipboard.readText();
	if (clipboard) {
		return clipboard;
	}

	return null;
}

/**
 * Gets the user's clipboard content, parses it as .tsv, and returns a
 * key-value object of stringIds and strings.
 *
 * @returns	The parsed data as a key-value object
 */
async function parseClipboardContent() {
	const content = await getClipboardContent();

	if (!content || content.length === 0) {
		return null;
	}

	// Data columns
	const col = {
		stringId: 0,
		german: 1,
		english: 2,
	};
	// Find forward slash after first word
	if (content.search(/^\w+?\//) > -1) {
		col.stringId = 1;
		col.german = 2;
		col.english = 3;
	}

	// Parse
	let data: { [key: string]: string } = {};

	for (const line of content.split('\r\n')) {
		if (line && line.length > 0) {
			let cols = line.split('\t');
			if (cols.length > 1) {
				// TODO: user pick data[2] (German) versus data[3] (English)
				if (cols[col.english]) {
					data[cols[col.stringId]] = cols[col.english];
				} else {
					data[cols[col.stringId]] = cols[col.german];
				}
			}
		}
	}

	return data;
}

/**
 * Goes through the provided `text` line by line, matches a found
 * stringId to the `data` object's content and replaces the existing
 * text with the clipboard one.
 *
 * @param data The parsed clipboard stringId-string object
 * @param text The current xml file's text
 */
function createNewXmlContent(data: any, text: string) {
	// Go through text
	const splitText = text.trim().split('\n');
	const ret = [];
	let deleteLine = false;
	let currentOpenElement = null;

	for (let line of splitText) {
		let match = line.match(/((?: |title|expanded)stringId)=(\"|\')(.*?)(\2)/i);
		if (match) {
			let stringId = match[3];
			if (stringId && data[stringId]) {
				// New element found, stop deleting lines
				deleteLine = false;
				currentOpenElement = null;

				if (match[1] === 'titleStringId') {
					continue;
				}

				let text = data[stringId];
				let unescapedText = customUnescape(text);

				// description attribute
				let descriptionRegex;
				let description;
				if (match[1] === 'expandedStringId') {
					description = 'expandedDescription';
					descriptionRegex = /expandedDescription=(\"|\')(.*?)(\1)/;
				} else {
					description = ' description';
					descriptionRegex = / description=(\"|\')(.*?)(\1)/;
				}
				let descriptionMatch = line.match(descriptionRegex);
				if (descriptionMatch) {
					let quote = text.search('"') > -1 ? "'" : '"';
					line = line.replace(descriptionRegex, `${description}=${quote}${unescapedText}${quote}`);
					ret.push(line);
					continue;
				}

				// has text value
				if (line.search('>') > -1) {
					let tag = line.match(/<(\w+)/);
					if (tag && tag[1]) {
						let closingTag = `</${tag[1]}>`;
						if (line.search(closingTag) > -1) {
							// closing in same line
							line = line.replace(/>(.*?)$/gm, `>${unescapedText}${closingTag}`);
							ret.push(line);
						} else {
							// multi-line
							line = line.replace(/>(.*?)$/gm, `>`);
							ret.push(line);
							ret.push(unescapedText);
							currentOpenElement = tag[1];
							deleteLine = true;
						}
						continue;
					}
				}
			}
		}

		if (deleteLine) {
			// Currently open element: closing tag found
			if (line.search(`</${currentOpenElement}>`) > -1) {
				ret.push(line);
				deleteLine = false;
				currentOpenElement = null;
			}

			continue;
		}

		ret.push(line);
	}

	return ret;
}

/**
 * Checks and reports if there are stringIds in either the clipboard or
 * the xml file that are not in the other
 *
 * @param data The parsed clipboard stringId-string object
 * @param text The current xml file's text
 */
function reportMissingEntries(data: any, xml: string) {
	const missingInClipboard: string[] = [];
	const missingInXML: string[] = [];

	// Search Clipboard entries in XML
	for (const key of Object.keys(data)) {
		if (xml.search(key) === -1) {
			missingInXML.push(key);
		}
	}

	//Search XML entries in Clipboard
	let xmlStringIds = xml.match(/stringId=(\"|\')(.*?)\1/gim);
	if (xmlStringIds) {
		for (const entry of xmlStringIds) {
			let match = entry.match(/stringId=(\"|\')(.*)\1/i);
			if (match && Array.isArray(match)) {
				let stringId = match[2];
				if (stringId && stringId.length > 0 && !data[stringId]) {
					missingInClipboard.push(stringId);
				}
			}
		}
	}

	// console.log('missingInClipboard');
	// console.table(missingInClipboard);
	// console.log('missingInXML');
	// console.table(missingInXML);

	if (missingInClipboard.length === 0 && missingInXML.length === 0) {
		return;
	}

	// Warning message
	let message = 'There are stringIds missing in';
	if (missingInClipboard.length > 0 && missingInXML.length > 0) {
		message += ' both the clipboard and the xml file';
	} else if (missingInClipboard.length > 0) {
		message += ' the clipboard';
	} else {
		message += ' the xml file';
	}
	window.showWarningMessage(message);

	// Create markdown
	let clipboardMaxLength = Math.max(...['Clipboard', ...missingInClipboard].map((item) => item.length));
	let xmlMaxLength = Math.max(...['XML', ...missingInXML].map((item) => item.length));

	const output = ['# Missing StringIds', ''];

	output.push(
		`| ${'Clipboard'.padEnd(clipboardMaxLength, ' ')} | ${'XML'.padEnd(xmlMaxLength, ' ')} |`,
		`| ${'-'.padEnd(clipboardMaxLength, '-')} | ${'-'.padEnd(xmlMaxLength, '-')} |`
	);
	for (const entry of missingInClipboard) {
		output.push(`| ${entry.padEnd(clipboardMaxLength, ' ')} | ${' '.padEnd(xmlMaxLength, ' ')} |`);
	}
	for (const entry of missingInXML) {
		output.push(`| ${' '.padEnd(clipboardMaxLength, ' ')} | ${entry.padEnd(xmlMaxLength, ' ')} |`);
	}

	output.push('');
	let text = output.join('\n');

	pasteTextInNewDocument(text, 'missing-entries.md');
}
