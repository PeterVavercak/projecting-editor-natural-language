import { workspace } from "vscode";
import { CONFIG_ID } from "./constants";

export function getConfiguredLanguageModel (): string {
    return workspace.getConfiguration( "projectingNaturalLanguage").get("setLanguageModel") ?? 'gpt-4o'; 
}

export function getAutomaticTranslation () {
  return workspace.getConfiguration( "projectingNaturalLanguage" ).get<boolean>("automaticTranslation") ?? true;
}

export function getAutomaticFolding () {
  return workspace.getConfiguration( "projectingNaturalLanguage" ).get<boolean>("automaticFolding") ?? true;
}

export function excludedLanguages() {
  return workspace.getConfiguration(CONFIG_ID).get<string[]>("excludedLanguages") ?? [];
}


