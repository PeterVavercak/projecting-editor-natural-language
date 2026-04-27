import { TextDocument, TextEditor, TextEditorRevealType, commands } from "vscode";
import { findCouples, forEachForestLevel, pairByRelation } from "../utils/functions/utils";
import { markFoldEnd, markFoldStart } from "../utils/variables";
import { BetterFoldingRange, NaturalLanguageRegionCouple } from "../types";
import ManipulatedFoldManager from "../utils/classes/managers/foldManipulationManager";


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