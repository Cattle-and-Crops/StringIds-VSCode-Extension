import * as vscode from 'vscode';

import { createTutorialStringIds } from './tools/createTutorialStringIds';
import { getStringContents } from './tools/getStringContent';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('cnc-mission-stringids.createTutorialStringIds', () => {
			createTutorialStringIds();
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('cnc-mission-stringids.getStringContents', () => {
			getStringContents();
		})
	);
}

// this method is called when your extension is deactivated
export function deactivate() {}
