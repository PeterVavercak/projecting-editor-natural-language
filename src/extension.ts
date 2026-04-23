import * as vscode from 'vscode';
import { registerSnapshotCommands } from "./commands";

import { ExtensionContext, languages, window, workspace, Uri, commands } from "vscode";
import { CONFIG_ID, CREATE_RESET_PROJECT } from "./constants";
import FoldingDecorator from "./decorators/foldingDecorator";
import RegionRangesProvider from "./providers/regionRangesProvider";

import FoldedLinesManager from "./utils/classes/managers/foldedLinesManager";
import FoldManipulation from "./utils/classes/managers/foldManipulationManager";

import { ProvidersList } from "./types";
import BetterFoldingRangeProvider from "./providers/betterFoldingRangeProvider";

import ExtendedMap from './utils/classes/extendedMap';
import { openComplementaryRegion } from './actions/foldingAction';
import { getRanges } from './utils/classes/functions/utils';
import { SNAPSHOT_SCHEME, SnapshotProvider } from './providers/snapshotProvider';
import NLRangesProvider from './providers/nlRangesProvider';
import { ToolsProvider } from "./providers/toolsProvider";


const foldingProviders: ProvidersList = [
  ["*", new RegionRangesProvider()],
  ["*", new NLRangesProvider()]
];
let toolsProvider = new ToolsProvider();
let foldingDecorator = new FoldingDecorator(foldingProviders);

const registeredLanguages = new Set<string>();

const recentlyEditedDocs: ExtendedMap<Uri, number> = new ExtendedMap(() => -1);


const snapshotProvider = new SnapshotProvider();

export function activate(context: ExtensionContext) {

  const copilotExt = vscode.extensions.getExtension('GitHub.copilot-chat');

  if (!copilotExt) {
    vscode.window.showWarningMessage(
      'This extension requires GitHub Copilot to function properly. Some features will be disabled.'
    );
    return;
  }

  if (!copilotExt.isActive) {
    copilotExt.activate();
  }


  const treeView = window.createTreeView('projectingEditorView', {
    treeDataProvider: toolsProvider,
    showCollapseAll: true
  });
  context.subscriptions.push(treeView);

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
        await FoldManipulation.updateAllFoldedLines(foldingProviders);
      }, 50);
    }),

    window.onDidChangeTextEditorVisibleRanges(async (e) => {
      const lastEdit = recentlyEditedDocs.get(e.textEditor.document.uri) ?? 0;
      if (Date.now() - lastEdit < 50) {
        return;
      }
      FoldedLinesManager.updateFoldedLines(e.textEditor);
      await FoldManipulation.updateFoldedLinesAndLastManipulatedLine(e.textEditor, foldingProviders);

      if (FoldManipulation.wasLastActionFolding(e.textEditor)) {
        const foldingRanges = await getRanges(e.textEditor.document, foldingProviders);
        await openComplementaryRegion(e.textEditor, foldingRanges, snapshotProvider);
      }

      FoldedLinesManager.updateFoldedLines(e.textEditor);
      await FoldManipulation.updateFoldedLines(e.textEditor, foldingProviders);
      setTimeout(async () => {
        foldingDecorator.triggerUpdateDecorations();
      }, 50);
    }),

    commands.registerCommand(CREATE_RESET_PROJECT, async () => {
      restart();
      updateAllDocuments();
    })

  );
  registerProviders(context);
  updateAllDocuments();


  registerSnapshotCommands(foldingProviders, snapshotProvider);
}

function registerProviders(context: ExtensionContext) {


  for (const editor of window.visibleTextEditors) {
    const languageId = editor.document.languageId;

    if (!registeredLanguages.has(languageId)) {
      registeredLanguages.add(languageId);

      for (const [selector, provider] of foldingProviders) {
        if (selector === languageId || selector === "*") {
          registerFoldingProvider(context, languageId, provider);
        };
      }
    }
  }
}

/**
 * Original Code Provided  Mohammad Baqer
 * Source: https://github.com/mtbaqer/vscode-better-folding
 * Licensed under the MIT License
 * License: https://marketplace.visualstudio.com/items/MohammadBaqer.better-folding/license
 * 
 * Changes:
 * changed according programs needs
 */


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
    await FoldManipulation.updateAllFoldedLines(foldingProviders);
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
