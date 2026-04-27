import * as config from "../configuration";
import { TextDocument, TextEditor, TextEditorRevealType, commands } from "vscode";
import { generateLanguageResponse } from "../languageModel/languageModelSegments";
import ManipulatedFoldManager from "../utils/classes/managers/foldManipulationManager";
import { BetterFoldingRange, NaturalLanguageRegionCouple, LanguageTranslation, LastFoldedLine } from "../types";
import { findCouples, forEachForestLevel, pairByRelation } from "../utils/functions/utils";
import { SnapshotProvider } from "../providers/snapshotProvider";
import { markFoldStart, markFoldEnd } from "../utils/variables";
import { actionMutex } from '../utils/classes/managers/actionMutex';
import * as fs from "fs";
import * as path from "path";



export async function openComplementaryRegion(editor: TextEditor, foldingRanges: BetterFoldingRange[], contentProvider: SnapshotProvider) {

    const lastFolding = ManipulatedFoldManager.getLastManipulatedFolding(editor);
    if (lastFolding === undefined || lastFolding.wasFoldedBy === 'computer') {
        return;
    }

    const foldMap = createFoldTranslationsMap(foldingRanges);
    const foundTranslation = foldMap.get(lastFolding.foldingLine);
    if (foundTranslation === undefined) {
        return;
    }
    const [foundComplementaryRegion, chosenRegion] = foundTranslation?.hasFolded === 'Source Code' ? [
        foundTranslation.naturalLanguageFolding,
        foundTranslation.codeFolding
    ] : [
        foundTranslation?.codeFolding,
        foundTranslation?.naturalLanguageFolding
    ];
    if (chosenRegion === undefined) {
        return;
    }
    if (wasTranslationUpdated(contentProvider, editor.document, foundTranslation)) {
        await actionMutex.runExclusive('Generating complementary region', async () => {
            const start = performance.now();
            await generateTranslationRegion(editor, foundTranslation, chosenRegion, lastFolding);
            const end = performance.now();
            const languageModel = config.getConfiguredLanguageModel();
            const text = 'Time of execution: ' + (end - start) + ' for language model: ' + languageModel + '\n\n';
            const filePath = path.join(__dirname, '../../../tests/'+ languageModel + '.txt');

            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.appendFileSync(filePath, text, "utf-8");

        });


    }
    contentProvider.saveFromDocument(editor.document);

    await foldUnfoldComplementaryRegion(editor, lastFolding, foundComplementaryRegion);

}



async function generateTranslationRegion(editor: TextEditor, translation: LanguageTranslation, chosenRegion: BetterFoldingRange, lastFolding: LastFoldedLine) {

    if (!config.getAutomaticTranslation()) {
        return;
    }
    const closingCodeRegion = chosenRegion.foldingType === 'Source Code' && lastFolding.lastFoldingAction === 'wasFolded';
    const closingLanguageRegion = chosenRegion.foldingType === 'Natural Language' && lastFolding.lastFoldingAction === 'wasFolded';
    const openingCodeRegion = chosenRegion.foldingType === 'Source Code' && lastFolding.lastFoldingAction === 'wasUnfolded';
    const openingLanguageRegion = chosenRegion.foldingType === 'Natural Language' && lastFolding.lastFoldingAction === 'wasUnfolded';
    if (closingCodeRegion || openingLanguageRegion) {
        if (translation.naturalLanguageFolding === undefined) {
            await generateLanguageResponse(editor.document, translation, 'genNL');
        } else {
            await generateLanguageResponse(editor.document, translation, 'updateNL');
        }
    } else if (openingCodeRegion || closingLanguageRegion) {
        if (translation.codeFolding === undefined) {
            await generateLanguageResponse(editor.document, translation, 'genCode');
        } else {
            await generateLanguageResponse(editor.document, translation, 'updateCode');
        }
    }

}

async function foldUnfoldComplementaryRegion(editor: TextEditor, lastFolding: LastFoldedLine, complementaryRegion: BetterFoldingRange | undefined) {
    if (!config.getAutomaticFolding() || complementaryRegion === undefined) {
        return;
    }

    if (lastFolding.lastFoldingAction === 'wasFolded') {
        markFoldStart();
        const visibleRange = editor.visibleRanges[0];

        await commands.executeCommand('editor.unfold', { selectionLines: [complementaryRegion.start] });
        ManipulatedFoldManager.setFoldedLineStatus(editor, complementaryRegion.start, 'computer', 'unfolded');
        markFoldEnd();
        editor.revealRange(visibleRange, TextEditorRevealType.AtTop);

    } else {
        markFoldStart();
        const visibleRange = editor.visibleRanges[0];

        await commands.executeCommand('editor.fold', { selectionLines: [complementaryRegion.start] });
        ManipulatedFoldManager.setFoldedLineStatus(editor, complementaryRegion.start, 'computer', 'folded');
        markFoldEnd();
        editor.revealRange(visibleRange, TextEditorRevealType.AtTop);

    }
}

function wasTranslationUpdated(provider: SnapshotProvider, document: TextDocument, translation: LanguageTranslation): boolean {
    if (translation.codeFolding === undefined || translation.naturalLanguageFolding === undefined) {
        return true;
    }
    const snapshotContent = provider.getSnapshotContentFor(document.uri);
    const documentContent = document.getText();

    if (snapshotContent === undefined) {
        return true;
    }

    const snapshotLines = snapshotContent.split(/\r?\n/);
    const documentLines = documentContent.split(/\r?\n/);
    const snapshotTranslation = snapshotLines.slice(translation.naturalLanguageFolding.start, translation.codeFolding.end + 1);
    const documentTranslation = documentLines.slice(translation.naturalLanguageFolding.start, translation.codeFolding.end + 1);
    if (JSON.stringify(snapshotTranslation) === JSON.stringify(documentTranslation)) {
        return false;
    }
    return true;
}



function createFoldTranslationsMap(foldingRanges: BetterFoldingRange[]): Map<number, LanguageTranslation> {
    const couples = findCouples(foldingRanges);

    const foldMap: Map<number, LanguageTranslation> = new Map();
    for (const relation of couples) {
        if (relation.naturalLanguageFolding !== undefined) {
            foldMap.set(
                relation.naturalLanguageFolding.start, {
                hasFolded: 'Natural Language',
                naturalLanguageFolding: relation.naturalLanguageFolding,
                codeFolding: relation.codeFolding
            }
            );
        }
        if (relation.codeFolding !== undefined) {
            foldMap.set(
                relation.codeFolding.start, {
                hasFolded: 'Source Code',
                naturalLanguageFolding: relation.naturalLanguageFolding,
                codeFolding: relation.codeFolding
            }
            );
        }
    }
    return foldMap;
}
function runCommandWithInfo(arg0: string, arg1: () => Promise<void>) {
    throw new Error("Function not implemented.");
}

