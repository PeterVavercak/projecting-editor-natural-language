
import { stringify } from 'querystring';
import * as vscode from 'vscode';
import { parseText, writeNaturalLanguage } from './Parser';

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

const GET_ALL_NL = `
# Identity

You are generator which would get given content of text document and you generate NaTural Language outlines for each code in region

# Instructions

* There are individual regions marked by #region.
* You will generate Natural Language Outline which would translate code semantic in each marked region.
* Generated Natural Language Outline are written behind "#region" text.
* Generated Natural Language Outline should fit inside one line and be simple.
* If there is already Natural Language Outline for the region, do the following.
* If Natural Language Outline fits code in the region, ignore it.
* If Natural Language Outline doesn't describe code in the region at all, generate new completely new Natural Language Outline for that code.
* If Natural Language Outline somewhat accurately, generate new Natural Language Outline from the code with as little changes as possible from the old one, so it would fit the code more accurately. 
* If there isn't Natural Language Outline, just generate it.
* Generated Response should be in format: {"line": <position of natural language>, "text": <text of natural language>} for each natural language outline.

#Examples

<written text document id = "example1">
0: #region prints hello world
1: def encode_char(character: str) -> List[bool]:
2:     ascichar = ord(character)  # ASCII/Unicode code point
3:     bits = [False] * 8
4:     for i in range(7, -1, -1):
5:         bits[i] = (ascichar % 2) == 1
6:         ascichar //= 2
7:     return bits
8: #endregion
9: 
10: #region function to encode string into list of bytes
11: def encode_string(string: str) -> List[List[bool]]:
12:     s = string + "\x00"
13:     bytes_arr: List[List[bool]] = []
14:     for ch in s:
15:         bytes_arr.append(encode_char(ch))
16:     return bytes_arr
17: #endregion
18: 
19: #region
20: def bytes_to_blocks(cols: int, offset: int, rows: int, bytes_arr: List[List[bool]]) -> List[List[bool]]:
21:     blocks = [[False for _ in range(cols)] for _ in range(offset * 8)]
22: 
23:     for i in range(cols):
24:         for j in range(offset * 8):
25:             blocks[j][i] = False
26:             idx = i + cols * (j // 8)
27:             if idx < rows:
28:                 blocks[j][i] = bytes_arr[idx][j % 8]
29:     return blocks
30: #endregion
</written text document>




<assistant response id = "example1">
{ "line" : 0 , "text" : "Function to encode one character into one Byte (represented by list of Booleans)"}{ "line" : 19 , "text" : "Function to order list of bytes into offset number of blocks with cols number of bytes" }
</assistant response>



`;

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

const GET_ALL_CODES = `
# Identity

You are generator which would get given content of text document and you generate for each code in region Natural Language Outline 

# Instructions

* There are individual regions marked by #region and #endregion.
* You will generate code for each Natural Language Outline 
* Natural Language Outline are written behind "#region" text.
* If there is already Code for Natural Language Description, do the following.
* If code in the region fits Natural Language Outline, ignore it.
* If code in the region doesn't describe code in the region at all, generate new completely new Natural Language Outline for that code.
* If Natural Language Outline somewhat accurately, generate new Natural Language Outline from the code with as little changes as possible from the old one, so it would fit the code more accurately. 
* If there isn't Natural Language Outline, just generate it.
* Generated Response should be in format: {"line": <position of natural language>, "text": <text of natural language>} for each natural language outline.

#Examples

<written text document id = "example1">
0: #region prints hello world
1: def encode_char(character: str) -> List[bool]:
2:     ascichar = ord(character)  # ASCII/Unicode code point
3:     bits = [False] * 8
4:     for i in range(7, -1, -1):
5:         bits[i] = (ascichar % 2) == 1
6:         ascichar //= 2
7:     return bits
8: #endregion
9: 
10: #region function to encode string into list of bytes
11: def encode_string(string: str) -> List[List[bool]]:
12:     s = string + "\x00"
13:     bytes_arr: List[List[bool]] = []
14:     for ch in s:
15:         bytes_arr.append(encode_char(ch))
16:     return bytes_arr
17: #endregion
18: 
19: #region
20: def bytes_to_blocks(cols: int, offset: int, rows: int, bytes_arr: List[List[bool]]) -> List[List[bool]]:
21:     blocks = [[False for _ in range(cols)] for _ in range(offset * 8)]
22: 
23:     for i in range(cols):
24:         for j in range(offset * 8):
25:             blocks[j][i] = False
26:             idx = i + cols * (j // 8)
27:             if idx < rows:
28:                 blocks[j][i] = bytes_arr[idx][j % 8]
29:     return blocks
30: #endregion
</written text document>




<assistant response id = "example1">
{ "line" : 0 , "text" : "Function to encode one character into one Byte (represented by list of Booleans)"}{ "line" : 19 , "text" : "Function to order list of bytes into offset number of blocks with cols number of bytes" }
</assistant response>



`;

export async function writeAllCodes(documentLines: string, document: vscode.TextDocument) {

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






