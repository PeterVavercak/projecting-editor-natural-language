import { FoldingRangeKind, TextDocument } from "vscode";
import { BetterFoldingRange } from "../types";
import BetterFoldingRangeProvider from "./betterFoldingRangeProvider";

const NL_REGION_REGEX = /[ \t]*(?:\/\*)?#nlregion\r?\n([\s\S]*?)[ \t]*#endnlregion(?:\*\/)?/g;

export default class NLRangesProvider extends BetterFoldingRangeProvider {

  protected async calculateFoldingRanges(document: TextDocument) {
    const ranges: BetterFoldingRange[] = [];

    ranges.push(...this.calculateRangesForRegex(document, NL_REGION_REGEX, 'natural language'));
    return ranges;
  
  }

  private calculateRangesForRegex(document: TextDocument, regionRegex: RegExp, foldingType: 'code' | 'natural language'): BetterFoldingRange[] {
    const ranges: BetterFoldingRange[] = [];

    let match;
    while ((match = regionRegex.exec(document.getText()))) {
      if (!match?.[0] || !match?.[1]) continue;

      const startPosition = document.positionAt(match.index);
      const endPosition = document.positionAt(match.index + match[0].length);

      if (startPosition.line !== endPosition.line) {
        ranges.push({
          start: startPosition.line,
          end: endPosition.line,
          kind: FoldingRangeKind.Comment,
          startColumn: document.lineAt(startPosition.line).firstNonWhitespaceCharacterIndex,
          foldingType
        });
      }
    }
    return ranges;
  }
}