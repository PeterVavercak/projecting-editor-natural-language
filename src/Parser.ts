import * as vscode from 'vscode';







export function parseText(documentText: string): { firstLine: number, lastLine: number, code: string, naturalLanguage: string, id: number }[] {
    
    const documentLines = documentText.split(/\r?\n/);

    const lineCount =  documentLines.length;

    let foldingRegions: { firstLine: number, lastLine: number, code: string, naturalLanguage: string, id: number }[] = [];
    let foldingRegion: { firstLine: number, lastLine: number, code: string, naturalLanguage: string, id: number } = { firstLine: 0, lastLine: 0, code: '', naturalLanguage: '', id: 0 };
    let inFoldedRegion = false;
    let codeText: string = '';
    let ids: number[] = [0];
    for (let currentLine = 0; currentLine < lineCount; currentLine++) {
        const lineText = documentLines[currentLine];
        if (/#region/.test(lineText)) {
            if (inFoldedRegion) {
                foldingRegions.push(foldingRegion);
            }
            inFoldedRegion = true;
            codeText = '';
            let naturalLanguage = lineText.slice(8);
            foldingRegion = { firstLine: currentLine, lastLine: currentLine, code: '', naturalLanguage: naturalLanguage, id: 0 };
        } else if (/#endregion/.test(lineText) && inFoldedRegion) {
            inFoldedRegion = false;
            foldingRegion.code = codeText;
            foldingRegion.lastLine = currentLine;
            const id = lineText.slice(11);
            if (isNumericString(id) && id !== '0') {
                foldingRegion.id = Number(id);
            } else {
                foldingRegion.id = Math.max(...ids) + 1;
            }
            ids.push(foldingRegion.id);

            foldingRegions.push(foldingRegion);
        } else if (inFoldedRegion) {
            codeText += lineText + '\n';
        }
    }
    if (inFoldedRegion) {
        foldingRegions.push(foldingRegion);
    }


    // console.log(foldingRegions);
    return foldingRegions;
}

export function getDocumentLines(document: vscode.TextDocument): string{
    let text = '';
    for(let currentLine = 0; currentLine < document.lineCount; currentLine++){
        text += currentLine + ': ' + document.lineAt(currentLine).text + '\n';   
    }
    return text;
}




export function writeNaturalLanguage(textDocument: vscode.TextDocument, foldedRegions: { firstLine: number, lastLine: number, code: string, naturalLanguage: string, id: number }[]) {
    const edit = new vscode.WorkspaceEdit();
    

    for (let foldedRegion of foldedRegions) {

        edit.replace(
            textDocument.uri,
            new vscode.Range(foldedRegion.firstLine, 0, foldedRegion.firstLine, textDocument.lineAt(foldedRegion.firstLine).text.length),
            '#region ' + foldedRegion.naturalLanguage
        );
        edit.replace(
            textDocument.uri,
            new vscode.Range(foldedRegion.firstLine + 1, 0, foldedRegion.lastLine + 1, 0),
            foldedRegion.code + '#endregion ' + String(foldedRegion.id) + '\n'
        );

    }
    vscode.workspace.applyEdit(edit);
}

 

function getAllIds(
    foldedRegions: {firstLine: number, lastLine: number, code: string, naturalLanguage: string, id: number }[]
): number[] {
    return foldedRegions.map(o => o.id);
}

function isNumericString(str: string) {
    return /^[0-9]+$/.test(str);
}


