import { window, Range } from 'vscode';

/**
 * Replaces backslashes in any attribute content that are immediately followed by characters, but are not part of whitespace characters ([\r\n\t\f\v ]) or an escaped backslash.
 * @test https://regex101.com/r/YBriWh/3
 */
export async function cleanBackslashes() {
	const editor = window.activeTextEditor;
	if (!editor) {
		return;
	}

	const document = editor.document;
	if (document.languageId !== 'xml') {
		window.showErrorMessage("This isn't an XML file");
		return;
	}

	const selection = editor.selection;
	let text = document.getText(selection);
	// let regex = /\w+=(\"|\')([^"]+[\\][^nrt\s].*?)\1/gm;
	let cleanedText = text.replace(/\\/gm, '/');

	editor.edit((editBuilder) => {
		editBuilder.replace(selection, cleanedText);
	});
	window.showInformationMessage('Backslashes transformed');
}
