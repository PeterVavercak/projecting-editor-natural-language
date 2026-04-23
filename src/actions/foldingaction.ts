import * as config from "../configuration";
import { TextDocument, TextEditor, TextEditorRevealType, commands } from "vscode";
import { generateLanguageResponse } from "../languageModel/languageModelSegments";
import ManipulatedFoldManager from "../utils/classes/managers/foldManipulationManager";
import { BetterFoldingRange, NaturalLanguageRegionCouple, LanguageTranslation, LastFoldedLine } from "../types";
import { forEachForestLevel, pairByRelation } from "../utils/classes/functions/utils";
import { SnapshotProvider } from "../providers/snapshotProvider";
import { markFoldStart, markFoldEnd } from "../utils/variables";
import { actionMutex } from '../utils/classes/managers/actionMutex';



export function showAllNaturalLanguageRegions(editor: TextEditor, ranges: BetterFoldingRange[]) {
    const couples = findCouples(ranges);
    const rootCouples = couples.filter(couple => couple.nesting === 0);
    const childrenMap = buildChildrenMap(couples);
    forEachForestLevel(
        rootCouples,
        childrenMap,
        async (couple) => {
            if (
                couple.naturalLanguageFolding !== undefined
            ) {
                markFoldStart();
                await commands.executeCommand('editor.unfold', { selectionLines: [couple.naturalLanguageFolding.start] });
                ManipulatedFoldManager.setFoldedLineStatus(editor, couple.naturalLanguageFolding.start, 'computer', 'unfolded');
                markFoldEnd();
            }
            if (
                couple.codeFolding !== undefined
            ) {
                markFoldStart();
                await commands.executeCommand('editor.fold', { selectionLines: [couple.codeFolding.start] });
                ManipulatedFoldManager.setFoldedLineStatus(editor, couple.codeFolding.start, 'computer', 'folded');
                markFoldEnd();
            }
        }
    );
}

export function showAllCodeRegions(editor: TextEditor, ranges: BetterFoldingRange[]) {
    const couples = findCouples(ranges);
    const rootCouples = couples.filter(couple => couple.nesting === 0);
    const childrenMap = buildChildrenMap(couples);
    forEachForestLevel(
        rootCouples,
        childrenMap,
        async (couple) => {
            if (
                couple.naturalLanguageFolding !== undefined
            ) {
                markFoldStart();
                await commands.executeCommand('editor.fold', { selectionLines: [couple.naturalLanguageFolding.start] });
                ManipulatedFoldManager.setFoldedLineStatus(editor, couple.naturalLanguageFolding.start, 'computer', 'folded');
                markFoldEnd();
            }
            if (
                couple.codeFolding !== undefined
            ) {
                markFoldStart();
                await commands.executeCommand('editor.unfold', { selectionLines: [couple.codeFolding.start] });
                ManipulatedFoldManager.setFoldedLineStatus(editor, couple.codeFolding.start, 'computer', 'unfolded');
                markFoldEnd();
            }
        }
    );
}

export function openEveryRegion(editor: TextEditor, ranges: BetterFoldingRange[]) {
    const couples = findCouples(ranges);
    const rootCouples = couples.filter(couple => couple.nesting === 0);
    const childrenMap = buildChildrenMap(couples);

    forEachForestLevel(
        rootCouples,
        childrenMap,
        async (couple) => {
            if (
                couple.naturalLanguageFolding !== undefined
            ) {
                markFoldStart();
                await commands.executeCommand('editor.unfold', { selectionLines: [couple.naturalLanguageFolding.start] });
                ManipulatedFoldManager.setFoldedLineStatus(editor, couple.naturalLanguageFolding.start, 'computer', 'unfolded');
                markFoldEnd();
            }
            if (
                couple.codeFolding !== undefined
            ) {
                markFoldStart();
                await commands.executeCommand('editor.unfold', { selectionLines: [couple.codeFolding.start] });
                ManipulatedFoldManager.setFoldedLineStatus(editor, couple.codeFolding.start, 'computer', 'unfolded');
                markFoldEnd();
            }
        }
    );
}

export function closeEveryRegion(editor: TextEditor, ranges: BetterFoldingRange[]) {
    const couples = findCouples(ranges);
    const rootCouples = couples.filter(couple => couple.nesting === 0);
    const childrenMap = buildChildrenMap(couples);

    forEachForestLevel(
        rootCouples,
        childrenMap,
        async (couple) => {
            if (
                couple.naturalLanguageFolding !== undefined
            ) {
                markFoldStart();
                await commands.executeCommand('editor.fold', { selectionLines: [couple.naturalLanguageFolding.start] });
                ManipulatedFoldManager.setFoldedLineStatus(editor, couple.naturalLanguageFolding.start, 'computer', 'folded');
                markFoldEnd();
            }
            if (
                couple.codeFolding !== undefined
            ) {
                markFoldStart();
                await commands.executeCommand('editor.fold', { selectionLines: [couple.codeFolding.start] });
                ManipulatedFoldManager.setFoldedLineStatus(editor, couple.codeFolding.start, 'computer', 'folded');
                markFoldEnd();
            }
        }
    );

}

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
        const start = performance.now();
        await actionMutex.runExclusive('Generating complementary region', async () => {
            await generateTranslationRegion(editor, foundTranslation, chosenRegion, lastFolding);
        });
        const end = performance.now();

        console.log('Time of execution: '+ (end - start) +' for language model:' + config.getConfiguredLanguageModel() );
    }
    contentProvider.saveFromDocument(editor.document);

    await foldUnfoldComplementaryRegion(editor, lastFolding, foundComplementaryRegion);

}

function buildChildrenMap(
    all: NaturalLanguageRegionCouple[]
): Map<NaturalLanguageRegionCouple, NaturalLanguageRegionCouple[]> {
    const map = new Map<
        NaturalLanguageRegionCouple,
        NaturalLanguageRegionCouple[]
    >();

    for (const parent of all) {
        map.set(parent, []);
    }

    for (const parent of all) {
        for (const child of all) {
            if (parent === child) continue;

            if (isChild(parent, child)) {
                map.get(parent)!.push(child);
            }
        }
    }

    return map;
}

function isChild(
    parent: NaturalLanguageRegionCouple,
    child: NaturalLanguageRegionCouple
): boolean {
    if (!parent.codeFolding || parent.nesting === undefined) return false;

    const parentStart = parent.codeFolding.start;
    const parentEnd = parent.codeFolding.end;

    const childStart =
        child.naturalLanguageFolding?.start ?? child.codeFolding?.start;
    const childEnd =
        child.codeFolding?.end ?? child.naturalLanguageFolding?.end;

    if (childStart === undefined || childEnd === undefined) return false;

    return (
        childStart > parentStart &&
        childEnd < parentEnd &&
        child.nesting === parent.nesting + 1
    );
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

function findCouples(foldingRanges: BetterFoldingRange[]): NaturalLanguageRegionCouple[] {
    const codeRanges = foldingRanges.filter(range => range.foldingType === 'Source Code');
    const naturalLanguageRanges = foldingRanges.filter(range => range.foldingType === 'Natural Language');
    const relations = pairByRelation(naturalLanguageRanges, codeRanges, (nlRange, codeRange) => nlRange.end + 1 === codeRange.start);
    const couples: NaturalLanguageRegionCouple[] = [];
    for (const relation of relations) {
        couples.push({
            naturalLanguageFolding: relation.a,
            codeFolding: relation.b,
            nesting: relation.b?.nestingLevel
        });
    }
    return couples;
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

