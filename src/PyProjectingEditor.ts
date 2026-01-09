import * as vscode from 'vscode';



export class PythonProjectingEditorProvider implements vscode.CustomTextEditorProvider {
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new PythonProjectingEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(PythonProjectingEditorProvider.viewType, provider);
        return providerRegistration;
    }

    private static readonly viewType = 'python.projecting-editor';
    constructor(
        private readonly context: vscode.ExtensionContext
    ) { }

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        webviewPanel.webview.options = {
            enableScripts: true,
        };
        webviewPanel.webview.html = this.getHTMLforWebview(webviewPanel.webview);
        const self = this;
        function updateWebview() {
            let parsedCode = self.parseCodeWithNaturalLanguage(document);
            webviewPanel.webview.postMessage({
                type: 'update',
                text: parsedCode,
            });
        }
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                updateWebview();
            }
        });

        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });

        updateWebview();

    }

    private getHTMLforWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(
            this.context.extensionUri, 'media', 'PyProjectingEditor.js'));






        return /* html */`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=7, initial-scale=1.0">
            <title>Document</title>
        </head>
        <body>
            <div class="fragments"></div>
				
			<script src="${scriptUri}"></script>

        </body>
        </html>
        `;

    }

    private parseCodeWithNaturalLanguage(textDocument: vscode.TextDocument): { code: string, naturalLanguage: string }[] {
        let lineCount = textDocument.lineCount;
        let codeFragments: { code: string, naturalLanguage: string }[] = [];

        let codeFragment: { code: string, naturalLanguage: string } = { code: '', naturalLanguage: '' };
        let codeLines: string = '';
        let NLlines: string = '';


        let inCodeRegion: boolean = false;
        let inNLRegion: boolean = false;
        for (let currentLine = 0; currentLine < lineCount; currentLine++) {
            let lineText = textDocument.lineAt(currentLine).text;
            if (/#region/.test(lineText)) {
                codeFragment = { code: '', naturalLanguage: '' };
                codeLines = '';
                inCodeRegion = true;

            } else if (/#endregion/.test(lineText) && inCodeRegion) {
                inCodeRegion = false;
                codeFragment.code = codeLines;
                

            } else if (inCodeRegion) {
                codeLines += lineText + '\n'; 
            }
            if (/#NLregion/.test(lineText)) {
                NLlines = '';
                inNLRegion = true;

            } else if (/#NLendregion/.test(lineText) && inNLRegion) {
                inNLRegion = false;
                codeFragment.naturalLanguage = NLlines;
                console.log(codeFragment)
                codeFragments.push(codeFragment);

            } else if (inNLRegion) {
                NLlines += lineText + '\n';
            }
        }
        console.log(codeFragments);
        return codeFragments;
    }






}