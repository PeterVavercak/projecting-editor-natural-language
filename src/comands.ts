// src/commands.ts
import * as vscode from "vscode";
import { workspace, window } from "vscode";
import { SnapshotProvider } from "./ContentProvider";
import { generateStructuredOutputResponse } from "./NaturalLanguageTextDoc";
import { clearDocument, getDocumentLines, getRanges } from "./utils/classes/functions/utils";
import { ProvidersList } from "./types";
import { showAllCodeRegions, showAllNaturalLanguageRegions } from "./utils/classes/foldingManager";


/** Register commands and return disposables to push into subscriptions. */
export function registerSnapshotCommands(provider: SnapshotProvider, foldingProviders: ProvidersList): vscode.Disposable[] {
  const createOrUpdate = vscode.commands.registerCommand('nlDisplay.createOrUpdate', async () => {
    for (const editor of window.visibleTextEditors) {
      provider.saveFromDocument(editor.document);
      // void vscode.window.showInformationMessage("Snapshot saved/updated.");
    }
  });

  const getContent = vscode.commands.registerCommand('nlDisplay.readContent', async () => {
    for (const editor of window.visibleTextEditors) {
      const doc = editor.document;
      const snapshotContent = provider.getSnapshotContentFor(doc.uri);
      const documentContent = doc.getText();

      console.log("Doc URI:", doc.uri.toString());
      console.log("Has snapshot:", provider.hasSnapshotFor(doc.uri));
      console.log('snapshot content');
      console.log(snapshotContent);
      console.log('document content');
      console.log(documentContent);
    }
  });

  const writeNL = vscode.commands.registerCommand('ProjectingNLEditor.writeNL', async () => {
    for (const editor of window.visibleTextEditors) {
      await generateStructuredOutputResponse(editor.document, 'genNL');
    }
  });
  const writeCode = vscode.commands.registerCommand('ProjectingNLEditor.writeCode', async () => {
    for (const editor of window.visibleTextEditors) {
      await generateStructuredOutputResponse(editor.document, 'genCode');
    }
  });


  const divideRegions = vscode.commands.registerCommand('ProjectingNLEditor.generateRegions', async () => {
    for (const editor of window.visibleTextEditors) {
      const ranges = await getRanges(editor.document, foldingProviders);
      const regionRanges = (await ranges).filter(range => range.foldingType !== undefined);
      await clearDocument(editor.document, regionRanges);
      setTimeout(async () => {
        await generateStructuredOutputResponse(editor.document, 'genRegion');
      }, 100);
    }
  });

  const showNLRegions = vscode.commands.registerCommand('ProjectingNLEditor.showNLRegions', async () => {
    console.log('show NL regions');
    for (const editor of window.visibleTextEditors) {
      const ranges = await getRanges(editor.document, foldingProviders);
      const regionRanges = (await ranges).filter(range => range.foldingType !== undefined);
      showAllNaturalLanguageRegions(editor, regionRanges);

    }
  });

  const showCodeRegions = vscode.commands.registerCommand('ProjectingNLEditor.showCodeRegions', async () => {
    console.log('show code regions');
    for (const editor of window.visibleTextEditors) {
      const ranges = await getRanges(editor.document, foldingProviders);
      const regionRanges = (await ranges).filter(range => range.foldingType !== undefined);
      showAllCodeRegions(editor, regionRanges);
    }
  });



  const testCommand = vscode.commands.registerCommand('test.testCommand', async () => {
    const edit = new vscode.WorkspaceEdit();
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const documentLines = getDocumentLines(editor.document);
    console.log(documentLines);
    edit.insert(
      editor.document.uri,
      new vscode.Position(0, 0),
      documentLines
    );
    vscode.workspace.applyEdit(edit);
    // const editor = vscode.window.activeTextEditor;
    // if (!editor) return;
    // const doc = editor.document;

    // console.log(JSON.stringify(doc.getText()));



  });
  const helloWorld = vscode.commands.registerCommand('hello-world.helloWorld', () => {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    console.log(editor.document.languageId);
   // console.log(JSON.stringify(editor.document.getText()));

  });



  return [createOrUpdate, getContent, writeNL, writeCode, testCommand, helloWorld, divideRegions];
}
