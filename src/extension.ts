// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
//import { generateCode, generateNaturalLanguage, updateCode } from './naturallanguage';
import { SnapshotProvider, SNAPSHOT_SCHEME } from "./ContentProvider";
import { registerSnapshotCommands } from "./comands";

import { commands, ExtensionContext, languages, window, workspace, Uri } from "vscode";
import { CLEAR_ZEN_FOLDS_COMMAND, CONFIG_ID, CREATE_ZEN_FOLDS_COMMAND } from "./constants";
import FoldingDecorator from "./decorators/foldingDecorator";
import * as config from "./configuration";
import RegionRangesProvider from "./providers/regionRangesProvider";
import FoldedLinesManager from "./utils/classes/foldedLinesManager";
import ManipulateFoldManager from "./utils/classes/manipulateFoldManager";

import { ProvidersList, VisibleState } from "./types";
import BetterFoldingRangeProvider from "./providers/betterFoldingRangeProvider";
//import RegionCodeLensProvider from './providers/regionCodeLensProvider';

import { openComplementaryRegion } from './utils/classes/foldingManager';
import ExtendedMap from './extendedMap';

//const bracketRangesProvider = new BracketRangesProvider();
const regionRangesProvider = new RegionRangesProvider();

const foldingProviders: ProvidersList = [
  ["*", regionRangesProvider],
];



//const codeLensProvider = new RegionCodeLensProvider();




let foldingDecorator = new FoldingDecorator(foldingProviders);

const registeredLanguages = new Set<string>();

const recentlyEditedDocs: ExtendedMap<Uri, number> = new ExtendedMap(() => -1);


const snapshotProvider = new SnapshotProvider();

export function activate(context: vscode.ExtensionContext) {

  type FoldAction = 'fold' | 'unfold';

  let pendingAction: { token: symbol; type: FoldAction } | undefined;

  async function runFoldCommand(type: FoldAction) {
    const token = Symbol(type);
    pendingAction = { token, type };

    await vscode.commands.executeCommand(
      type === 'fold' ? 'editor.fold' : 'editor.unfold'
    );

    queueMicrotask(() => {
      if (pendingAction?.token === token) {
        pendingAction = undefined;
      }
    });
  }

  //  console.log('is working');
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
       // console.log('content change is 0');
        return;
      }
      recentlyEditedDocs.set(e.document.uri, Date.now());
      setTimeout(async () => {
        FoldedLinesManager.updateAllFoldedLines();
        ManipulateFoldManager.updateAllFoldedLines(regionRangesProvider);
      }, 100);

    }),

    window.onDidChangeTextEditorVisibleRanges(async (e) => {

      const lastEdit = recentlyEditedDocs.get(e.textEditor.document.uri) ?? 0;

      if (Date.now() - lastEdit < 50) {
       // console.log('last action was edit');
        return;
      }


      FoldedLinesManager.updateFoldedLines(e.textEditor);
      ManipulateFoldManager.updateFoldedLinesAndLastManipulatedLine(e.textEditor, regionRangesProvider);

      if (!ManipulateFoldManager.wasLastActionFolding(e.textEditor)) {
      //  console.log('last action was not folding');
        return;
      } else {
       // console.log('last action was folding');
      }

      if (ManipulateFoldManager.getCommandInvoked(e.textEditor)) {
      //  console.log('last folding was automatic');
        ManipulateFoldManager.setCommandInvoked(e.textEditor, false);
        return;
      }


      openComplementaryRegion(e.textEditor, regionRangesProvider, snapshotProvider);
      //  zenFoldingDecorator.triggerUpdateDecorations(e.textEditor);
      //  foldingDecorator.triggerUpdateDecorations(e.textEditor);
      /*
            setTimeout(async () => {
              zenFoldingDecorator.triggerUpdateDecorations(e.textEditor);
              foldingDecorator.triggerUpdateDecorations(e.textEditor);
            }, 100);
            */
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
  //registerCodeLensProvider(context, "*", codeLensProvider);
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
    ManipulateFoldManager.updateAllFoldedLines(regionRangesProvider);
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
