
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
        } else if (useCase === 'genCode') {
            await writeCodes(chatResponse, document);
        } else {
            await divideDocument(chatResponse, document);
        }
    }

}

async function writeNaturalLanguages(
    response: LanguageModelChatResponse,
    document: TextDocument
) {
    const edit = new WorkspaceEdit();
    const commentTokens = getCommentBlockTokens(document);

    for await (const obj of extractSequentialJsonObjects(response.text)) {
        if (typeof obj !== 'object' || obj === null) {
            continue;
        }
        if ("line" in obj) {
            const nlObject = obj as { line: number, text: string };
            const indent = getPrefixBeforeFirstRealCharInNextNonEmptyLine(document, nlObject.line);
            let nlText: string = nlObject.text;
            nlText = nlText.split('\n').map(line => indent + line).join('\n');

            edit.insert(
                document.uri,
                new Position(nlObject.line, 0),
                indent + commentTokens.start + '\n' + nlText + '\n' + indent + commentTokens.end + '\n'
            );
        } else if ("firstLine" in obj && "lastLine" in obj) {
            const nlObject = obj as { firstLine: number, lastLine: number, text: string };
            const indent = getPrefixBeforeFirstRealCharInNextNonEmptyLine(document, nlObject.lastLine + 1);
            let nlText: string = nlObject.text;
            nlText = nlText.split('\n').map(line => indent + line).join('\n');
            edit.replace(
                document.uri,
                new Range(nlObject.firstLine, document.lineAt(nlObject.firstLine).text.length, nlObject.lastLine, 0),
                '\n' + nlText + '\n'
            );

        }
    }
    await workspace.applyEdit(edit);
}



async function writeCodes(
    response: LanguageModelChatResponse,
    document: TextDocument
) {
    const edit = new WorkspaceEdit();
    const regionTokes = getRegionTokens(document);

    for await (const obj of extractSequentialJsonObjects(response.text)) {
        if (typeof obj !== 'object' || obj === null) {
            continue;
        }
        if ("line" in obj) {
            const codeObject = obj as { line: number, text: string };

            const indentation = getPrefixBeforeFirstRealCharInNextNonEmptyLine(document, codeObject.line);

            edit.insert(
                document.uri,
                new Position(codeObject.line, document.lineAt(codeObject.line).text.length),
                '\n' + indentation + regionTokes.start + '\n' + codeObject.text + '\n' + indentation + regionTokes.end
            );
        }
        else if ("firstLine" in obj && "lastLine" in obj) {
            const codeObject = obj as { firstLine: number, lastLine: number, text: string };

            edit.replace(
                document.uri,
                new Range(codeObject.firstLine, document.lineAt(codeObject.firstLine).text.length, codeObject.lastLine, 0),
                '\n' + codeObject.text + '\n'
            );
        }
    }
    await workspace.applyEdit(edit);
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
    await workspace.applyEdit(edit);

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
    await workspace.applyEdit(edit);

}

export async function* extractSequentialJsonObjects(
    stream: AsyncIterable<string>
): AsyncGenerator<unknown> {
    let buffer = '';
    let inString = false;
    let escaped = false;
    let braceDepth = 0;
    let started = false;

    for await (const fragment of stream) {
        for (const ch of fragment) {
            if (!started) {
                if (/\s/.test(ch)) {
                    continue;
                }
                if (ch !== '{') {
                    continue;
                }
                started = true;
                braceDepth = 1;
                buffer = '{';
                continue;
            }

            buffer += ch;

            if (escaped) {
                escaped = false;
                continue;
            }

            if (ch === '\\') {
                escaped = true;
                continue;
            }

            if (ch === '"') {
                inString = !inString;
                continue;
            }

            if (inString) {
                continue;
            }

            if (ch === '{') {
                braceDepth++;
            } else if (ch === '}') {
                braceDepth--;

                if (braceDepth === 0) {
                    try {
                        yield JSON.parse(buffer);
                    } catch (error) {
                        console.error('Invalid JSON object:', buffer, error);
                    }

                    buffer = '';
                    started = false;
                    inString = false;
                    escaped = false;
                }
            }
        }
    }
}











