// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { foldDisposable } from './naturallanguage'; 
import { PythonProjectingEditorProvider } from './PyProjectingEditor';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "code-tutor" is now active!');
  context.subscriptions.push(foldDisposable);
  context.subscriptions.push(PythonProjectingEditorProvider.register(context));
  
}



// This method is called when your extension is deactivated
export function deactivate() {}
