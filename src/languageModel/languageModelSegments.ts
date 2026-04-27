import { LanguageModelAccessInformation, workspace, window, WorkspaceEdit, LanguageModelChatMessage, LanguageModelChatResponse, lm, TextDocument, CancellationTokenSource, Range, Position, TextEditor, commands, TextEditorRevealType, LanguageModelError, LanguageModelChatMessageRole } from 'vscode';
import { GENERATE_CODE, GENERATE_NATURAL_LANGUAGE, UPDATE_CODE, UPDATE_NATURAL_LANGUAGE } from './languageModelPrompts';
import * as config from "../configuration";
import { BetterFoldingRange, LanguageTranslation } from '../types';
import { getPrefixBeforeFirstRealCharInNextNonEmptyLine } from '../utils/functions/utils';
import { getRegionTokens } from '../languageTokens/languageRegionToken';
import { getCommentBlockTokens } from '../languageTokens/languageCommentBlockToken';


const languageModel = config.getConfiguredLanguageModel();

export async function generateLanguageResponse(
    document: TextDocument,
    translation: LanguageTranslation,
    useCase: 'genNL' | 'updateNL' | 'genCode' | 'updateCode'
) {
    const [languageModelInstruction, languageModelPrompt] = getLanguagePrompt(document, translation, useCase);
    if (languageModelInstruction === undefined || languageModelPrompt === undefined) {
        return;
    }
    try {
        let [model] = await lm.selectChatModels({
            vendor: 'copilot',
            family: languageModel
        });

        const messages = [
            LanguageModelChatMessage.User(languageModelInstruction),
            LanguageModelChatMessage.User(document.languageId),
            LanguageModelChatMessage.User(languageModelPrompt)
        ];
        if (!model) {
            window.showErrorMessage('Language model wasn`t found.');
            return;
        }
        const chatResponse = await model.sendRequest(
            messages,
            {},
            new CancellationTokenSource().token
        );
        switch (useCase) {
            case 'genNL':
                await addNewNaturalLanguageIntoDoc(document, chatResponse, translation.codeFolding);
                break;
            case 'genCode':
                await addNewCodeIntoDoc(document, chatResponse, translation.naturalLanguageFolding);
                break;
            default:
                await rewriteDocWithLanguageResponse(document, chatResponse, translation.naturalLanguageFolding, translation.codeFolding, useCase);
                break;
        }
    } catch (err) {
        if (err instanceof LanguageModelError) {
            if (err.code === 'Blocked') {
                window.showErrorMessage(
                    `No access for language model:\n${String(err)}`
                );
                return;
            }
            if (err.code === 'NoPermissions') {
                window.showErrorMessage(
                    `No permission for language model:\n + ${String(err)}`
                );
                return;
            }
            if (err.code === 'NotFound') {
                window.showErrorMessage(
                    `Requested language model not available or does not exist:\n + ${String(err)}`
                );
                return;
            }
        }
        window.showErrorMessage(`Unexpected error: ${String(err)}`);
    }

}

function getLanguagePrompt(
    document: TextDocument,
    translation: LanguageTranslation,
    useCase: 'genNL' | 'updateNL' | 'genCode' | 'updateCode'
): [string | undefined, string | undefined] {
    switch (useCase) {
        case 'genNL':
            if (translation.codeFolding === undefined) {
                return [undefined, undefined];
            }
            return [
                GENERATE_NATURAL_LANGUAGE,
                getRegionText(document, translation.codeFolding)
            ];

        case 'updateNL':
            if (translation.naturalLanguageFolding === undefined || translation.codeFolding === undefined) {
                return [undefined, undefined];
            }
            return [
                UPDATE_NATURAL_LANGUAGE,
                getNaturalLanguageAndCodeRegionText(document, translation.naturalLanguageFolding, translation.codeFolding)
            ];

        case 'genCode':
            if (translation.naturalLanguageFolding === undefined) {
                return [undefined, undefined];
            }
            return [
                GENERATE_CODE,
                getRegionText(document, translation.naturalLanguageFolding)
            ];
        case 'updateCode':
            if (translation.naturalLanguageFolding === undefined || translation.codeFolding === undefined) {
                return [undefined, undefined];
            }
            return [
                UPDATE_CODE,
                getNaturalLanguageAndCodeRegionText(document, translation.naturalLanguageFolding, translation.codeFolding)
            ];
    }
}

async function addNewNaturalLanguageIntoDoc(
    document: TextDocument,
    response: LanguageModelChatResponse,
    codeRange: BetterFoldingRange | undefined
) {
    if (codeRange === undefined) {
        return;
    }
    const edit = new WorkspaceEdit();
    let accumulatedResponse = await parseChatResponse(response);
    const commentTokens = getCommentBlockTokens(document);
    const lineComment = document.languageId === 'python' ? commentTokens.lineComment + ' ' : '';


    const indent = getPrefixBeforeFirstRealCharInNextNonEmptyLine(document, codeRange.start);
    accumulatedResponse = accumulatedResponse.split('\n').map(line => indent + lineComment + line).join('\n');

    edit.insert(
        document.uri,
        new Position(codeRange.start, 0),
        indent + commentTokens.start + '\n' + accumulatedResponse + '\n' + indent + commentTokens.end + '\n'
    );
    await workspace.applyEdit(edit);
}

async function addNewCodeIntoDoc(
    document: TextDocument,
    response: LanguageModelChatResponse,
    naturalLanguageRange: BetterFoldingRange | undefined
) {
    if (naturalLanguageRange === undefined) {
        return;
    }
    const regionTokes = getRegionTokens(document);
    let accumulatedResponse = await parseChatResponse(response);

    const indent = getPrefixBeforeFirstRealCharInNextNonEmptyLine(document, naturalLanguageRange.start);
    accumulatedResponse = accumulatedResponse.split('\n').map(line => indent + line).join('\n');

    const edit = new WorkspaceEdit();

    edit.insert(
        document.uri,
        new Position(naturalLanguageRange.end, document.lineAt(naturalLanguageRange.end).text.length),
        '\n'
    );
    edit.insert(
        document.uri,
        new Position(naturalLanguageRange.end + 1, 0),
        indent + regionTokes.start + '\n' + accumulatedResponse + '\n' + indent + regionTokes.end + '\n'
    );

    edit.delete(
        document.uri,
        new Range(naturalLanguageRange.end, document.lineAt(naturalLanguageRange.end).text.length, naturalLanguageRange.end + 1, 0)
    );
    await workspace.applyEdit(edit);
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
    let accumulatedResponse = await parseChatResponse(response);
    const commentTokens = getCommentBlockTokens(document);
    const lineComment = document.languageId === 'python' && useCase === 'updateNL' ? commentTokens.lineComment + ' ' : '';

    const indent = getPrefixBeforeFirstRealCharInNextNonEmptyLine(document, codeRange.start + 1);

    if (useCase === 'updateNL') {
        accumulatedResponse = accumulatedResponse.split('\n').map(line => indent + lineComment + line).join('\n');
    }

    if (accumulatedResponse === "") {
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

    edit.replace(
        document.uri,
        chosenRange,
        '\n' + accumulatedResponse + '\n'
    );
    await workspace.applyEdit(edit);
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


