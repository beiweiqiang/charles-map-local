import * as vscode from 'vscode';
import { NodeDependenciesProvider } from './nodeDependencies';
import { FileExplorer } from './fileExplorer';

export function activate(context: vscode.ExtensionContext) {
	// const nodeDependenciesProvider = new NodeDependenciesProvider(vscode.workspace.rootPath);

	// vscode.window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);

	// vscode.commands.registerCommand('nodeDependencies.refreshEntry', () =>
	// 	nodeDependenciesProvider.refresh()
	// );

	new FileExplorer(context);
}

export function deactivate() {}
