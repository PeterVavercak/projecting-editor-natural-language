import { TextDocument } from "vscode";
import { RegionTokens } from "../types";

const DEFAULT_COMMENT_BLOCK_CONFIG: RegionTokens = {
  start: '/*',
  end: '*/',
};

export function getCommentBlockTokens(document: TextDocument): RegionTokens {
  return COMMENT_BLOCK_CONFIG[document.languageId] ?? DEFAULT_COMMENT_BLOCK_CONFIG;
}


export const COMMENT_BLOCK_CONFIG: Record<string, RegionTokens> = {
  python: {
    start: '"""',
    end: '"""',
    lineComment: '#',
  },
  javascript: {
    start: '/*',
    end: '*/',
    lineComment: '//',
  },
  typescript: {
    start: '/*',
    end: '*/',
    lineComment: '//',
  },
  java: {
    start: '/*',
    end: '*/',
    lineComment: '//',
  },
  csharp: {
    start: '/*',
    end: '*/',
    lineComment: '//',
  },
};