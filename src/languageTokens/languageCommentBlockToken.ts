import { TextDocument } from "vscode";
import { RegionTokens } from "../types";

const DEFAULT_COMMENT_BLOCK_CONFIG: RegionTokens = {
  start: '/*nlregion',
  end: 'endnlregion*/',
};

export function getCommentBlockTokens(document: TextDocument): RegionTokens {
  return NATURAL_LANGUAGE_BLOCK[document.languageId] ?? DEFAULT_COMMENT_BLOCK_CONFIG;
}


export const NATURAL_LANGUAGE_BLOCK: Record<string, RegionTokens> = {
  python: {
    start: '#nlregion',
    end: '#endnlregion',
    lineComment: '#',
  },
  javascript: {
    start: '/*nlregion',
    end: 'endnlregion*/',
    lineComment: '//',
  },
  typescript: {
    start: '/*nlregion',
    end: 'endlregion*/',
    lineComment: '//',
  },
  java: {
    start: '/*nlregion',
    end: 'endnlregion*/',
    lineComment: '//',
  },
  csharp: {
    start: '/*nlregion',
    end: 'endnlregion*/',
    lineComment: '//',
  },
};