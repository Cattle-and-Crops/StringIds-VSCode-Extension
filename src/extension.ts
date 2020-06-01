import * as vscode from 'vscode';

import { createStringIds } from './tools/createStringIds';
import { deleteStringIds } from './tools/deleteStringIds';
import { getStringContents } from './tools/getStringContents';
import { pasteStringsFromSheet } from './tools/pasteStringsFromSheet';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('cnc-mission-stringids.createStringIds', () => {
			createStringIds();
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
	context.subscriptions.push(
		vscode.commands.registerCommand('cnc-mission-stringids.pasteStringsFromSheet', () => {
			pasteStringsFromSheet();
		})
	);
}

// this method is called when your extension is deactivated
export function deactivate() {}
