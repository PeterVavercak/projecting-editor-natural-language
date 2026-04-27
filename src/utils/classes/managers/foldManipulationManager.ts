import { TextEditor, Uri, Range, window } from "vscode";
import ExtendedMap from "../extendedMap";
import { FoldingRangeAction, LastFoldedLine, ProvidersList } from "../../../types";
import FoldedLinesManager from "./foldedLinesManager";
import { foldingRangeToRange, getRanges } from "../../functions/utils";
import { isProgrammaticFold } from "../../variables";


class FoldManipulation {
  //Singleton
  private static _instance: FoldManipulation;
  public static get instance(): FoldManipulation {
    this._instance = this._instance ? this._instance : new FoldManipulation();
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
  private cachedFoldingStatus: ExtendedMap<Uri, Map<number, FoldingRangeAction>> = new ExtendedMap(
    () => new Map<number, FoldingRangeAction>()
  );

  public async updateAllFoldedLines(providers: ProvidersList) {
    for (const editor of window.visibleTextEditors) {
      await this.updateFoldedLines(editor, providers);
    }
  }

  public async updateFoldedLines(editor: TextEditor, providers: ProvidersList) {
    const regionRanges = await getRanges(editor.document, providers);
    const ranges: Range[] = regionRanges.map(foldingRangeToRange(editor.document));
    const currentFolds = new Map(ranges.map(range => [range.start.line, FoldedLinesManager.isFolded(range, editor)]));
    this.setCachedFoldedLines(editor, currentFolds);
  }


  public async updateFoldedLinesAndLastManipulatedLine(editor: TextEditor, providers: ProvidersList) {
    const regionRanges = await getRanges(editor.document, providers);

    const ranges: Range[] = regionRanges.map(foldingRangeToRange(editor.document));
    const currentFolds = new Map(ranges.map(range => [range.start.line, FoldedLinesManager.isFolded(range, editor)]));
    const cachedFolds = this.getCachedFoldedLines(editor);

    this.updateLastManipulatedFolding(editor, cachedFolds, currentFolds);

    this.setCachedFoldedLines(editor, currentFolds);
  }

  public getLastManipulatedFolding(editor: TextEditor): LastFoldedLine | undefined {
    return this.cachedLastManipulatedFolding.get(editor.document.uri);
  }

  public wasLastActionFolding(editor: TextEditor): boolean {
    return this.cachedDifferentLastFolding.get(editor.document.uri);
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
          foldingLine: key,
          wasFoldedBy: isProgrammaticFold() ? 'computer' : 'user'
        };
        const cachedFoldingStatus = this.getCachedFoldingStatus(editor);
        cachedFoldingStatus.set(key, {
          wasFoldedBy: isProgrammaticFold() ? 'computer' : 'user',
          foldingStatus: (value === true) ? 'folded' : 'unfolded'
        });
        this.cachedDifferentLastFolding.set(editor.document.uri, true);
        this.cachedLastManipulatedFolding.set(editor.document.uri, manipulatedFoldingToSet);
        return;
      }
    }
    this.cachedDifferentLastFolding.set(editor.document.uri, false);
  }

  ;

  public getCachedFoldingStatus(editor: TextEditor): Map<number, FoldingRangeAction> {
    return this.cachedFoldingStatus.get(editor.document.uri);
  }

  public setFoldedLineStatus(editor: TextEditor, key: number, wasFoldedBy: 'computer' | 'user', foldingStatus: 'folded' | 'unfolded') {
    this.getCachedFoldingStatus(editor).set(key, { wasFoldedBy, foldingStatus });
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

export default FoldManipulation.instance;