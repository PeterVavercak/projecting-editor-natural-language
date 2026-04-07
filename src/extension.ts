// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
//import { generateCode, generateNaturalLanguage, updateCode } from './naturallanguage';
import { registerSnapshotCommands } from "./comands";

import { commands, ExtensionContext, languages, window, workspace, Uri } from "vscode";
import { CLEAR_ZEN_FOLDS_COMMAND, CONFIG_ID, CREATE_ZEN_FOLDS_COMMAND } from "./constants";
import FoldingDecorator from "./decorators/foldingDecorator";
import * as config from "./configuration";
import RegionRangesProvider from "./providers/regionRangesProvider";

import FoldedLinesManager from "./utils/classes/managers/foldedLinesManager";
import ManipulateFoldManager from "./utils/classes/managers/manipulateFoldManager";

import { ProvidersList, VisibleState } from "./types";
import BetterFoldingRangeProvider from "./providers/betterFoldingRangeProvider";
//import RegionCodeLensProvider from './providers/regionCodeLensProvider';

import ExtendedMap from './utils/classes/extendedMap';
import { openComplementaryRegion } from './actions/foldingaction';
import { getRanges } from './utils/classes/functions/utils';
import { SNAPSHOT_SCHEME, SnapshotProvider } from './providers/snapshotProvider';
import NLRangesProvider from './providers/nlRangesProvider';

//const bracketRangesProvider = new BracketRangesProvider();

const foldingProviders: ProvidersList = [
  ["*", new RegionRangesProvider()],
  ["*", new NLRangesProvider()]
];

let foldingDecorator = new FoldingDecorator(foldingProviders);

const registeredLanguages = new Set<string>();

const recentlyEditedDocs: ExtendedMap<Uri, number> = new ExtendedMap(() => -1);


const snapshotProvider = new SnapshotProvider();

export function activate(context: vscode.ExtensionContext) {

  context.subscriptions.push(
    snapshotProvider,
    vscode.workspace.registerTextDocumentContentProvider(SNAPSHOT_SCHEME, snapshotProvider),
    ...registerSnapshotCommands(snapshotProvider, foldingProviders)
  );

  for (const doc of vscode.workspace.textDocuments) {
    if (doc.uri.scheme !== "file") continue;
    if (doc.isUntitled) continue;

    snapshotProvider.saveFromDocument(doc);
  }

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(doc => {
      //console.log('did open');
      //console.log(doc);
      if (doc.uri.scheme !== "file") { return; }
      if (doc.isUntitled) { return; }
      if (doc.isClosed) { return; }

      snapshotProvider?.saveFromDocument(doc); // stores content in Map
    })
  );

  // Delete snapshot data when the real file is fully closed
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument(doc => {
      if (doc.uri.scheme !== "file") return;

      snapshotProvider?.deleteSnapshotFor(doc.uri);
    })
  );

  context.subscriptions.push(
    foldingDecorator,

    workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(CONFIG_ID)) {
        restart();
        updateAllDocuments();
      }
    }),

    window.onDidChangeVisibleTextEditors(() => {
      updateAllDocuments();
      registerProviders(context);
    }),

    workspace.onDidChangeTextDocument((e) => {
      //console.log('did change');

      // zenFoldingDecorator.onChange(e);
      foldingProviders.forEach(([_, provider]) => provider.updateRanges(e.document));
      if (e.contentChanges.length === 0) {
        return;
      }
      recentlyEditedDocs.set(e.document.uri, Date.now());
      setTimeout(async () => {
        FoldedLinesManager.updateAllFoldedLines();
        await ManipulateFoldManager.updateAllFoldedLines(foldingProviders);
      }, 100);

    }),

    window.onDidChangeTextEditorVisibleRanges(async (e) => {
      const lastEdit = recentlyEditedDocs.get(e.textEditor.document.uri) ?? 0;
      if (Date.now() - lastEdit < 50) {
        return;
      }
      FoldedLinesManager.updateFoldedLines(e.textEditor);
      await ManipulateFoldManager.updateFoldedLinesAndLastManipulatedLine(e.textEditor, foldingProviders);
      if (!ManipulateFoldManager.wasLastActionFolding(e.textEditor)) {
        return;
      }
      if (ManipulateFoldManager.getCommandInvoked(e.textEditor)) {
        ManipulateFoldManager.setCommandInvoked(e.textEditor, false);
        return;
      }
      const foldingRanges = await getRanges(e.textEditor.document, foldingProviders);
      await openComplementaryRegion(e.textEditor, foldingRanges, snapshotProvider);
    }),
  );
  registerProviders(context);
  updateAllDocuments();


}


function registerProviders(context: ExtensionContext) {

  const excludedLanguages = config.excludedLanguages();

  for (const editor of window.visibleTextEditors) {
    const languageId = editor.document.languageId;

    if (!registeredLanguages.has(languageId) && !excludedLanguages.includes(languageId)) {
      registeredLanguages.add(languageId);

      for (const [selector, provider] of foldingProviders) {
        if (selector === languageId || selector === "*") {
          registerFoldingProvider(context, languageId, provider);
        };
      }
    }
  }
}





// Courtesy of vscode-explicit-fold,
// apparently if you delay the folding provider, it can override the default language folding provider.
function registerFoldingProvider(context: ExtensionContext, selector: string, provider: BetterFoldingRangeProvider) {
  setTimeout(() => {
    context.subscriptions.push(languages.registerFoldingRangeProvider(selector, provider));
  }, 2000);
}

function updateAllDocuments() {
  // bracketRangesProvider.updateAllDocuments();
  for (const e of window.visibleTextEditors) {
    foldingProviders.forEach(([_, provider]) => provider.updateRanges(e.document));
  }
  //Delayed since vscode does not provide the right visible ranges right away when opening a new document.
  setTimeout(async () => {
    for (const e of window.visibleTextEditors) {
      foldingProviders.forEach(([_, provider]) => provider.updateRanges(e.document));
      //codeLensProvider.updateRanges(e, foldingDecorator);
    }
    FoldedLinesManager.updateAllFoldedLines();
    await ManipulateFoldManager.updateAllFoldedLines(foldingProviders);
    //zenFoldingDecorator.triggerUpdateDecorations();
    //foldingDecorator.triggerUpdateDecorations();
  }, 500);
}

function restart() {
  foldingProviders.forEach(([_, provider]) => provider.restart());

  foldingDecorator?.dispose();
  foldingDecorator = new FoldingDecorator(foldingProviders);
}

// This method is called when your extension is deactivated
export function deactivate() {
  snapshotProvider?.dispose();
  foldingDecorator.dispose();
  //  zenFoldingDecorator.dispose();
}
