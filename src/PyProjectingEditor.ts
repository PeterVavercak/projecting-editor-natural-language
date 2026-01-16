import * as vscode from 'vscode';


let outlineRegionPosition = 0;
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
            let parsedCode = self.parseCodeWithNaturalLanguage1(document);
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

        webviewPanel.webview.onDidReceiveMessage(e => {
            switch (e.type) {
                case 'changeDisplay':
                    this.changeDisplay(document, e.displayCode, e.firstLine, e.lastLine);
                    return;


            }
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


    private changeDisplay(textDocument: vscode.TextDocument, isCodeDisplayed: boolean, firstLine: number, lastLine: number) {
        let jsonStructure = this.parseCodeWithNaturalLanguage1(textDocument);
        console.log("parameter");
        console.log(firstLine);
        console.log("inside function");
        for(let region of jsonStructure){
            console.log(region.firstLine);
        }
        const item = jsonStructure.find(x => x.firstLine === firstLine && x.lastLine === lastLine);
        if (item) {
            console.log(item.isCodeOpened);
            console.log(isCodeDisplayed);
            item.isCodeOpened = isCodeDisplayed;
        }
        console.log(jsonStructure);
        this.updateTextDocument(textDocument, jsonStructure);
    }

    private updateTextDocument(document: vscode.TextDocument, json: any) {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(
            document.uri,
            new vscode.Range(outlineRegionPosition + 1, 0, document.lineCount, 0),
            JSON.stringify(json, null, 2));

        return vscode.workspace.applyEdit(edit);
    }



    private parseCodeWithNaturalLanguage1(textDocument: vscode.TextDocument): { firstLine: number, lastLine: number, code: string, naturalLanguage: string, isCodeOpened: boolean }[] {
        let lineCount = textDocument.lineCount;
        let jsonStructure = '';
        let inJsonStructure = false;
        for (let currentLine = 0; currentLine < lineCount; currentLine++) {
            let lineText = textDocument.lineAt(currentLine).text;
            if (/#naturalLanguagesOutline/.test(lineText)) {
                outlineRegionPosition = currentLine;
                inJsonStructure = true;
            }
            else if (inJsonStructure) {
                jsonStructure += lineText;
            }
        }

        let codeFragments: { firstLine: number, lastLine: number, code: string, naturalLanguage: string, isCodeOpened: boolean }[] = [];
        codeFragments = JSON.parse(jsonStructure);

        return codeFragments;


    }








}