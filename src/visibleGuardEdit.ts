import * as vscode from "vscode";
import ExtendedMap from "./extendedMap";

class VisibleRangeGuard {
  private readonly lastPhysicalEdit: ExtendedMap<string, number> = new ExtendedMap(() => -1);
  private readonly ignoreWindowMs: number;

  constructor(ignoreWindowMs = 50) {
    this.ignoreWindowMs = ignoreWindowMs;
  }

  public markPhysicalEdit(document: vscode.TextDocument): void {
    this.lastPhysicalEdit.set(document.uri.toString(), Date.now());
  }

  public shouldIgnore(editor: vscode.TextEditor): boolean {
    const key = editor.document.uri.toString();
    const lastEdit = this.lastPhysicalEdit.get(key) ?? 0;
    return Date.now() - lastEdit < this.ignoreWindowMs;
  }
}

const guard = new VisibleRangeGuard(50);

vscode.workspace.onDidChangeTextDocument((e) => {
  if (e.contentChanges.length === 0) {
    return;
  }

  guard.markPhysicalEdit(e.document);
});

vscode.window.onDidChangeTextEditorVisibleRanges((e) => {
  if (guard.shouldIgnore(e.textEditor)) {
    return;
  }

  console.log("Visible ranges change accepted");
});