// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { registerSnapshotCommands } from "./commands";

import { ExtensionContext, languages, window, workspace, Uri } from "vscode";
import { CONFIG_ID } from "./constants";
import FoldingDecorator from "./decorators/foldingDecorator";
import * as config from "./configuration";
import RegionRangesProvider from "./providers/regionRangesProvider";

import FoldedLinesManager from "./utils/classes/managers/foldedLinesManager";
import ManipulateFoldManager from "./utils/classes/managers/manipulateFoldManager";

import { ProvidersList } from "./types";
import BetterFoldingRangeProvider from "./providers/betterFoldingRangeProvider";
//import RegionCodeLensProvider from './providers/regionCodeLensProvider';

import ExtendedMap from './utils/classes/extendedMap';
import { openComplementaryRegion } from './actions/foldingAction';
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

export function activate(context: ExtensionContext) {

  registerContentProvider(context, snapshotProvider);
  createSnapshots();


  context.subscriptions.push(
    foldingDecorator,
    snapshotProvider,

    workspace.onDidOpenTextDocument(doc => {
      if (doc.uri.scheme !== "file") { return; }
      if (doc.isUntitled) { return; }
      if (doc.isClosed) { return; }

      snapshotProvider?.saveFromDocument(doc); // stores content in Map
    }),

    workspace.onDidCloseTextDocument(doc => {
      if (doc.uri.scheme !== "file") return;
      snapshotProvider?.deleteSnapshotFor(doc.uri);
    }),

    workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(CONFIG_ID)) {
        restart();
        updateAllDocuments();
        createSnapshots();
      }
    }),

    window.onDidChangeVisibleTextEditors(() => {
      updateAllDocuments();
      registerProviders(context);
    }),

    workspace.onDidChangeTextDocument((e) => {
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
      const lastFoldingAction = ManipulateFoldManager.getLastManipulatedFolding(e.textEditor);
      //console.log('last folding action');
      //console.log(lastFoldingAction);
      //console.log(ManipulateFoldManager.wasLastActionFolding(e.textEditor));
      
      if (ManipulateFoldManager.wasLastActionFolding(e.textEditor)) {
        const foldingRanges = await getRanges(e.textEditor.document, foldingProviders);
        await openComplementaryRegion(e.textEditor, foldingRanges, snapshotProvider);
      }
     
      FoldedLinesManager.updateFoldedLines(e.textEditor);
      await ManipulateFoldManager.updateFoldedLines(e.textEditor, foldingProviders);
      setTimeout(async () => {
        foldingDecorator.triggerUpdateDecorations();
      }, 50);
    }),
  );
  registerProviders(context);
  updateAllDocuments();
  registerSnapshotCommands(foldingProviders, snapshotProvider);
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


function registerContentProvider(context: ExtensionContext, provider: SnapshotProvider) {
  context.subscriptions.push(
    workspace.registerTextDocumentContentProvider(SNAPSHOT_SCHEME, snapshotProvider),
  );
}


// Courtesy of vscode-explicit-fold,
// apparently if you delay the folding provider, it can override the default language folding provider.
function registerFoldingProvider(context: ExtensionContext, selector: string, provider: BetterFoldingRangeProvider) {
  setTimeout(() => {
    context.subscriptions.push(languages.registerFoldingRangeProvider(selector, provider));
  }, 2000);
}

function updateAllDocuments() {
  for (const e of window.visibleTextEditors) {
    foldingProviders.forEach(([_, provider]) => provider.updateRanges(e.document));
  }
  setTimeout(async () => {
    for (const e of window.visibleTextEditors) {
      foldingProviders.forEach(([_, provider]) => provider.updateRanges(e.document));
    }
    FoldedLinesManager.updateAllFoldedLines();
    await ManipulateFoldManager.updateAllFoldedLines(foldingProviders);
    foldingDecorator.triggerUpdateDecorations();
  }, 500);
}

function createSnapshots() {
  for (const doc of workspace.textDocuments) {
    if (doc.uri.scheme !== "file") continue;
    if (doc.isUntitled) continue;

    snapshotProvider.saveFromDocument(doc);
  }

}

function restart() {
  foldingProviders.forEach(([_, provider]) => provider.restart());
  snapshotProvider.restart();


  foldingDecorator?.dispose();
  foldingDecorator = new FoldingDecorator(foldingProviders);
}

// This method is called when your extension is deactivated
export function deactivate() {
  snapshotProvider?.dispose();

  foldingDecorator.dispose();
}
