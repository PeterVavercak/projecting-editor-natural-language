
import { CancellationTokenSource, LanguageModelChatMessage, LanguageModelChatResponse, lm, Position, TextDocument, WorkspaceEdit, Range, workspace } from 'vscode';
import * as config from "../configuration";
import { getRegionTokens } from '../languageTokens/languageRegionTokens';
import { getDocumentLines, getPrefixBeforeFirstRealCharInNextNonEmptyLine } from '../utils/classes/functions/utils';
import { getCommentBlockTokens } from '../languageTokens/languageCommentBlockToken';
import { GENERATE_ALL_NATURAL_LANGUAGE, GENERATE_ALL_CODES, GENERATE_REGIONS } from './languageModelPrompts';

const languageModel = config.getConfiguredLanguageModel();

export async function generateStructuredOutputResponse(document: TextDocument, useCase: 'genNL' | 'genCode' | 'genRegion') {
    const documentLines = getDocumentLines(document);
    let languageInstruction;
    switch (useCase) {
        case 'genNL':
            languageInstruction = GENERATE_ALL_NATURAL_LANGUAGE;
            break;
        case 'genCode':
            languageInstruction = GENERATE_ALL_CODES;
            break;
        case 'genRegion':
            languageInstruction = GENERATE_REGIONS;
            break;
    }

    let [model] = await lm.selectChatModels({
        vendor: 'copilot',
        family: languageModel
    });
    const messages = [
        LanguageModelChatMessage.User(languageInstruction),
        LanguageModelChatMessage.User(document.languageId),
        LanguageModelChatMessage.User(documentLines)
    ];
    if (model) {
        let chatResponse = await model.sendRequest(
            messages,
            {},
            new CancellationTokenSource().token
        );
        if (useCase === 'genNL') {
            await writeNaturalLanguages(chatResponse, document);
            //await logOutputs(chatResponse, document);
        } else if (useCase === 'genCode') {
            await writeCodes(chatResponse, document);
            //await logOutputs(chatResponse, document);
        } else {
            await divideDocument(chatResponse, document);
            //await logOutputs(chatResponse, document);
        }
    }

}

async function writeNaturalLanguages(
    response: LanguageModelChatResponse,
    document: TextDocument
) {
    let accumulatedResponse = '';
    const edit = new WorkspaceEdit();
    const commentTokens = getCommentBlockTokens(document);


    for await (const fragment of response.text) {
        accumulatedResponse += fragment;

        // if the fragment is a }, we can try to parse the whole line
        if (fragment.includes('}')) {

            try {
                const annotation = JSON.parse(accumulatedResponse);
                console.log(annotation);
                if ("line" in annotation) {
                    const indent = getPrefixBeforeFirstRealCharInNextNonEmptyLine(document, annotation.line);
                    let nlText: string = annotation.text;
                    nlText = nlText.split('\n').map(line => indent + line).join('\n');

                    edit.insert(
                        document.uri,
                        new Position(annotation.line, 0),
                        indent + commentTokens.start + '\n' + nlText + '\n' + indent + commentTokens.end + '\n'
                    );
                }
                else if ("firstLine" in annotation && "lastLine" in annotation) {
                    const indent = getPrefixBeforeFirstRealCharInNextNonEmptyLine(document, annotation.lastLine + 1);
                    let nlText: string = annotation.text;
                    nlText = nlText.split('\n').map(line => indent + line).join('\n');
                    edit.replace(
                        document.uri,
                        new Range(annotation.firstLine, document.lineAt(annotation.firstLine).text.length, annotation.lastLine, 0),
                        '\n' + nlText + '\n'
                    );
                }
                accumulatedResponse = '';
            } catch (e) {
                console.log(e);
                // do nothing
            }
        }
    }
    workspace.applyEdit(edit);
}



async function writeCodes(
    response: LanguageModelChatResponse,
    document: TextDocument
) {
    let accumulatedResponse = '';
    const edit = new WorkspaceEdit();
    const regionTokes = getRegionTokens(document);

    for await (const fragment of response.text) {
        accumulatedResponse += fragment;

        // if the fragment is a }, we can try to parse the whole line
        if (fragment.includes('}')) {
            try {

                const annotation = JSON.parse(accumulatedResponse);

                //     console.log(annotation);
                if ("line" in annotation) {
                    const indentation = getPrefixBeforeFirstRealCharInNextNonEmptyLine(document, annotation.line);

                    edit.insert(
                        document.uri,
                        new Position(annotation.line, document.lineAt(annotation.line).text.length),
                        '\n' + indentation + regionTokes.start + '\n' + annotation.text + '\n' + indentation + regionTokes.end
                    );
                }
                else if ("firstLine" in annotation && "lastLine" in annotation) {
                    edit.replace(
                        document.uri,
                        new Range(annotation.firstLine, document.lineAt(annotation.firstLine).text.length, annotation.lastLine, 0),
                        '\n' + annotation.text + '\n'
                    );
                }

                // reset the accumulator for the next line
                accumulatedResponse = '';
            } catch (e) {
                console.log(e);
                // do nothing
            }
        }
    }
    workspace.applyEdit(edit);
}



async function divideDocument(
    response: LanguageModelChatResponse,
    document: TextDocument
) {
    const edit = new WorkspaceEdit();
    let accumulatedResponse = '';
    const regionTokes = getRegionTokens(document);
    for await (const fragment of response.text) {
        accumulatedResponse += fragment;

        // if the fragment is a }, we can try to parse the whole line
        if (fragment.includes('}')) {
            try {
                const annotation = JSON.parse(accumulatedResponse);
                const indentation = getPrefixBeforeFirstRealCharInNextNonEmptyLine(document, annotation.firstLine);
                edit.insert(
                    document.uri,
                    new Position(annotation.firstLine, 0),
                    indentation + regionTokes.start + '\n'
                );
                edit.insert(
                    document.uri,
                    new Position(annotation.lastLine, document.lineAt(annotation.lastLine).text.length),
                    '\n' + indentation + regionTokes.end
                );
            } catch (e) {
                console.log(e);
                // do nothing
            }

            accumulatedResponse = '';
        }

    }
    workspace.applyEdit(edit);

}

async function logOutputs(
    response: LanguageModelChatResponse,
    document: TextDocument
) {
    const edit = new WorkspaceEdit();
    let accumulatedResponse = '';
    let accumulatedResponse2 = '';
    for await (const fragment of response.text) {
        accumulatedResponse += fragment;
        accumulatedResponse2 += fragment;

        // if the fragment is a }, we can try to parse the whole line
        if (fragment.includes('}')) {
            try {
                const annotation = JSON.parse(accumulatedResponse);
                console.log(annotation);

            } catch (e) {
                console.log(e);
                // do nothing
            }

            console.log(accumulatedResponse);


            accumulatedResponse = '';
        }

    }
    edit.insert(document.uri,
        new Position(0, 0),
        accumulatedResponse2
    );
    workspace.applyEdit(edit);

}












