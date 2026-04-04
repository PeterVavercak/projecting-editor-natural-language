
import * as vscode from 'vscode';
import { parseText, writeNaturalLanguage } from './Parser';
import { GENERATE_ALL_CODES, GENERATE_ALL_NATURAL_LANGUAGE } from './LanguageModelPrompts';
import { getConfiguredLanguageModel } from './configuration';



const languageModel = getConfiguredLanguageModel() ?? 'gpt-4o';





export async function writeAllNL(documentLines: string, document: vscode.TextDocument) {

    let [model] = await vscode.lm.selectChatModels({
        vendor: 'copilot',
        family: 'gpt-4o'
    });
    const messages = [
        vscode.LanguageModelChatMessage.User(GENERATE_ALL_NATURAL_LANGUAGE),
        vscode.LanguageModelChatMessage.User(documentLines)
    ];
    if (model) {
        let chatResponse = await model.sendRequest(
            messages,
            {},
            new vscode.CancellationTokenSource().token
        );
        await createEdits(chatResponse, document);
    }

}

async function createEdits(
    chatResponse: vscode.LanguageModelChatResponse,
    textDocument: vscode.TextDocument
) {
    let accumulatedResponse = '';
    const edit = new vscode.WorkspaceEdit();

    for await (const fragment of chatResponse.text) {
        accumulatedResponse += fragment;

        // if the fragment is a }, we can try to parse the whole line
        if (fragment.includes('}')) {
            //    console.log('here');
            //    console.log(accumulatedResponse);
            try {
                const annotation = JSON.parse(accumulatedResponse);
                console.log(annotation);

                edit.replace(
                    textDocument.uri,
                    new vscode.Range(annotation.line, 0, annotation.line, textDocument.lineAt(annotation.line).text.length),
                    '#region ' + annotation.text
                );


                // reset the accumulator for the next line
                accumulatedResponse = '';
            } catch (e) {
                console.log(e);
                // do nothing
            }
        }
    }
    vscode.workspace.applyEdit(edit);
}



export async function writeAllCodes(documentLines: string, document: vscode.TextDocument) {

    let [model] = await vscode.lm.selectChatModels({
        vendor: 'copilot',
        family: 'gpt-4o'
    });
    const messages = [
        vscode.LanguageModelChatMessage.User(GENERATE_ALL_CODES),
        vscode.LanguageModelChatMessage.User(documentLines)
    ];
    if (model) {
        let chatResponse = await model.sendRequest(
            messages,
            {},
            new vscode.CancellationTokenSource().token
        );
        await editCodes(chatResponse, document);
        //console.log(await parseChatResponse(chatResponse));
    }

}

async function editCodes(
    chatResponse: vscode.LanguageModelChatResponse,
    textDocument: vscode.TextDocument
) {
    let accumulatedResponse = '';
    const edit = new vscode.WorkspaceEdit();

    for await (const fragment of chatResponse.text) {
        accumulatedResponse += fragment;

        // if the fragment is a }, we can try to parse the whole line
        if (fragment.includes('}')) {
            //    console.log('here');
            //    console.log(accumulatedResponse);
            try {
                const annotation = JSON.parse(accumulatedResponse);
                console.log(annotation);
                edit.replace(
                    textDocument.uri,
                    new vscode.Range(annotation.firstLine, 0, annotation.lastLine, textDocument.lineAt(annotation.lastLine).text.length),
                    textDocument.lineAt(annotation.firstLine).text + '\n' + annotation.code + '\n#endregion\n'
                );


                // reset the accumulator for the next line
                accumulatedResponse = '';
            } catch (e) {
                console.log(e);
                // do nothing
            }
        }
    }
    vscode.workspace.applyEdit(edit);
}








