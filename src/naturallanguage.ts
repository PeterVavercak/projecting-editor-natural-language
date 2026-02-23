
import { stringify } from 'querystring';
import * as vscode from 'vscode';
import { parseText, writeNaturalLanguage } from './Parser';
import { GET_ALL_CODES, GET_ALL_NL } from './LanguageModelPrompts';

const DISPLAY_NATURAL_LANGUAGE_PROMPT =
    `
# Identity

You are a translator who would translate given code into into natural language text and vice versa

# Instructions

* Explain code in one line

`;

const GENERATE_CODE =
    `
# Identity

You are a translator who generates code in python based on given input in form of natural language

# Instructions


* Generate code as accurate as possible based on given input
* Generate code in python
* Don't generate any comment to code.
* If code doesn't have new Line operator at the end add it.
* Return Code as text with only with separated lines
`;

const UPDATE_CODE_BASED_ON_NATURAL_LANGUAGE =
    `
# Identity

You are a translator who would update natural language description with provided code and 

# Instructions

* If code fits natural language text. Keep it as it is.
* Do as minimal changes to code as possible based on natural language description
* If natural language text is completely different from the code provided, then you can generate completely different code
* If it is new code only return code without any additional information or comments
* If code doesn't have new Line operator at the end add it.
* Return Code as text with only with separated lines
`;




export async function updateDoc(
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
                foldRegion.code = await generateCode(model, foldRegion);
            } else if (foldRegion.naturalLanguage === '') {
                foldRegion.naturalLanguage = await generateNaturalLanguage(model, foldRegion);
            } else {
                //check and update
            }
        } else {
            if (found.code !== foldRegion.code && found.naturalLanguage !== foldRegion.naturalLanguage) {
                // update Natural Language
            } else if (found.code !== foldRegion.code) {
                console.log("update NL");
                foldRegion.naturalLanguage = await updateNaturalLanguage(model, foldRegion, found);
            } else if (found.naturalLanguage !== foldRegion.naturalLanguage) {
                // update Code
            } else if (foldRegion.code === '' && foldRegion.naturalLanguage === '') {
                // do nothing
            } else if (foldRegion.code === '') {
                foldRegion.code = await generateCode(model, foldRegion);
            } else if (foldRegion.naturalLanguage === '') {
                foldRegion.naturalLanguage = await generateNaturalLanguage(model, foldRegion);
            } else {
                //check and update
            }
        }

    }

}


export async function writeAllNL(documentLines: string, document: vscode.TextDocument) {

    let [model] = await vscode.lm.selectChatModels({
        vendor: 'copilot',
        family: 'gpt-4o'
    });
    const messages = [
        vscode.LanguageModelChatMessage.User(GET_ALL_NL),
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
        vscode.LanguageModelChatMessage.User(GET_ALL_CODES),
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


export async function writeNL(
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
                // do nothing
            } else if (foldRegion.naturalLanguage === '') {
                foldRegion.naturalLanguage = await generateNaturalLanguage(model, foldRegion);
            } else {
                //check and update
            }
        } else {
            if (found.code !== foldRegion.code && found.naturalLanguage !== foldRegion.naturalLanguage) {
                // update Natural Language
            } else if (found.code !== foldRegion.code) {
                console.log("update NL");
                foldRegion.naturalLanguage = await updateNaturalLanguage(model, foldRegion, found);
            } else if (found.naturalLanguage !== foldRegion.naturalLanguage) {
                // do nothing
            } else if (foldRegion.code === '' && foldRegion.naturalLanguage === '') {
                // do nothing
            } else if (foldRegion.code === '') {
                // do nothing
            } else if (foldRegion.naturalLanguage === '') {
                foldRegion.naturalLanguage = await generateNaturalLanguage(model, foldRegion);
            } else {
                //check and update
            }
        }

    }

}


async function generateNaturalLanguage(
    model: vscode.LanguageModelChat,
    currentRegion: { firstLine: number, lastLine: number, code: string, naturalLanguage: string, id: number }
): Promise<string> {
    const messages = [
        vscode.LanguageModelChatMessage.User(DISPLAY_NATURAL_LANGUAGE_PROMPT),
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

const UPDATE_NATURAL_LANGUAGE =
    `
# Identity

You are a translator who would update given natural language description based on updated code written in python

# Instructions

* First comes previous version of code made in python
* Second comes description of the previous code in natural language
* Third comes new version of code made in python
* Check how the previous version of the code is translated to its natural language
* Create new natural language description based on new version of the code
* Create new version of the natural language so it would fit old connection between natural language
* If old natural language description fits new version of the code, return the old natural language description
* Do as minimal change to new natural language description as possible so it would fit the new version of the code
* If the new version of code is completely different old natural language description, generate completely new natural language description for new version of code
* If old natural language description does't fit old version of the code, generate completely new version of the natural language description for the version of the code
* Newly generated code should fit into one line
`;



async function updateNaturalLanguage(
    model: vscode.LanguageModelChat,
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

export async function generateCode(
    model: vscode.LanguageModelChat,
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
    }
    return returnedText;
}

async function parseChatResponse(
    chatResponse: vscode.LanguageModelChatResponse,
) {
    let accumulatedResponse: string = '';

    for await (const fragment of chatResponse.text) {
        accumulatedResponse += fragment;
    }
    return accumulatedResponse;
}






