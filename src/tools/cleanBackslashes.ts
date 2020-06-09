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

	let text = document.getText();
	// let regex = /\w+=(\"|\')([^"]+[\\][^nrt\s].*?)\1/gm;
	let regex = /\\([^nrt\s\\])/gm; // --> /$1
	let cleanedText = text.replace(regex, '/$1');

	editor.edit((editBuilder) => {
		editBuilder.replace(new Range(0, 0, document.lineCount, 5000), cleanedText);
	});
	window.showInformationMessage('Backslashes transformed');
}
