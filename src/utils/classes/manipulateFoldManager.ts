import { TextEditor, Uri, Range, window } from "vscode";
import RegionRangesProvider from "../../providers/regionRangesProvider";
import ExtendedMap from "./extendedMap";
import { BetterFoldingRange, LastFoldedLine } from "../../types";
import FoldedLinesManager from "./foldedLinesManager";
import { foldingRangeToRange, mapsEqual, objectEqual } from "./functions/utils";


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

  public updateAllFoldedLines(provider: RegionRangesProvider) {
   // console.log('update all folded lines');
  //  FoldedLinesManager.updateAllFoldedLines();
    for (const editor of window.visibleTextEditors) {
      this.updateFoldedLines(editor, provider);
    }
  }

  public updateFoldedLines(editor: TextEditor, provider: RegionRangesProvider) {
   // console.log('update folded lines');
    const regionRanges = provider.getRanges(editor.document);
    const ranges: Range[] = regionRanges.map(foldingRangeToRange(editor.document));
    const currentFolds = new Map(ranges.map(range => [range.start.line, FoldedLinesManager.isFolded(range, editor)]));
   // console.log('current folds: ');
   // this.printMap(currentFolds);

    this.setCachedFoldedLines(editor, currentFolds);
  }


  public updateFoldedLinesAndLastManipulatedLine(editor: TextEditor, provider: RegionRangesProvider) {
    const regionRanges = provider.getRanges(editor.document);

    const ranges: Range[] = regionRanges.map(foldingRangeToRange(editor.document));
    const currentFolds = new Map(ranges.map(range => [range.start.line, FoldedLinesManager.isFolded(range, editor)]));
    const cachedFolds = this.getCachedFoldedLines(editor);
   // console.log('current folds: ');
   // this.printMap(currentFolds);
  // console.log('cached folds: ');
   // this.printMap(cachedFolds);

    this.updateLastManipulatedFolding(editor, cachedFolds, currentFolds);

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
    /*
    if (mapsEqual(cachedFolds, currentFolds) || cachedFolds.size !== currentFolds.size) {
      this.cachedDifferentLastFolding.set(editor.document.uri, false);
      return;
    }
    */
    const filteredCachedFolds = new Map([...cachedFolds].filter(([_, value]) => value !== undefined));
    const filteredCurrentFolds = new Map([...currentFolds].filter(([_, value]) => value !== undefined));
    const equalizedCachedFolds = new Map([...filteredCachedFolds].filter(([key, _]) => filteredCurrentFolds.has(key)));
    const equalizedCurrentFolds = new Map([...filteredCurrentFolds].filter(([key, _]) => filteredCachedFolds.has(key)));
    // console.log(JSON.stringify(Object.fromEntries(filteredCachedFolds)));
    // console.log(JSON.stringify(Object.fromEntries(filteredCurrentFolds)));
    // console.log(JSON.stringify(Object.fromEntries(equalizedCachedFolds)));
    // console.log(JSON.stringify(Object.fromEntries(equalizedCurrentFolds)));

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

  private printMap(map: Map<number, boolean|undefined>){
    for (const [key, value] of map) {
      console.log(`${key}: ${value}`);
    }
  }



}

export default ManipulateFoldManager.instance;