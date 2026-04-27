// src/commands.ts
import { Disposable, window, commands } from "vscode";
import { generateStructuredOutputResponse } from "./languageModel/languageModelTextDoc";
import { clearDocument, getRanges } from "./utils/functions/utils";
import { ProvidersList } from "./types";
import { closeEveryRegion, openEveryRegion, showAllCodeRegions, showAllNaturalLanguageRegions } from "./actions/globalFoldingAction";
import { SnapshotProvider } from "./providers/snapshotProvider";
import { actionMutex } from './utils/classes/managers/actionMutex';
import { CREATE_GEN_CODE_COMMAND, CREATE_GEN_NL_COMMAND, CREATE_GEN_REGIONS_COMMAND, CREATE_PROJECT_ALL_COMMAND, CREATE_PROJECT_CODE_COMMAND, CREATE_PROJECT_NL_COMMAND, CREATE_PROJECT_NONE_COMMAND } from "./constants";

export function registerSnapshotCommands(foldingProviders: ProvidersList, snapshotProvider: SnapshotProvider): Disposable[] {

  const writeNL = commands.registerCommand(CREATE_GEN_NL_COMMAND, async () => {
    await actionMutex.runExclusive('Generating Explanations', async () => {
      for (const editor of window.visibleTextEditors) {
        if (editor.document.uri.scheme !== 'file') {
          continue;
        }
        await generateStructuredOutputResponse(editor.document, 'genNL');
        snapshotProvider.saveFromDocument(editor.document);
        const ranges = await getRanges(editor.document, foldingProviders);
        showAllNaturalLanguageRegions(editor, ranges);
      }
    });
  });

  const writeCode = commands.registerCommand(CREATE_GEN_CODE_COMMAND, async () => {
    await actionMutex.runExclusive('Generating codes', async () => {
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

  const divideRegions = commands.registerCommand(CREATE_GEN_REGIONS_COMMAND, async () => {
    await actionMutex.runExclusive('Generating regions', async () => {
      for (const editor of window.visibleTextEditors) {
        if (editor.document.uri.scheme !== 'file') {
          continue;
        }
        const ranges = await getRanges(editor.document, foldingProviders);
        openEveryRegion(editor, ranges);
        await clearDocument(editor.document, ranges);
        snapshotProvider.saveFromDocument(editor.document);
        await generateStructuredOutputResponse(editor.document, 'genRegion');
      }
    });
  });

  const showNLRegions = commands.registerCommand(CREATE_PROJECT_NL_COMMAND, async () => {
    for (const editor of window.visibleTextEditors) {
      if (editor.document.uri.scheme !== 'file') {
        continue;
      }
      const ranges = await getRanges(editor.document, foldingProviders);
      showAllNaturalLanguageRegions(editor, ranges);
    }
  });

  const showCodeRegions = commands.registerCommand(CREATE_PROJECT_CODE_COMMAND, async () => {
    for (const editor of window.visibleTextEditors) {
      if (editor.document.uri.scheme !== 'file') {
        continue;
      }
      const ranges = await getRanges(editor.document, foldingProviders);
      showAllCodeRegions(editor, ranges);
    }
  });

  const showAllRegions = commands.registerCommand(CREATE_PROJECT_ALL_COMMAND, async () => {
    for (const editor of window.visibleTextEditors) {
      if (editor.document.uri.scheme !== 'file') {
        continue;
      }
      const ranges = await getRanges(editor.document, foldingProviders);
      openEveryRegion(editor, ranges);
    }
  });

  const hideAllRegions = commands.registerCommand(CREATE_PROJECT_NONE_COMMAND, async () => {
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

