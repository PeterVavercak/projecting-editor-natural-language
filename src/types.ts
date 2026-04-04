import { FoldingRange, FoldingRangeKind, TextEditorDecorationType, Range } from "vscode";
import Bracket from "./bracket-pair-colorizer-2 src/bracket";
import Token from "./bracket-pair-colorizer-2 src/token";
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
  content?: string;
}

export interface BetterFoldingRange extends FoldingRange {
  start: number;
  end: number;
  startColumn?: number;
  kind?: FoldingRangeKind;
  collapsedText?: string;
  id?: number | null;
  content?:  string
  foldingType?: 'code' | 'natural language';
}


export interface FoundLanguageTranslation{
  hasFolded: 'code' | 'natural language';
  codeFolding?: BetterFoldingRange;
  naturalLanguageFolding?: BetterFoldingRange; 
}

export interface TokenizedDocument {
  brackets: Bracket[];
  tokens: Token[];
}


export interface LastFoldedLine {
  lastFoldingAction: 'wasUnfolded' | 'wasFolded';
  foldingLine: number;
} 

export type VisibleState = {
  ranges: readonly Range[];
  docVersion: number;
};



export type ProvidersList = [selector: string, provider: BetterFoldingRangeProvider][];

export type DecorationsRecord = Record<string, TextEditorDecorationType>;

