import { FoldingRange, FoldingRangeKind, TextEditorDecorationType, Range } from "vscode";

import BetterFoldingRangeProvider from "./providers/betterFoldingRangeProvider";

export interface RegionNode {
  name?: string;
  start: number;
  startLine: number;
  end?: number;
  endLine?: number;
  index?: number;
  content?: string;
  children: RegionNode[];
  parent?: RegionNode;
}

export interface LineRegionNode {
  name?: string;
  startLine: number;
  endLine?: number;
  children: LineRegionNode[];
  parent?: LineRegionNode;
  nestingLevel?: number;
}

export interface BetterFoldingRange extends FoldingRange {
  start: number;
  end: number;
  startColumn?: number;
  kind?: FoldingRangeKind;
  collapsedText?: string;
  nestingLevel?: number;
  foldingType?: 'Source Code' | 'Natural Language';
}

export interface RegionTokens {
  start: string;
  end: string;
  lineComment?: string;
}



export interface LanguageTranslation {
  hasFolded: 'Source Code' | 'Natural Language';
  codeFolding?: BetterFoldingRange;
  naturalLanguageFolding?: BetterFoldingRange;
}



export interface NaturalLanguageRegionCouple {
  nesting?: number;
  codeFolding?: BetterFoldingRange;
  naturalLanguageFolding?: BetterFoldingRange;
}

export interface FoldingRangeAction {
  wasFoldedBy: 'user' | 'computer';
  foldingStatus: 'folded' | 'unfolded';
};
export interface LastFoldedLine {
  wasFoldedBy: 'user' | 'computer';
  lastFoldingAction: 'wasUnfolded' | 'wasFolded';
  foldingLine: number;
};

export type VisibleState = {
  ranges: readonly Range[];
  docVersion: number;
};

export type TreeNode<T> = {
  value: T;
  children: TreeNode<T>[];
};

export type ProvidersList = [selector: string, provider: BetterFoldingRangeProvider][];

export type DecorationsRecord = Record<string, TextEditorDecorationType>;

/**
 * Original Code Provided Mohammad Baqer
 * Source: https://github.com/mtbaqer/vscode-better-folding
 * Licensed under the MIT License
 * License: https://marketplace.visualstudio.com/items/MohammadBaqer.better-folding/license
 * 
 * Changes:
 * added other types needed for program
 */