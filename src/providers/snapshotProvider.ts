// snapshotProvider.ts
import * as vscode from "vscode";

export const SNAPSHOT_SCHEME = "mysnap";

export class SnapshotProvider implements vscode.TextDocumentContentProvider, vscode.Disposable {
  private readonly store = new Map<string, string>();
  private readonly _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  public readonly onDidChange = this._onDidChange.event;

  provideTextDocumentContent(uri: vscode.Uri): string {
    const key = this.keyFromSnapshotUri(uri);
    return this.store.get(key) ?? "";
  }

  snapshotUriFor(documentUri: vscode.Uri): vscode.Uri {
    const key = this.keyFromDocumentUri(documentUri);
    return vscode.Uri.parse(`${SNAPSHOT_SCHEME}:/${key}`);
  }

  hasSnapshotFor(documentUri: vscode.Uri): boolean {
    const key = this.keyFromDocumentUri(documentUri);
    return this.store.has(key);
  }

  saveFromDocument(doc: vscode.TextDocument): vscode.Uri {
    console.log('document saved');
    const key = this.keyFromDocumentUri(doc.uri);
    this.store.set(key, doc.getText());
    const snapUri = vscode.Uri.parse(`${SNAPSHOT_SCHEME}:/${key}`);
    this._onDidChange.fire(snapUri);
    return snapUri;
  }

  deleteSnapshotFor(docUri: vscode.Uri): vscode.Uri | undefined {  
    const key = this.keyFromDocumentUri(docUri);
    if (!this.store.has(key)) {
      return undefined;
    }


    this.store.delete(key);
    const snapUri = vscode.Uri.parse(`${SNAPSHOT_SCHEME}:/${key}`);
    this._onDidChange.fire(snapUri);
    return snapUri;
  }

 

  getSnapshotContentFor(documentUri: vscode.Uri): string | undefined {
    const key = this.keyFromDocumentUri(documentUri);
    return this.store.get(key);
  }

  dispose(): void {
    this._onDidChange.dispose();
    this.store.clear();
  }

  private keyFromDocumentUri(uri: vscode.Uri): string {
    // IMPORTANT: this key must be used everywhere
    return encodeURIComponent(uri.toString());
  }

  public restart() {
    this.store.clear();
  }
  

  private keyFromSnapshotUri(uri: vscode.Uri): string {
    return uri.path.startsWith("/") ? uri.path.slice(1) : uri.path;
  }
}

