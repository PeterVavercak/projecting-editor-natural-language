import { TextDocument, Range, Position, WorkspaceEdit, workspace } from "vscode";
import { BetterFoldingRange, ProvidersList } from "../../../types";

import * as config from "../../../configuration";
import BetterFoldingRangeProvider from "../../../providers/betterFoldingRangeProvider";


export function groupArrayToMap<T, V>(array: T[], getValue: (element: T) => V, defaultValue?: V): Map<V, T[]> {
  const map: Map<V, T[]> = new Map();

  for (const element of array) {
    const value = getValue(element) ?? defaultValue;
    if (value === undefined || value === null) continue;

    const valueCollection = map.get(value);
    if (!valueCollection) {
      map.set(value, [element]);
    } else {
      valueCollection.push(element);
    }
  }

  return map;
}

export function mapsEqual<K, V>(a: Map<K, V>, b: Map<K, V>): boolean {
  if (a.size !== b.size) return false;

  for (const [key, value] of a) {
    if (!b.has(key)) return false;
    if (b.get(key) !== value) return false;
  }

  return true;
}

export function objectEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (typeof a !== "object" || typeof b !== "object" || a == null || b == null) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!objectEqual(a[key], b[key])) return false;
  }

  return true;
}

export async function clearDocument(document: TextDocument, ranges: BetterFoldingRange[]){
  const edit = new WorkspaceEdit();
  for (const range of ranges){
    if(range.foldingType === 'natural language'){
      if(range.end <= document.lineCount){
        edit.delete(document.uri, new Range(range.start, 0, range.end + 1, 0));
      }else{
        edit.delete(document.uri, new Range(range.start, 0, range.end, document.lineAt(range.end).text.length));
      }
    }else if(range.foldingType === 'code'){
      edit.delete(document.uri, new Range(range.start, 0, range.start, document.lineAt(range.start).text.length));
      edit.delete(document.uri, new Range(range.start, document.lineAt(range.start).text.length, range.start + 1, 0));
      edit.delete(document.uri, new Range(range.end, 0, range.end, document.lineAt(range.end).text.length));
      if(range.end <= document.lineCount){
        edit.delete(document.uri, new Range(range.end, document.lineAt(range.end).text.length, range.end + 1, 0));
      }
    }
  } 
  workspace.applyEdit(edit);
}




export function getPrefixBeforeFirstRealCharInNextNonEmptyLine(
  document: TextDocument,
  startLine: number
): string | undefined {
  for (let i = startLine; i < document.lineCount; i++) {
    const lineText = document.lineAt(i).text;
    if (!/\S/.test(lineText)) {
      continue;
    }

    const firstRealCharIndex = lineText.search(/\S/);

    if (firstRealCharIndex === -1) {
      continue;
    }
    return lineText.slice(0, firstRealCharIndex);
  }

  return undefined;
}

export async function getRanges(document: TextDocument, providerList: ProvidersList): Promise<BetterFoldingRange[]> {
    const providers: Record<string, BetterFoldingRangeProvider[]> = {};
    for (const [selector, provider] of providerList) {
      if (!providers[selector]) {
        providers[selector] = [];
      }
      providers[selector].push(provider);
    }
  
    const excludedLanguages = config.excludedLanguages();
    
    if (excludedLanguages.includes(document.languageId)) {
      return [];
    }
    const ranges: BetterFoldingRange[] = [];
    const languageProviders = providers[document.languageId] ?? [];
    const universalProviders = providers["*"] ?? [];
    const allProviders = [...languageProviders, ...universalProviders];

    for (const provider of allProviders) {
      const providerRanges = await provider.provideFoldingRanges(document);
      ranges.push(...providerRanges);
    }
    return ranges;
  }

  export function isLineInRanges(ranges: Range[], line: number): boolean{
    const pos = new Position(line, 0);
    return ranges.some(range => range.contains(pos));
  }

 export function printSet(title: string, inputSet: Set<number> | number[]) {
    console.log(title + ": ", Array.from(inputSet).join(", "));
  }


export function pairByRelation<T, U>(
  arr1: T[],
  arr2: U[],
  relation: (a: T, b: U) => boolean
) {
  const used = new Set<number>();

  const result: { a?: T; b?: U }[] = [];

  for (const a of arr1) {
    let foundIndex = -1;

    for (let i = 0; i < arr2.length; i++) {
      if (!used.has(i) && relation(a, arr2[i])) {
        foundIndex = i;
        break;
      }
    }

    if (foundIndex !== -1) {
      used.add(foundIndex);
      result.push({ a, b: arr2[foundIndex] });
    } else {
      result.push({ a, b: undefined });
    }
  }

  arr2.forEach((b, i) => {
    if (!used.has(i)) {
      result.push({ a: undefined, b });
    }
  });

  return result;
}

export function getAllIds(
  foldingRanges: BetterFoldingRange[]
): number[] {
  return foldingRanges.map(o => o.id).filter(i => typeof i === 'number');
}


export function foldingRangeToRange(document: TextDocument): (foldingRange: BetterFoldingRange) => Range {
  return (foldingRange) =>
    new Range(
      foldingRange.start,
      foldingRange.startColumn ?? document.lineAt(foldingRange.start).text.length,
      foldingRange.end,
      document.lineAt(foldingRange.end).text.length
    );
}

export function rangeToInlineRange(document: TextDocument): (range: Range) => Range {
  return (range) =>
    new Range(range.start.line, range.start.character, range.start.line, document.lineAt(range.start).text.length);
}

export function unfoldedRangeToInlineRangeFirstLine(document: TextDocument): (range: Range) => Range {
  return (range) =>
    new Range(range.start.line, 7, range.start.line, document.lineAt(range.start).text.length);
}

export function unfoldedRangeToInlineRangeLastLine(document: TextDocument): (range: Range) => Range {
  return (range) =>
    new Range(range.end.line, 10, range.end.line, document.lineAt(range.end).text.length);
}

export function getNaturalLanguageAndCodeRegionText(
    document: TextDocument,
    naturalLanguageRange: BetterFoldingRange,
    codeRange: BetterFoldingRange
): string {
    return document.getText(new Range(naturalLanguageRange.start, 0, codeRange.end, document.lineAt(codeRange.end).text.length));
}

export function getRegionText(
    document: TextDocument,
    foldingRange: BetterFoldingRange
): string {
    return document.getText(new Range(foldingRange.start, 0, foldingRange.end, document.lineAt(foldingRange.end).text.length));
}

export function getMaxObject<T>(arr: T[], selector: (item: T) => number | null | undefined): T | null {
  return arr.reduce<T | null>((max, item) => {
    const val = selector(item);
    if (val == null) return max;

    if (max == null) return item;

    const maxVal = selector(max);
    if (maxVal == null || val > maxVal) return item;

    return max;
  }, null);
}

export function forEachForestLevel<T>(
  roots: T[],
  childrenMap: Map<T, T[]>,
  action: (node: T, level: number) => void,
  skipChildrenCondition: (node: T, level: number) => boolean = () => false
): void {
  let currentLevelNodes: T[] = [...roots];
  let level = 0;

  while (currentLevelNodes.length > 0) {
    const nextLevelNodes: T[] = [];

    for (const node of currentLevelNodes) {
      action(node, level);

      if (skipChildrenCondition(node, level)) {
        continue;
      }

      nextLevelNodes.push(...(childrenMap.get(node) ?? []));
    }

    currentLevelNodes = nextLevelNodes;
    level++;
  }
}

export function getDocumentLines(document: TextDocument): string {
    let text = '';
    for (let currentLine = 0; currentLine < document.lineCount; currentLine++) {
        text += currentLine + ': ' + document.lineAt(currentLine).text + '\n';
    }
    return text;
}
