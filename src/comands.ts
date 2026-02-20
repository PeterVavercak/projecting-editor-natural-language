// src/commands.ts
import * as vscode from "vscode";
import { SnapshotProvider } from "./ContentProvider";
import { getDocumentLines, parseText, writeNaturalLanguage } from "./Parser";
import { updateDoc, writeAllNL } from "./naturallanguage";
import { write } from "fs";

/** Register commands and return disposables to push into subscriptions. */
export function registerSnapshotCommands(provider: SnapshotProvider): vscode.Disposable[] {
  const createOrUpdate = vscode.commands.registerCommand('nlDisplay.createOrUpdate', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      void vscode.window.showInformationMessage("No active editor.");
      return;
    }

    provider.saveFromDocument(editor.document);
    void vscode.window.showInformationMessage("Snapshot saved/updated.");
  });

  const getContent = vscode.commands.registerCommand('nlDisplay.readContent', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const doc = editor.document;
    const snapshotContent = provider.getSnapshotContentFor(doc.uri);
    const documentContent = doc.getText();

    //  console.log("Doc URI:", doc.uri.toString());
    //  console.log("Has snapshot:", provider.hasSnapshotFor(doc.uri));
    //  console.log("Content Text:", snapshotContent?.getText());
    //  console.log('snapshot content');
    //  console.log(snapshotContent?.getText());
    //  console.log('document content');
    //  console.log(documentContent.getText());


    if (snapshotContent !== undefined && documentContent !== undefined) {
      const snapshotStructure = parseText(snapshotContent);
      const docStructure = parseText(documentContent);
      console.log('snapshot structure');
      console.log(snapshotStructure);
      console.log('document structure');
      console.log(docStructure);

      await updateDoc(docStructure, snapshotStructure);


      writeNaturalLanguage(doc, docStructure);

    }


  });

  const writeNL = vscode.commands.registerCommand('nlDisplay.writeNL', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const doc = editor.document;
    const documentLines = getDocumentLines(doc);
//    console.log(documentLines);
    writeAllNL(documentLines, doc);
/*
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
                doc.uri,
                new vscode.Range(0, 0, 0, 0),
                documentLines
    );
    vscode.workspace.applyEdit(edit);
*/

  });

   const writeCode = vscode.commands.registerCommand('nlDisplay.writeCode', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const doc = editor.document;
    const documentLines = getDocumentLines(doc);
    

   



  });

  return [createOrUpdate, getContent, writeNL];
}
