import { TextDocument } from "vscode";
import { RegionTokens } from "../types";

const DEFAULT_REGION_CONFIG: RegionTokens = {
  start: "#region",
  end: "#endregion",
};

export function getRegionTokens(document: TextDocument): RegionTokens {
  return REGION_CONFIG[document.languageId] ?? DEFAULT_REGION_CONFIG;
}

export const REGION_CONFIG: Record<string, RegionTokens> = {
  python: {
    start: "#region",
    end: "#endregion",
    lineComment: "#",
  },
  javascript: {
    start: "//#region",
    end: "//#endregion",
    lineComment: "//",
  },
  typescript: {
    start: "//#region",
    end: "//#endregion",
    lineComment: "//",
  },
  java: {
    start: "//#region",
    end: "//#endregion",
    lineComment: "//",
  },
  csharp: {
    start: "#region",
    end: "#endregion",
  },
};