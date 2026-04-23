import { TextDocument } from "vscode";
import { RegionTokens } from "../types";

const DEFAULT_COMMENT_BLOCK_CONFIG: RegionTokens = {
  start: '/*#NaturalLanguage',
  end: '#EndNaturalLanguage*/',
  lineComment: '//',
};

export function getCommentBlockTokens(document: TextDocument): RegionTokens {
  return NATURAL_LANGUAGE_BLOCK[document.languageId] ?? DEFAULT_COMMENT_BLOCK_CONFIG;
}


export const NATURAL_LANGUAGE_BLOCK: Record<string, RegionTokens> = {
  python: {
    start: '#NaturalLanguage',
    end: '#EndNaturalLanguage',
    lineComment: '#',
  },
  javascript: {
    start: '/*#NaturalLanguage',
    end: '#EndNaturalLanguage*/',
    lineComment: '//',
  },
  typescript: {
    start: '/*#NaturalLanguage',
    end: '#EndNaturalLanguage*/',
    lineComment: '//',
  },
  java: {
    start: '/*#NaturalLanguage',
    end: '#EndNaturalLanguage*/',
    lineComment: '//',
  },
  csharp: {
    start: '/*#NaturalLanguage',
    end: '#EndNaturalLanguage*/',
    lineComment: '//',
  },
};