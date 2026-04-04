import { TextDocument, FoldingRangeKind } from "vscode";
import BetterFoldingRangeProvider from "./betterFoldingRangeProvider";
import { NaturalLanguageFoldingRange } from "../types";

const REGION_REGEX = /"""nlregion\r?\n([\s\S]*?)endnlregion"""/g;

export default class NaturalLanguageRegionRangesProvider extends BetterFoldingRangeProvider {

  protected async calculateFoldingRanges(document: TextDocument) {
    console.log('Natural Language Region provider registered');

    // if (!config.showOnlyRegionsDescriptions()) return [];
    //console.log('region folding ranges');
    //console.log(JSON.stringify(document.getText()));
    // console.log(document.fileName);


    const ranges: NaturalLanguageFoldingRange[] = [];

    let match;
    while ((match = REGION_REGEX.exec(document.getText()))) {
      if (!match?.[0] || !match?.[1]) continue;

      const startPosition = document.positionAt(match.index);
      const endPosition = document.positionAt(match.index + match[0].length);
      console.log('matched natural language region at line: ' + startPosition.line);


      if (startPosition.line !== endPosition.line) {
        ranges.push({
          start: startPosition.line,
          end: endPosition.line,
          kind: FoldingRangeKind.Region,
        });
      }
    }

    //  console.log(ranges);
    return ranges;
  }
}
