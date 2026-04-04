import { TextDocument, Range, FoldingRange, Position } from "vscode";
import { BetterFoldingRange, ProvidersList } from "../../../types";
import Bracket from "../../../bracket-pair-colorizer-2 src/bracket";
import BracketClose from "../../../bracket-pair-colorizer-2 src/bracketClose";
import BracketsRange from "../bracketsRange";
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

export async function getRanges(document: TextDocument, providerList: ProvidersList): Promise<BetterFoldingRange[]> {
    const excludedLanguages = config.excludedLanguages();
    const providers: Record<string, BetterFoldingRangeProvider[]> = {};
    
    if (excludedLanguages.includes(document.languageId)) return [];

    for (const [selector, provider] of providerList) {
      if (providers[selector]) {
        providers[selector] = [];
      }
      providers[selector].push(provider);
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

export function bracketsToBracketsRanges(brackets: Bracket[], sortBy: "end" | "start" = "end"): BracketsRange[] {
  const ranges: BracketsRange[] = [];

  for (let i = brackets.length - 1; i >= 0; i--) {
    const bracket = brackets[i];
    if (bracket instanceof BracketClose) {
      const openBracket = bracket.openBracket;
      if (openBracket) {
        const bracketsRange = new BracketsRange(openBracket, bracket);
        ranges.push(bracketsRange);
      }
    }
  }

  ranges.sort((a, b) => {
    if (a.end.isAfter(b.end)) {
      if (a.contains(b)) {
        return 1;
      }
      return -1;
    }

    if (b.contains(a)) {
      return -1;
    }
    return 1;
  });

  return sortBy === "start" ? ranges.reverse() : ranges;
}
