import { Range, TextDocument, TextEditor, Uri, window, FoldingRangeKind } from "vscode";
import { BetterFoldingRange, DecorationsRecord, ProvidersList } from "../types";
import ExtendedMap from "../utils/classes/extendedMap";
import { foldingRangeToRange, groupArrayToMap, rangeToInlineRange, unfoldedRangeToInlineRangeFirstLine, unfoldedRangeToInlineRangeLastLine } from "../utils/classes/functions/utils";
import * as config from "../configuration";
import FoldedLinesManager from "../utils/classes/foldedLinesManager";
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

  private addToDecorations(foldingRanges: BetterFoldingRange[], decorations: DecorationsRecord): DecorationsRecord {
    for (const foldingRange of foldingRanges) {
      const collapsedText = foldingRange.collapsedText ?? DEFAULT_COLLAPSED_TEXT;
      const id = foldingRange.id?.toString() ?? '0';
      if (!(collapsedText in decorations)) {
        const newDecorationOptions = this.newDecorationOptions(collapsedText);
        decorations[id] = window.createTextEditorDecorationType(newDecorationOptions);
      }
    }

    return decorations;
  }

  private addToRegionDecorations(foldingRanges: BetterFoldingRange[], decorations: DecorationsRecord): DecorationsRecord {
    const foldingRegionRanges = foldingRanges.filter(range => range.kind === FoldingRangeKind.Region);
    for (const foldingRange of foldingRanges) {
      const firstLine = foldingRange.start.toString();
      if (!(firstLine in decorations)) {
        const newDecorationOptions = this.newDecorationOptions(foldingRange.foldingType ?? '');
        decorations[firstLine] = window.createTextEditorDecorationType(newDecorationOptions);
      }
    }

    return decorations;
  }

  private applyDecoration(editor: TextEditor) {
    const decorationOption = this.newDecorationOptions('');
    const decoration = window.createTextEditorDecorationType(decorationOption);

    const inlineFoldedRanges: readonly Range[] = [new Range(10, 0, 10, 10)];
    editor.setDecorations(decoration, inlineFoldedRanges);

  }

  private applyDecorations(editor: TextEditor, foldingRanges: BetterFoldingRange[], decorations: DecorationsRecord) {
    const collapsedTextToFoldingRanges = groupArrayToMap(
      foldingRanges,
      (foldingRange) => foldingRange.start.toString(),
      DEFAULT_COLLAPSED_TEXT
    );
    // console.log('apply decorations');
    // console.log(foldingRanges);
    // console.log(collapsedTextToFoldingRanges);
    // console.log(decorations);
    // console.log('end of apply decorations');

    for (const [collapsedText, decoration] of Object.entries(decorations)) {
      const foldingRanges = collapsedTextToFoldingRanges.get(collapsedText)!;
      if (!foldingRanges) continue;
      const ranges: Range[] = foldingRanges.map(foldingRangeToRange(editor.document));

      // const unfoldedRanges: Range[] = ranges.filter((range) => !FoldedLinesManager.isFolded(range, editor));
      const foldedRanges: Range[] = ranges.filter((range) => FoldedLinesManager.isFolded(range, editor));
      // console.log('folded ranges');
      // console.log(foldedRanges);

      /*
      for (const range of unfoldedRanges){
        const firstLineOfUnfoldedRange = new Range(range.start.line, 7, range.start.line, editor.document.lineAt(range.start).text.length);
        const lastLineOfUnfoldedRange = new Range(range.end.line, 10, range.end.line, editor.document.lineAt(range.end).text.length);
      }
      */
      // console.log(ranges);
      //  console.log(unfoldedRanges);


      const inlineFoldedRanges = foldedRanges.map(rangeToInlineRange(editor.document));
      // const inlineUnfoldedRangesFirstLine = unfoldedRanges.map(unfoldedRangeToInlineRangeFirstLine(editor.document));
      // const inlineUnfoldedRangesLastLine = unfoldedRanges.map(unfoldedRangeToInlineRangeLastLine(editor.document));


      editor.setDecorations(decoration, inlineFoldedRanges);
      //editor.setDecorations(unfoldedDecorationFirst, inlineUnfoldedRangesFirstLine);
      //editor.setDecorations(unfoldedDecorationLast, inlineUnfoldedRangesLastLine);

    }

  }

  private getRegionDecorations(editor: TextEditor): DecorationsRecord {
    return this.regionDecorations.get(editor.document.uri);
  }

  private getUnfoldedDecorationsLast(editor: TextEditor): DecorationsRecord {
    return this.unfoldedDecorationsLast.get(editor.document.uri);
  }

  public dispose() {
    this.clearDecorations();
  }
}
