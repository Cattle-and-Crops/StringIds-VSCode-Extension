import { window, Range } from 'vscode';

/**
 * Deletes are `stringId` attribute values
 */
export async function deleteStringIds() {
	const editor = window.activeTextEditor;
	if (!editor) {
		return;
	}

	const document = editor.document;
	if ('file' !== document.uri.scheme) {
		return;
	}

	let text = document.getText();
	text = text.replace(/expandedstringid=("|').*?(?<!\\)\1/gim, 'expandedStringId=""');
	text = text.replace(/titlestringid=("|').*?(?<!\\)\1/gim, 'titleStringId=""');
	text = text.replace(/(\s)stringid=("|').*?(?<!\\)\2/gim, '$1stringId=""');
	// Unsafer alternative: https://regex101.com/r/YShhwg/1

	// Apply changes to document
	editor.edit((editBuilder) => {
		editBuilder.replace(new Range(0, 0, document.lineCount, 5000), text);
	});
	window.showInformationMessage('StringIds removed');
}
