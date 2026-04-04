import { workspace, WorkspaceEdit, LanguageModelChatMessage, LanguageModelChatResponse, lm, TextDocument, CancellationTokenSource, Range, Position } from 'vscode';
import { GENERATE_CODE, GENERATE_NATURAL_LANGUAGE, UPDATE_CODE, UPDATE_NATURAL_LANGUAGE } from './LanguageModelPrompts';
import { getConfiguredLanguageModel } from './configuration';
import { BetterFoldingRange} from './types';
/*

export async function updateDoc(
    textDocument: vscode.TextDocument,
    currentDoc: { firstLine: number, lastLine: number, code: string, naturalLanguage: string, id: number }[],
    lastSnapshot: { firstLine: number, lastLine: number, code: string, naturalLanguage: string, id: number }[]
): Promise<void> {


    let [model] = await vscode.lm.selectChatModels({
        vendor: 'copilot',
        family: 'gpt-4o'
    });
    for (let foldRegion of currentDoc) {
        const found = lastSnapshot.find(o => o.id === foldRegion.id) ?? null;
        if (found === null) {
            if (foldRegion.code === '' && foldRegion.naturalLanguage === '') {
                // do nothing
            } else if (foldRegion.code === '') {
                foldRegion.code = await generateCode(model, textDocument, foldRegion);
            } else if (foldRegion.naturalLanguage === '') {
                foldRegion.naturalLanguage = await generateNaturalLanguage(model, textDocument, foldRegion);
            } else {
                //check and update
            }
        } else {
            if (found.code !== foldRegion.code && found.naturalLanguage !== foldRegion.naturalLanguage) {
                // update Natural Language
            } else if (found.code !== foldRegion.code) {
                console.log("update NL");
                foldRegion.naturalLanguage = await updateNaturalLanguage(model, textDocument, foldRegion, found);
            } else if (found.naturalLanguage !== foldRegion.naturalLanguage) {
                // update Code
            } else if (foldRegion.code === '' && foldRegion.naturalLanguage === '') {
                // do nothing
            } else if (foldRegion.code === '') {
                foldRegion.code = await generateCode(model, textDocument, foldRegion);
            } else if (foldRegion.naturalLanguage === '') {
                foldRegion.naturalLanguage = await generateNaturalLanguage(model, textDocument, foldRegion);
            } else {
                //check and update
            }
        }
    }
}
    */
/*
async function generateNaturalLanguage(
    model: vscode.LanguageModelChat,
    textDocument: vscode.TextDocument,
    currentRegion: { firstLine: number, lastLine: number, code: string, naturalLanguage: string, id: number }
): Promise<string> {
    const messages = [
        vscode.LanguageModelChatMessage.User(GENERATE_NATURAL_LANGUAGE),
        vscode.LanguageModelChatMessage.User(currentRegion.code)
    ];
    let returnText: string = '';
    if (model) {
        let chatResponse = await model.sendRequest(
            messages,
            {},
            new vscode.CancellationTokenSource().token
        );
        returnText = await parseChatResponse(chatResponse);
    }
    return returnText;
}
*/

/*
async function updateNaturalLanguage(
    model: vscode.LanguageModelChat,
    textDocument: vscode.TextDocument,
    currentRegion: { firstLine: number, lastLine: number, code: string, naturalLanguage: string, id: number },
    oldRegion: { firstLine: number, lastLine: number, code: string, naturalLanguage: string, id: number }
): Promise<string> {
    let returnedText: string;
    const messages = [
        vscode.LanguageModelChatMessage.User(UPDATE_NATURAL_LANGUAGE),
        vscode.LanguageModelChatMessage.User(oldRegion.code),
        vscode.LanguageModelChatMessage.User(oldRegion.naturalLanguage),
        vscode.LanguageModelChatMessage.User(currentRegion.code)
    ];
    let returnText: string = '';
    if (model) {
        let chatResponse = await model.sendRequest(
            messages,
            {},
            new vscode.CancellationTokenSource().token
        );
        returnText = await parseChatResponse(chatResponse);
    }
    return returnText;
}
*/
/*
export async function generateCode(
    model: vscode.LanguageModelChat,
    textDocument: vscode.TextDocument,
    currentRegion: { firstLine: number, lastLine: number, code: string, naturalLanguage: string, id: number }
): Promise<string> {

    const messages = [
        vscode.LanguageModelChatMessage.User(GENERATE_CODE),
        vscode.LanguageModelChatMessage.User(currentRegion.naturalLanguage),
    ];
    let returnedText: string = '';
    if (model) {
        let chatResponse = await model.sendRequest(
            messages,
            {},
            new vscode.CancellationTokenSource().token
        );
        returnedText = await parseChatResponse(chatResponse);
       // await writeText(chatResponse, textDocument, currentRegion);
    }
    return returnedText;
}
*/

const languageModel = getConfiguredLanguageModel() ?? 'gpt-4o';

export async function generateLanguageResponse(
    document: TextDocument,
    naturalLanguageRange: BetterFoldingRange | undefined,
    codeRange: BetterFoldingRange | undefined,
    useCase: 'genNL' | 'updateNL' | 'genCode' | 'updateCode'
) {
    const [languageModelInstruction, languageModelPrompt] = getLanguagePrompt(document, naturalLanguageRange, codeRange, useCase);
    if (languageModelInstruction === undefined || languageModelPrompt === undefined) {
        return;
    }

    console.log();
    console.log('Generate Language Response:');
    console.log(languageModelPrompt);
    console.log();
    
    let [model] = await lm.selectChatModels({
        vendor: 'copilot',
        family: languageModel
    });
    const messages = [
        LanguageModelChatMessage.User(languageModelInstruction),
        LanguageModelChatMessage.User(document.languageId),
        LanguageModelChatMessage.User(languageModelPrompt)
    ];
    if (model) {
        let chatResponse = await model.sendRequest(
            messages,
            {},
            new CancellationTokenSource().token
        );
        if(useCase === 'genNL'){
            await addNewNaturalLanguageIntoDoc(document, chatResponse, codeRange, useCase);
        }else if (useCase === 'genCode') {
            await addNewCodeIntoDoc(document, chatResponse, naturalLanguageRange, useCase);
        }else {
            await rewriteDocWithLanguageResponse(document, chatResponse, naturalLanguageRange, codeRange, useCase);
        }

    }
}



function getLanguagePrompt(
    document: TextDocument,
    naturalLanguageRange: BetterFoldingRange | undefined,
    codeRange: BetterFoldingRange | undefined,
    useCase: 'genNL' | 'updateNL' | 'genCode' | 'updateCode'
): [string | undefined, string | undefined] {
    switch (useCase) {
        case 'genNL':
            if (codeRange === undefined) {
                return [undefined, undefined];
            }
            return [
                GENERATE_NATURAL_LANGUAGE,
                getRegionText(document, codeRange)
            ];

        case 'updateNL':
            if (codeRange === undefined || naturalLanguageRange === undefined) {
                return [undefined, undefined];
            }
            return [
                UPDATE_NATURAL_LANGUAGE,
                getNaturalLanguageAndCodeRegionText(document, naturalLanguageRange, codeRange)
            ];

        case 'genCode':
            if (naturalLanguageRange === undefined) {
                return [undefined, undefined];
            }
            return [
                GENERATE_CODE,
                getRegionText(document, naturalLanguageRange)
            ];
        case 'updateCode':
            if (codeRange=== undefined || naturalLanguageRange === undefined) {
                return [undefined, undefined];
            }
            return [
                UPDATE_CODE,
                getNaturalLanguageAndCodeRegionText(document, naturalLanguageRange, codeRange)
            ];
    }
}

async function addNewNaturalLanguageIntoDoc(
    document: TextDocument,
    response: LanguageModelChatResponse,
    codeRange: BetterFoldingRange | undefined,
    useCase: 'genNL'
) {
    if (codeRange === undefined) {
        return;
    }
    const edit = new WorkspaceEdit();
    const accumulatedResponse = await parseChatResponse(response);
    
    console.log();
    console.log('Add new natural language into doc');
    console.log(accumulatedResponse);
    console.log();

    edit.insert(
        document.uri,
        new Position(codeRange.start, 0),
        '"""nlregion\n' + accumulatedResponse + '\nendnlregion"""\n'
    );
    workspace.applyEdit(edit);
}

async function addNewCodeIntoDoc(
    document: TextDocument,
    response: LanguageModelChatResponse,
    naturalLanguageRange: BetterFoldingRange | undefined,
    useCase: 'genCode'
) {
    if (naturalLanguageRange === undefined) {
        return;
    }
    const accumulatedResponse = await parseChatResponse(response);
    
    console.log();
    console.log('Add new code into doc');
    console.log(accumulatedResponse);
    console.log();

    const edit = new WorkspaceEdit();
    edit.insert(
        document.uri,
        new Position(naturalLanguageRange.end, document.lineAt(naturalLanguageRange.end).text.length),
        '\n'
    );
    edit.insert(
        document.uri,
        new Position(naturalLanguageRange.end + 1, 0),
        '#region\n' + accumulatedResponse + '\n#endregion'
    );
    workspace.applyEdit(edit);
}



async function rewriteDocWithLanguageResponse(
    document: TextDocument,
    response: LanguageModelChatResponse,
    naturalLanguageRange: BetterFoldingRange | undefined,
    codeRange: BetterFoldingRange | undefined,
    useCase: 'updateNL' | 'updateCode'
) {
    if (codeRange === undefined || naturalLanguageRange === undefined) {
        return;
    }
    const accumulatedResponse = await parseChatResponse(response);

    console.log();
    console.log('rewrite doc with language response');
    console.log(accumulatedResponse);
    console.log();

    if (accumulatedResponse == "") {
        return;
    }
    const edit = new WorkspaceEdit();
    const chosenRegion = useCase === 'updateNL' ? naturalLanguageRange : codeRange;
    const chosenRange = new Range(
        chosenRegion.start,
        document.lineAt(chosenRegion.end).text.length,
        chosenRegion.end,
        0
    );

    const naturalLanguageText = '\n' + accumulatedResponse + '\n';
    edit.replace(
        document.uri,
        chosenRange,
        naturalLanguageText
    );
    workspace.applyEdit(edit);
}

function getNaturalLanguageAndCodeRegionText(
    document: TextDocument,
    naturalLanguageRange: BetterFoldingRange,
    codeRange: BetterFoldingRange
): string {
    return document.getText(new Range(naturalLanguageRange.start, 0, codeRange.end, document.lineAt(codeRange.end).text.length));
}

function getRegionText(
    document: TextDocument,
    foldingRange: BetterFoldingRange
): string {
    return document.getText(new Range(foldingRange.start, 0, foldingRange.end, document.lineAt(foldingRange.end).text.length));
}



async function parseChatResponse(
    chatResponse: LanguageModelChatResponse,
) {
    let accumulatedResponse: string = '';
    for await (const fragment of chatResponse.text) {
        accumulatedResponse += fragment;
    }
    return accumulatedResponse;
}


