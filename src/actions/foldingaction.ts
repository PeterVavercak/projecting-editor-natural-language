import * as config from "../configuration";
import { TextDocument, TextEditor, commands } from "vscode";
import { generateLanguageResponse } from "../languageModel/languageModelSegments";
import RegionRangesProvider from "../providers/regionRangesProvider";
import ManipulatedFoldManager from "../utils/classes/managers/manipulateFoldManager";
import FoldedLinesManager from "../utils/classes/managers/foldedLinesManager";
import { BetterFoldingRange, NaturalLanguageRegionCouple, LanguageTranslation, LastFoldedLine } from "../types";
import { foldingRangeToRange, forEachForestLevel, pairByRelation } from "../utils/classes/functions/utils";
import { SnapshotProvider } from "../providers/SnapshotProvider";






export function showAllNaturalLanguageRegions(editor: TextEditor, ranges: BetterFoldingRange[]) {
    const couples = findCouples(ranges);
    const rootCouples = couples.filter(couple => couple.nesting === 0);
    const childrenMap = buildChildrenMap(couples);
    const transformToRange = foldingRangeToRange(editor.document);
    forEachForestLevel(
        rootCouples,
        childrenMap,
        (couple) => {
            if (
                couple.naturalLanguageFolding !== undefined
            ) {
                if (
                    FoldedLinesManager.isFolded(transformToRange(couple.naturalLanguageFolding), editor) === true
                ) {
                    commands.executeCommand('editor.unfold', { selectionLines: [couple.naturalLanguageFolding.start] });
                    ManipulatedFoldManager.setCommandInvoked(editor, true);
                }
                if (
                    couple.codeFolding !== undefined &&
                    FoldedLinesManager.isFolded(transformToRange(couple.codeFolding), editor) === false
                ) {
                    commands.executeCommand('editor.fold', { selectionLines: [couple.codeFolding.start] });
                    ManipulatedFoldManager.setCommandInvoked(editor, true);
                }
            }
            else if (
                couple.codeFolding !== undefined &&
                FoldedLinesManager.isFolded(transformToRange(couple.codeFolding), editor) === true
            ) {
                commands.executeCommand('editor.unfold', { selectionLines: [couple.codeFolding.start] });
                ManipulatedFoldManager.setCommandInvoked(editor, true);
            }
        },
        (couple) => couple.naturalLanguageFolding !== undefined && couple.codeFolding !== undefined
    );
}

export function showAllCodeRegions(editor: TextEditor, ranges: BetterFoldingRange[]) {
    const couples = findCouples(ranges);
    const rootCouples = couples.filter(couple => couple.nesting === 0);
    const childrenMap = buildChildrenMap(couples);
    const transformToRange = foldingRangeToRange(editor.document);
    forEachForestLevel(
        rootCouples,
        childrenMap,
        (couple) => {
            if (
                couple.naturalLanguageFolding !== undefined &&
                FoldedLinesManager.isFolded(transformToRange(couple.naturalLanguageFolding), editor) === false
            ) {
                commands.executeCommand('editor.fold', { selectionLines: [couple.naturalLanguageFolding.start] });
                ManipulatedFoldManager.setCommandInvoked(editor, true);
            }
            if (
                couple.codeFolding !== undefined &&
                FoldedLinesManager.isFolded(transformToRange(couple.codeFolding), editor) === true
            ) {
                commands.executeCommand('editor.unfold', { selectionLines: [couple.codeFolding.start] });
                ManipulatedFoldManager.setCommandInvoked(editor, true);

            }
        }
    );
}

export function openComplementaryRegion(editor: TextEditor, regionRangesProvider: RegionRangesProvider, contentProvider: SnapshotProvider) {

    const lastFolding = ManipulatedFoldManager.getLastManipulatedFolding(editor);
    if (lastFolding === undefined) {
        return;
    }
    //    console.log(lastFolding);
    const foldingRanges = regionRangesProvider.getRanges(editor.document);
    const foldMap = createFoldTranslationsMap(foldingRanges);
    const foundTranslation = foldMap.get(lastFolding.foldingLine);
    if (foundTranslation === undefined) {
        return;
    }
    const [foundComplementaryRegion, chosenRegion] = foundTranslation?.hasFolded === 'code' ? [
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
        generateTranslationRegion(editor.document, foundTranslation, chosenRegion, lastFolding);
    }
    contentProvider.saveFromDocument(editor.document);

    foldUnfoldComplementaryRegion(editor, lastFolding, foundComplementaryRegion);


    FoldedLinesManager.updateFoldedLines(editor);
    //   ManipulatedFoldManager.updateFoldedLines(editor, regionRangesProvider);
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

function generateTranslationRegion(document: TextDocument, translation: LanguageTranslation, chosenRegion: BetterFoldingRange, lastFolding: LastFoldedLine) {
    if (!config.getAutomaticTranslation()) {
        return;
    }
    const closingCodeRegion = chosenRegion.foldingType === 'code' && lastFolding.lastFoldingAction === 'wasFolded';
    const closingLanguageRegion = chosenRegion.foldingType === 'natural language' && lastFolding.lastFoldingAction === 'wasFolded';
    const openingCodeRegion = chosenRegion.foldingType === 'code' && lastFolding.lastFoldingAction === 'wasUnfolded';
    const openingLanguageRegion = chosenRegion.foldingType === 'natural language' && lastFolding.lastFoldingAction === 'wasUnfolded';

    if (closingCodeRegion || openingLanguageRegion) {
        if (translation.naturalLanguageFolding === undefined) {
            // generate new natural language
            console.log('generating natural language');
            generateLanguageResponse(document, translation, 'genNL');
        } else {
            // update natural language
            console.log('updating natural language');
            generateLanguageResponse(document, translation, 'updateNL');
        }
    } else if (openingCodeRegion || closingLanguageRegion) {
        if (translation.codeFolding === undefined) {
            // Generate Code
            console.log('generating code');
            generateLanguageResponse(document, translation, 'genCode');
        } else {
            // Update Code
            console.log('updating code');
            generateLanguageResponse(document, translation, 'updateCode');
        }
    }

}

function foldUnfoldComplementaryRegion(editor: TextEditor, lastFolding: LastFoldedLine, complementaryRegion: BetterFoldingRange | undefined) {
    if (!config.getAutomaticFolding()) {
        return;
    }
    if (complementaryRegion === undefined) {
        return;
    }
    const transformToRange = foldingRangeToRange(editor.document);
    if (lastFolding.lastFoldingAction === 'wasFolded' && FoldedLinesManager.isFolded(transformToRange(complementaryRegion), editor) === true) {
        console.log('complementary region unfolds');
        commands.executeCommand('editor.unfold', { selectionLines: [complementaryRegion?.start] });
        ManipulatedFoldManager.setCommandInvoked(editor, true);
    } else if (lastFolding.lastFoldingAction === 'wasUnfolded' && FoldedLinesManager.isFolded(transformToRange(complementaryRegion), editor) === false) {
        console.log('complementary region folds');
        commands.executeCommand('editor.fold', { selectionLines: [complementaryRegion?.start] });
        ManipulatedFoldManager.setCommandInvoked(editor, true);
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
    const codeRanges = foldingRanges.filter(range => range.foldingType === 'code');
    const naturalLanguageRanges = foldingRanges.filter(range => range.foldingType === 'natural language');
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
                hasFolded: 'natural language',
                naturalLanguageFolding: relation.naturalLanguageFolding,
                codeFolding: relation.codeFolding
            }
            );
        }
        if (relation.codeFolding !== undefined) {
            foldMap.set(
                relation.codeFolding.start, {
                hasFolded: 'code',
                naturalLanguageFolding: relation.naturalLanguageFolding,
                codeFolding: relation.codeFolding
            }
            );
        }
    }
    return foldMap;
}
