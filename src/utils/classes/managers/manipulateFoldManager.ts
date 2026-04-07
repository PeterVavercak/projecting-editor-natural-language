import { TextEditor, Uri, Range, window } from "vscode";
import RegionRangesProvider from "../../../providers/regionRangesProvider";
import ExtendedMap from "../extendedMap";
import { BetterFoldingRange, LastFoldedLine, ProvidersList } from "../../../types";
import FoldedLinesManager from "./foldedLinesManager";
import { foldingRangeToRange, getRanges, mapsEqual, objectEqual } from "../functions/utils";


class ManipulateFoldManager {
  //Singleton
  private static _instance: ManipulateFoldManager;
  public static get instance(): ManipulateFoldManager {
    this._instance = this._instance ? this._instance : new ManipulateFoldManager();
    return this._instance;
  }

  private cachedFoldedLines: ExtendedMap<Uri, Map<number, boolean | undefined>> = new ExtendedMap(
    () => new Map()
  );
  private cachedLastManipulatedFolding: ExtendedMap<Uri, LastFoldedLine | undefined> = new ExtendedMap(
    () => undefined
  );
  private cachedDifferentLastFolding: ExtendedMap<Uri, boolean> = new ExtendedMap(
    () => false
  );
  private cachedWasFoldCommandInvoked: ExtendedMap<Uri, boolean> = new ExtendedMap(
    () => false
  );

  public async updateAllFoldedLines(providers: ProvidersList) {
    // console.log('update all folded lines');
    //  FoldedLinesManager.updateAllFoldedLines();
    for (const editor of window.visibleTextEditors) {
      await this.updateFoldedLines(editor, providers);
    }
  }

  public async updateFoldedLines(editor: TextEditor, providers: ProvidersList) {
    
    console.log('update folded lines');
    console.log(editor.document.uri);
  // const regionRanges = provider.getRanges(editor.document);
    const regionRanges = await getRanges(editor.document, providers);

    const ranges: Range[] = regionRanges.map(foldingRangeToRange(editor.document));
    const currentFolds = new Map(ranges.map(range => [range.start.line, FoldedLinesManager.isFolded(range, editor)]));
    console.log('current folds: ');
    this.printMap(currentFolds);

    this.setCachedFoldedLines(editor, currentFolds);
  }


  public async updateFoldedLinesAndLastManipulatedLine(editor: TextEditor, providers: ProvidersList) {
   // console.log('update folding after folding');
    const regionRanges = await getRanges(editor.document, providers);

    const ranges: Range[] = regionRanges.map(foldingRangeToRange(editor.document));
    const currentFolds = new Map(ranges.map(range => [range.start.line, FoldedLinesManager.isFolded(range, editor)]));
    const cachedFolds = this.getCachedFoldedLines(editor);
   //  console.log('current folds: ');
   //  this.printMap(currentFolds);
   //  console.log('cached folds: ');
   //  this.printMap(cachedFolds);

    this.updateLastManipulatedFolding(editor, cachedFolds, currentFolds);
    console.log(this.wasLastActionFolding(editor));

    this.setCachedFoldedLines(editor, currentFolds);
  }

  public getLastManipulatedFolding(editor: TextEditor): LastFoldedLine | undefined {
    return this.cachedLastManipulatedFolding.get(editor.document.uri);
  }

  public wasLastActionFolding(editor: TextEditor): boolean {
    return this.cachedDifferentLastFolding.get(editor.document.uri);
  }

  public setCommandInvoked(editor: TextEditor, wasInvoked: boolean) {
    // console.log('set command invoked: ' + wasInvoked);
    this.cachedWasFoldCommandInvoked.set(editor.document.uri, wasInvoked);
  }
  public getCommandInvoked(editor: TextEditor): boolean {
    return this.cachedWasFoldCommandInvoked.get(editor.document.uri) ?? false;
  }

  private updateLastManipulatedFolding(editor: TextEditor, cachedFolds: Map<number, boolean | undefined>, currentFolds: Map<number, boolean | undefined>) {
  
    const filteredCachedFolds = new Map([...cachedFolds].filter(([_, value]) => value !== undefined));
    const filteredCurrentFolds = new Map([...currentFolds].filter(([_, value]) => value !== undefined));
    const equalizedCachedFolds = new Map([...filteredCachedFolds].filter(([key, _]) => filteredCurrentFolds.has(key)));
    const equalizedCurrentFolds = new Map([...filteredCurrentFolds].filter(([key, _]) => filteredCachedFolds.has(key)));

    for (const [key, value] of equalizedCurrentFolds) {
      if (equalizedCachedFolds.get(key) !== equalizedCurrentFolds.get(key)) {
        const manipulatedFoldingToSet: LastFoldedLine = {
          lastFoldingAction: (value === true) ? 'wasFolded' : 'wasUnfolded',
          foldingLine: key
        };
        this.cachedDifferentLastFolding.set(editor.document.uri, true);
        this.cachedLastManipulatedFolding.set(editor.document.uri, manipulatedFoldingToSet);
        return;
      }
    }
    this.cachedDifferentLastFolding.set(editor.document.uri, false);
  }

  private setCachedFoldedLines(editor: TextEditor, foldedLines: Map<number, boolean | undefined>) {
    this.cachedFoldedLines.set(editor.document.uri, foldedLines);
  }

  private getCachedFoldedLines(editor: TextEditor): Map<number, boolean | undefined> {
    return this.cachedFoldedLines.get(editor.document.uri);
  }

  private printMap(map: Map<number, boolean | undefined>) {
    for (const [key, value] of map) {
      console.log(`${key}: ${value}`);
    }
  }

}

export default ManipulateFoldManager.instance;