import { FoldingRangeProvider, TextDocument, TextEditor, Uri } from "vscode";
import { BetterFoldingRange } from "../types";
import ExtendedMap from "../utils/classes/extendedMap";

export default abstract class BetterFoldingRangeProvider implements FoldingRangeProvider {
  //Promisized because provideFoldingRanges can be called while calculateFoldingRanges is still running.
  private documentToFoldingRanges: ExtendedMap<Uri, Promise<BetterFoldingRange[]>>;

  constructor() {
    this.documentToFoldingRanges = new ExtendedMap(async () => []);
  }

  public async provideFoldingRanges(document: TextDocument): Promise<BetterFoldingRange[]> {
    return this.documentToFoldingRanges.get(document.uri);
  }

  public updateRanges(document: TextDocument) {
    this.documentToFoldingRanges.set(document.uri, this.calculateFoldingRanges(document));
  }

  protected abstract calculateFoldingRanges(document: TextDocument): Promise<BetterFoldingRange[]>;

  public restart() {
    this.documentToFoldingRanges.clear();
  }

}

/**
 * This code is based on work by Mohammad Baqer
 * Source: https://github.com/mtbaqer/vscode-better-folding
 * Licensed under the MIT License
 * License: https://marketplace.visualstudio.com/items/MohammadBaqer.better-folding/license
 */
