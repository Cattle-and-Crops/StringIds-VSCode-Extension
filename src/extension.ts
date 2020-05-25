import * as vscode from 'vscode';

import { createTutorialStringIds } from './tools/createTutorialStringIds';
import { getStringContents } from './tools/getStringContent';
import { deleteStringIds } from './tools/deleteStringIds';

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
	context.subscriptions.push(
		vscode.commands.registerCommand('cnc-mission-stringids.deleteStringIds', () => {
			deleteStringIds();
		})
	);
}

// this method is called when your extension is deactivated
export function deactivate() {}
