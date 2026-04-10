import { FoldingRangeKind, TextDocument } from "vscode";
import { BetterFoldingRange } from "../types";
import BetterFoldingRangeProvider from "./betterFoldingRangeProvider";

const NL_REGION_REGEX = /^[ \t]*(?:\/\*)?#NaturalLanguage(?:\s+(.*))?\r?\n([\s\S]*?)^[ \t]*#EndNaturalLanguage(?:\*\/)?/gm;


export default class NLRangesProvider extends BetterFoldingRangeProvider {

  protected async calculateFoldingRanges(document: TextDocument) {
    const ranges: BetterFoldingRange[] = [];

    let match: RegExpExecArray | null;
    while ((match = NL_REGION_REGEX.exec(document.getText())) !== null) {
      if (!match?.[0]) continue;

      const startPosition = document.positionAt(match.index);
      const endPosition = document.positionAt(match.index + match[0].length);

      if (startPosition.line !== endPosition.line) {
        ranges.push({
          start: startPosition.line,
          end: endPosition.line,
          kind: FoldingRangeKind.Comment,
          startColumn: document.lineAt(startPosition.line).firstNonWhitespaceCharacterIndex,
          foldingType: 'natural language',
          collapsedText: match[1]?.trim() || undefined
        });
      }
    }
    return ranges;

  }

}