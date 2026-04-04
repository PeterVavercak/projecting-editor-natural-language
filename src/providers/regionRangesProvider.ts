import { TextDocument, FoldingRangeKind, WorkspaceEdit, workspace, Position } from "vscode";
import { BetterFoldingRange, LineRegionNode, RegionNode } from "../types";
import * as config from "../configuration";
import BetterFoldingRangeProvider from "./betterFoldingRangeProvider";
import { getAllIds, pairByRelation } from '../utils/classes/functions/utils';


//const REGION_REGEX = /#region (.*)\r?\n(?:.|\n)*?#endregion/g;
//const REGION_REGEX = /#region (.*?)\r?\n([\s\S]*?)#endregion/g;
//const REGION_REGEX = /#region (.*?)\r?\n([\s\S]*?)#endregion(?:\s*(\d+))?/g;
const REGION_REGEX = /#region(?:\s+(.*?))?\r?\n([\s\S]*?)#endregion(?:\s*(\d+))?/g;
//const REGION_REGEX = /^\s*#region\b(.*)\r?\n[\s\S]*?^\s*#endregion\b/gm;
const NL_REGION_REGEX = /"""nlregion\r?\n([\s\S]*?)endnlregion"""/g;






//const TOKEN_REGEX = /#region(?:\s+(.*?))?\r?\n|#endregion(?:\s*(\d+))?/g;
const TOKEN_REGEX = /(?:#|\/\/)\s*#?region(?:\s+(.*?))?\r?\n|(?:#|\/\/)\s*#?endregion(?:\s*(\d+))?/g;




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
          kind: FoldingRangeKind.Region,
          startColumn: document.lineAt(startPosition.line).firstNonWhitespaceCharacterIndex,
          content: match[1],
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
/*
  public getCouples(document: TextDocument): LanguageTranslation[] {
    const codeRanges = this.calculateRangesForRegex(document, REGION_REGEX, 'code');
    const naturalLanguageRanges = this.calculateRangesForRegex(document, NL_REGION_REGEX, 'natural language');
    const relations = pairByRelation(naturalLanguageRanges, codeRanges, (nlRange, codeRange) => nlRange.end + 1 === codeRange.start);

    const translations: LanguageTranslation[] = relations.map(r => ({
      codeFolding: r.a,
      naturalLanguageFolding: r.b
    }));
    return translations;

  }
    */
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
              content: node.content,
              startColumn: document.lineAt(node.startLine).firstNonWhitespaceCharacterIndex,
              foldingType: 'code'
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
      const name = line.slice("#region".length).trim() || undefined;

      const node: LineRegionNode = {
        name,
        startLine: i,
        children: [],
        parent: stack[stack.length - 1],
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

      if (current.startLine + 1 <= i - 1) {
        current.content = lines
          .slice(current.startLine + 1, i)
          .join("\n");
      } else {
        current.content = "";
      }
    }
    
  }

  return roots;
}




  private writeIds(document: TextDocument, ranges: BetterFoldingRange[]) {
    const edit = new WorkspaceEdit();

    const iDs = getAllIds(ranges);


    for (const range of ranges) {
      if (range.id === 0) {
        const newId = Math.max(...iDs) + 1;
        iDs.push(newId);
        range.id = newId;
        // console.log('ID written: ' + newId);
        edit.insert(
          document.uri,
          new Position(range.end, document.lineAt(range.end).text.length),
          ' ' + newId.toString()
        );

      }
    }
    workspace.applyEdit(edit);

  }
}


