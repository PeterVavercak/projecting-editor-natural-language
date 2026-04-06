import { TextDocument, FoldingRangeKind} from "vscode";
import { BetterFoldingRange, LineRegionNode} from "../types";
import BetterFoldingRangeProvider from "./betterFoldingRangeProvider";

const NL_REGION_REGEX = /[ \t]*("""|\/\*)nlregion\r?\n([\s\S]*?)[ \t]*endnlregion("""|\*\/)/g;

export default class RegionRangesProvider extends BetterFoldingRangeProvider {

  protected async calculateFoldingRanges(document: TextDocument) {
    return this.getRanges(document);
  }

  private calculateRangesForRegex(document: TextDocument, regionRegex: RegExp, foldingType: 'code' | 'natural language'): BetterFoldingRange[] {
    const ranges: BetterFoldingRange[] = [];

    let match;
    while ((match = regionRegex.exec(document.getText()))) {
      if (!match?.[0] || !match?.[1]) continue;

      const startPosition = document.positionAt(match.index);
      const endPosition = document.positionAt(match.index + match[0].length);
      //  console.log('matched code region at line: ' + startPosition.line);

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

  public getRanges(document: TextDocument): BetterFoldingRange[]{
     const ranges: BetterFoldingRange[] = [];

    ranges.push(...this.buildFoldingRanges(document));
    ranges.push(...this.calculateRangesForRegex(document, NL_REGION_REGEX, 'natural language'));
    return ranges;
  }

  private buildFoldingRanges(document: TextDocument): BetterFoldingRange[] {
    const regions = this.parseNestedRegionsByLines(document);
    //console.log('get nested regions');
    //console.log(regions);
    
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
              nestingLevel: node.nestingLevel
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


