// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
//import { generateCode, generateNaturalLanguage, updateCode } from './naturallanguage';
import { SnapshotProvider, SNAPSHOT_SCHEME } from "./ContentProvider";
import { registerSnapshotCommands } from "./comands";

let provider: SnapshotProvider | undefined;

export function activate(context: vscode.ExtensionContext) {

  //.subscriptions.push(generateNaturalLanguage);
  //context.subscriptions.push(updateCode);
  //context.subscriptions.push(generateCode);
  provider = new SnapshotProvider();


 
  context.subscriptions.push(
    provider,
    vscode.workspace.registerTextDocumentContentProvider(SNAPSHOT_SCHEME, provider),
    ...registerSnapshotCommands(provider)
  );

  for (const doc of vscode.workspace.textDocuments) {
    if (doc.uri.scheme !== "file") continue;
    if (doc.isUntitled) continue;

    provider.saveFromDocument(doc);
  }

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(doc => {
      console.log('did open');
      console.log(doc);
      if (doc.uri.scheme !== "file") {return;}
      if (doc.isUntitled) {return;}
      if (doc.isClosed) {return;}

      provider?.saveFromDocument(doc); // stores content in Map
    })
  );

  // Delete snapshot data when the real file is fully closed
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument(doc => {
      if (doc.uri.scheme !== "file") return;

      provider?.deleteSnapshotFor(doc.uri); 
    })
  );


}



// This method is called when your extension is deactivated
export function deactivate() {
  provider?.dispose();
  provider = undefined;
}
