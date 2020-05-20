import * as vscode from 'vscode';

import { createTutorialStringIds } from './tools/createTutorialStringIds';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('cnc-mission-stringids.createTutorialStringIds', () => {
			createTutorialStringIds();
		})
	);
}

// this method is called when your extension is deactivated
export function deactivate() {}
