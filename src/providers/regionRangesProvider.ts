import { TextDocument, FoldingRangeKind } from "vscode";
import { BetterFoldingRange, LineRegionNode } from "../types";
import BetterFoldingRangeProvider from "./betterFoldingRangeProvider";


export default class RegionRangesProvider extends BetterFoldingRangeProvider {

  protected async calculateFoldingRanges(document: TextDocument) {
    const ranges: BetterFoldingRange[] = [];

    ranges.push(...this.buildFoldingRanges(document));
    return ranges;
  }

  private buildFoldingRanges(document: TextDocument): BetterFoldingRange[] {
    const regions = this.parseNestedRegionsByLines(document);
    const result: BetterFoldingRange[] = [];

    function visit(nodes: LineRegionNode[]) {
      for (const node of nodes) {
        if (node.endLine !== undefined && node.startLine < node.endLine) {

          result.push(
            {
              start: node.startLine,
              end: node.endLine,
              kind: FoldingRangeKind.Region,
              startColumn: document.lineAt(node.startLine).firstNonWhitespaceCharacterIndex,
              foldingType: 'code',
              nestingLevel: node.nestingLevel,
              collapsedText: node.name
            }
          );
        }
        visit(node.children);
      }
    }

    visit(regions);
    return result;
  }


  private parseNestedRegionsByLines(document: TextDocument): LineRegionNode[] {
    const text = document.getText();
    const lines = text.split(/\r?\n/);
    const roots: LineRegionNode[] = [];
    const stack: LineRegionNode[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (/^(?:\/\/\s*)?#region\b/i.test(line)) {
        const name = line.replace(/^(?:\/\/\s*)?#region\b/i, "").trim() || undefined;

        const node: LineRegionNode = {
          name,
          startLine: i,
          children: [],
          parent: stack[stack.length - 1],
          nestingLevel: stack.length,
        };

        if (stack.length === 0) {
          roots.push(node);
        } else {
          stack[stack.length - 1].children.push(node);
        }

        stack.push(node);
      } else if (/^(?:\/\/\s*)?#endregion\b/i.test(line)) {
        const current = stack.pop();

        if (!current) {
          continue;
        }

        current.endLine = i;
      }
    }
    return roots;
  }
}