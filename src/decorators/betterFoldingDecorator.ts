import { DecorationRenderOptions, Disposable, TextEditor, window } from "vscode";
import * as config from "../configuration";

export default abstract class BetterFoldingDecorator extends Disposable {
  private timeout: NodeJS.Timeout | undefined = undefined;

  constructor() {
    super(() => this.dispose());
  }

  public triggerUpdateDecorations(editor?: TextEditor) {
    if(!config.showDecorations()){
      return;
    }
    if (!this.timeout) {
      this.updateDecorations(editor);

      this.timeout = setTimeout(() => {
        clearTimeout(this.timeout);
        this.timeout = undefined;
      }, 100);
    }
  }

  private updateDecorations(editor?: TextEditor) {
    if (editor) this.updateEditorDecorations(editor);
    else {
      for (const editor of window.visibleTextEditors) {
        this.updateEditorDecorations(editor);
      }
    }
  }

  protected abstract updateEditorDecorations(editor: TextEditor): void;

  // This is how Better Folding is able to provide custom collapsedText.
  protected newDecorationOptions(contentText: string): DecorationRenderOptions {
    return {
      textDecoration: "none; display:none;", // Hides the folded text
      before: {
        // Apparently if you add width and height (any values), the text will be clickable
        width: "4",
        height: "4",
        contentText,
        color: "grey",
        margin: `0 -${100}% 0 0`, // Hides the original collapsed text '…'
        textDecoration: "none; cursor: pointer !important;",
      },
    };
  }
}

/**
 * This code is based on work by Mohammad Baqer
 * Source: https://github.com/mtbaqer/vscode-better-folding
 * Licensed under the MIT License
 * License: https://marketplace.visualstudio.com/items/MohammadBaqer.better-folding/license
 */
