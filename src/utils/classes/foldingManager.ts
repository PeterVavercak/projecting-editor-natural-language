import { TextEditor, commands } from "vscode";
import { BetterFoldingRange, FoundLanguageTranslation } from "../../types";
import FoldedLinesManager from "./foldedLinesManager";
import ManipulatedFoldManager from "./manipulateFoldManager";

import { foldingRangeToRange, pairByRelation } from "./functions/utils";
import { generateLanguageResponse } from "../../NaturalLanguageSegments";
import RegionRangesProvider from "../../providers/regionRangesProvider";
/*
class FoldingManager {
    //Singleton
    private static _instance: FoldingManager;
    public static get instance(): FoldingManager {
        this._instance = this._instance ? this._instance : new FoldingManager();
        return this._instance;
    }
    
    */

export function openComplementaryRegion(editor: TextEditor, regionRangesProvider: RegionRangesProvider) {

    const lastFolding = ManipulatedFoldManager.getLastManipulatedFolding(editor);
    if (lastFolding === undefined) {
        return;
    }
//    console.log(lastFolding);
    const foldingRanges = regionRangesProvider.getRanges(editor.document);
    const foldMap = createFoldTranslationsMap(foldingRanges);
    const lastFoldingAction = lastFolding.lastFoldingAction;
    const foundTranslation = foldMap.get(lastFolding.foldingLine);
    const [foundComplementaryRegion, chosenRegion] = foundTranslation?.hasFolded === 'code' ? [
        foundTranslation.naturalLanguageFolding,
        foundTranslation.codeFolding
    ] : [
        foundTranslation?.codeFolding,
        foundTranslation?.naturalLanguageFolding
    ];
    const closingCodeRegion = chosenRegion?.foldingType === 'code' && lastFoldingAction === 'wasFolded';
    const closingLanguageRegion = chosenRegion?.foldingType === 'natural language' && lastFoldingAction === 'wasFolded';
    const openingCodeRegion = chosenRegion?.foldingType === 'code' && lastFoldingAction === 'wasUnfolded';
    const openingLanguageRegion = chosenRegion?.foldingType === 'natural language' && lastFoldingAction === 'wasUnfolded';

    if (openingLanguageRegion) {               
        // update natural language
        console.log('updating natural language');
        generateLanguageResponse(editor.document, chosenRegion, foundComplementaryRegion, 'updateNL');
    } else if (closingCodeRegion){
        if (foundComplementaryRegion === undefined) {
            // generate new natural language
            console.log('generating natural language');
            generateLanguageResponse(editor.document, foundComplementaryRegion, chosenRegion, 'genNL');
        } else {
            // update natural language
            console.log('updating natural language');
            generateLanguageResponse(editor.document, foundComplementaryRegion, chosenRegion, 'updateNL');
        }
    } else if ( openingCodeRegion) {
        // Update Code
        console.log('updating code');
        generateLanguageResponse(editor.document, foundComplementaryRegion, chosenRegion, 'updateCode');
    } else if (closingLanguageRegion){
        if (foundComplementaryRegion === undefined) {
            // Generate Code
            console.log('generating code');
            generateLanguageResponse(editor.document, chosenRegion, foundComplementaryRegion, 'genCode');
        } else {
            // Update Code
            console.log('updating code');
            generateLanguageResponse(editor.document, chosenRegion, foundComplementaryRegion, 'updateCode');
        }
    }
    
    const transformToRange = foldingRangeToRange(editor.document);
    if (lastFoldingAction === 'wasFolded' && foundComplementaryRegion !== undefined && FoldedLinesManager.isFolded(transformToRange(foundComplementaryRegion),editor) === true) {
        console.log('complementary region unfolds');
        commands.executeCommand('editor.unfold', { selectionLines: [foundComplementaryRegion?.start] });
        ManipulatedFoldManager.setCommandInvoked(editor, true);
    } else if (lastFoldingAction === 'wasUnfolded' && foundComplementaryRegion !== undefined && FoldedLinesManager.isFolded(transformToRange(foundComplementaryRegion),editor) === false) {
        console.log('complementary region folds');
        commands.executeCommand('editor.fold', { selectionLines: [foundComplementaryRegion?.start] });
        ManipulatedFoldManager.setCommandInvoked(editor, true);
    }
        
    
    FoldedLinesManager.updateFoldedLines(editor);
 //   ManipulatedFoldManager.updateFoldedLines(editor, regionRangesProvider);
}

function createFoldTranslationsMap(foldingRanges: BetterFoldingRange[]): Map<number, FoundLanguageTranslation> {
    const codeRanges = foldingRanges.filter(range => range.foldingType === 'code');
    const naturalLanguageRanges = foldingRanges.filter(range => range.foldingType === 'natural language');
    const relations = pairByRelation(naturalLanguageRanges, codeRanges, (nlRange, codeRange) => nlRange.end + 1 === codeRange.start);

    const foldMap: Map<number, FoundLanguageTranslation> = new Map();
    for (const relation of relations) {
        if (relation.a !== undefined) {
            foldMap.set(
                relation.a.start, {
                hasFolded: 'code',
                codeFolding: relation.a,
                naturalLanguageFolding: relation.b
            }
            );
        }
        if (relation.b !== undefined) {
            foldMap.set(
                relation.b.start, {
                hasFolded: 'natural language',
                codeFolding: relation.a,
                naturalLanguageFolding: relation.b
            }
            );
        }
    }
    return foldMap;
}


/*
}

export default FoldingManager.instance;
*/