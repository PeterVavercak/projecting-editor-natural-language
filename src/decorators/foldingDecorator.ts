import { Range, TextDocument, TextEditor, Uri, window, FoldingRangeKind } from "vscode";
import { BetterFoldingRange, DecorationsRecord, ProvidersList } from "../types";
import ExtendedMap from "../utils/classes/extendedMap";
import { capitalizeSafe, foldingRangeToRange, groupArrayToMap, rangeToInlineRange, unfoldedRangeToInlineRangeFirstLine, unfoldedRangeToInlineRangeLastLine } from "../utils/classes/functions/utils";
import * as config from "../configuration";
import FoldedLinesManager from "../utils/classes/managers/foldedLinesManager";
import { DEFAULT_COLLAPSED_TEXT } from "../constants";
import BetterFoldingDecorator from "./betterFoldingDecorator";
import BetterFoldingRangeProvider from "../providers/betterFoldingRangeProvider";

export default class FoldingDecorator extends BetterFoldingDecorator {
  providers: Record<string, BetterFoldingRangeProvider[]> = {};
  regionDecorations: ExtendedMap<Uri, DecorationsRecord> = new ExtendedMap(() => ({}));
  unfoldedDecorationsLast: ExtendedMap<Uri, DecorationsRecord> = new ExtendedMap(() => ({}));

  constructor(providers: ProvidersList) {
    super();
    for (const [selector, provider] of providers) {
      this.registerFoldingRangeProvider(selector, provider);
    }
  }

  public registerFoldingRangeProvider(selector: string, provider: BetterFoldingRangeProvider) {
    if (!this.providers[selector]) {
      this.providers[selector] = [];
    }

    this.providers[selector].push(provider);
  }

  protected async updateEditorDecorations(editor: TextEditor) {
    const foldingRanges = await this.getRanges(editor.document);
    const regionDecorations = this.addToRegionDecorations(foldingRanges, this.getRegionDecorations(editor));
    this.applyDecorations(editor, foldingRanges, regionDecorations);
  }

  private clearDecorations() {
    for (const decorations of this.regionDecorations.values()) {
      for (const decoration of Object.values(decorations)) {
        decoration.dispose();
      }
    }
  }

  public async getRanges(document: TextDocument): Promise<BetterFoldingRange[]> {
    const excludedLanguages = config.excludedLanguages();
    if (excludedLanguages.includes(document.languageId)) return [];

    const ranges: BetterFoldingRange[] = [];

    const languageProviders = this.providers[document.languageId] ?? [];
    const universalProviders = this.providers["*"] ?? [];
    const allProviders = [...languageProviders, ...universalProviders];

    for (const provider of allProviders) {
      const providerRanges = await provider.provideFoldingRanges(document);
      ranges.push(...providerRanges);
    }
    return ranges;
  }

  private addToRegionDecorations(foldingRanges: BetterFoldingRange[], decorations: DecorationsRecord): DecorationsRecord {
    for (const foldingRange of foldingRanges) {
      const name = foldingRange.collapsedText ?? foldingRange.foldingType ?? DEFAULT_COLLAPSED_TEXT ;
      if (!(name in decorations)) {
        const newDecorationOptions = this.newDecorationOptions(foldingRange.collapsedText ?? capitalizeSafe(foldingRange.foldingType) ?? '');
        decorations[name] = window.createTextEditorDecorationType(newDecorationOptions);
      }
    }
    return decorations;
  }

  private applyDecorations(editor: TextEditor, foldingRanges: BetterFoldingRange[], decorations: DecorationsRecord) {
    const collapsedTextToFoldingRanges = groupArrayToMap(
      foldingRanges,
      (foldingRange) => (foldingRange.collapsedText ?? foldingRange.foldingType ),
      DEFAULT_COLLAPSED_TEXT
    );

    for (const [collapsedText, decoration] of Object.entries(decorations)) {
      const foldingRanges = collapsedTextToFoldingRanges.get(collapsedText)!;
      if (!foldingRanges) continue;
      const ranges: Range[] = foldingRanges.map(foldingRangeToRange(editor.document));

      const foldedRanges: Range[] = ranges.filter((range) => FoldedLinesManager.isFolded(range, editor));

      const inlineFoldedRanges = foldedRanges.map(rangeToInlineRange(editor.document));
      editor.setDecorations(decoration, inlineFoldedRanges);
    }
  }

  private getRegionDecorations(editor: TextEditor): DecorationsRecord {
    return this.regionDecorations.get(editor.document.uri);
  }

  public dispose() {
    this.clearDecorations();
  }
}
