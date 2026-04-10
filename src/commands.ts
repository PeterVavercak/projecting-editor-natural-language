// src/commands.ts
import { Disposable, window, commands, ProgressLocation } from "vscode";
import { generateStructuredOutputResponse } from "./languageModel/languageModelTextDoc";
import { clearDocument, getRanges } from "./utils/classes/functions/utils";
import { ProvidersList } from "./types";
import { closeEveryRegion, openEveryRegion, showAllCodeRegions, showAllNaturalLanguageRegions } from "./actions/foldingAction";
import { SnapshotProvider } from "./providers/snapshotProvider";
import { actionMutex } from './utils/classes/managers/actionMutex';

export function registerSnapshotCommands(foldingProviders: ProvidersList, snapshotProvider: SnapshotProvider): Disposable[] {

  const writeNL = commands.registerCommand("ProjectingNLEditor.writeNL", async () => {
    await actionMutex.runExclusive('Generating Explanations', async (progress) => {
      for (const editor of window.visibleTextEditors) {
        if (editor.document.uri.scheme !== 'file') {
          continue;
        }
        console.log(editor.document.uri);
        await generateStructuredOutputResponse(editor.document, 'genNL');
        console.log('explanations generated');
        snapshotProvider.saveFromDocument(editor.document);
        const ranges = await getRanges(editor.document, foldingProviders);
        showAllNaturalLanguageRegions(editor, ranges);
      }
    });
  });

  const writeCode = commands.registerCommand("ProjectingNLEditor.writeCode", async () => {
    await actionMutex.runExclusive('Generating codes', async (progress) => {
      for (const editor of window.visibleTextEditors) {
        if (editor.document.uri.scheme !== 'file') {
          continue;
        }
        await generateStructuredOutputResponse(editor.document, 'genCode');
        snapshotProvider.saveFromDocument(editor.document);
        const ranges = await getRanges(editor.document, foldingProviders);
        showAllCodeRegions(editor, ranges);
      }
    });
  });

  const divideRegions = commands.registerCommand("ProjectingNLEditor.generateRegions", async () => {
    await actionMutex.runExclusive('Generating regions', async (progress) => {
      for (const editor of window.visibleTextEditors) {
        if (editor.document.uri.scheme !== 'file') {
          continue;
        }
        console.log('generating regions');
        const ranges = await getRanges(editor.document, foldingProviders);
        snapshotProvider.saveFromDocument(editor.document);
        openEveryRegion(editor, ranges);
        await clearDocument(editor.document, ranges);
        setTimeout(async () => {
          snapshotProvider.saveFromDocument(editor.document);
          await generateStructuredOutputResponse(editor.document, 'genRegion');
        }, 50);
      }
    });
  });

  const showNLRegions = commands.registerCommand('ProjectingNLEditor.showNLRegions', async () => {
    for (const editor of window.visibleTextEditors) {
      if (editor.document.uri.scheme !== 'file') {
        continue;
      }
      const ranges = await getRanges(editor.document, foldingProviders);
      showAllNaturalLanguageRegions(editor, ranges);
    }
  });

  const showCodeRegions = commands.registerCommand('ProjectingNLEditor.showCodeRegions', async () => {
    for (const editor of window.visibleTextEditors) {
      if (editor.document.uri.scheme !== 'file') {
        continue;
      }
      const ranges = await getRanges(editor.document, foldingProviders);
      showAllCodeRegions(editor, ranges);
    }
  });

  const showAllRegions = commands.registerCommand("ProjectingNLEditor.showEveryRegion", async () => {
    for (const editor of window.visibleTextEditors) {
      if (editor.document.uri.scheme !== 'file') {
        continue;
      }
      const ranges = await getRanges(editor.document, foldingProviders);
      openEveryRegion(editor, ranges);
    }
  });

  const hideAllRegions = commands.registerCommand("ProjectingNLEditor.closeEveryRegion", async () => {
    for (const editor of window.visibleTextEditors) {
      if (editor.document.uri.scheme !== 'file') {
        continue;
      }
      const ranges = await getRanges(editor.document, foldingProviders);
      closeEveryRegion(editor, ranges);
    }
  });



  return [writeNL, writeCode, divideRegions, showNLRegions, showCodeRegions, showAllRegions, hideAllRegions];
}

