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
	text = text.replace(/stringId=".*?"/gim, 'stringId=""');

	// Apply changes to document
	editor.edit((editBuilder) => {
		editBuilder.replace(new Range(0, 0, document.lineCount, 5000), text);
	});
	window.showInformationMessage('StringIds removed');
}
