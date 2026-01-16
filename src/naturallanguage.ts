
import { stringify } from 'querystring';
import * as vscode from 'vscode';

const DISPLAY_NATURAL_LANGUAGE_PROMPT = 
`
# Identity

You are a translator who would translate given code into into natural language text and vice versa

# Instructions

* Summarize selected code in more than five points
`;

export const foldDisposable = vscode.commands.registerTextEditorCommand('code-tutor.fold',
    async (textEditor: vscode.TextEditor) =>{
        const foldingRegions = getFoldingRegions(textEditor);
        let [model] = await vscode.lm.selectChatModels({
            vendor: 'copilot',
            family: 'gpt-4o'
        });
        let naturalLanguageText: string[] = [];
        for(let i = 0; i < foldingRegions.length; i++){
            const messages = [
                vscode.LanguageModelChatMessage.User(DISPLAY_NATURAL_LANGUAGE_PROMPT),
                vscode.LanguageModelChatMessage.User(getText(foldingRegions[i]))
            ];
            let returnedText: string = '';
            if (model){
                let chatResponse = await model.sendRequest(
                messages,
                {},
                new vscode.CancellationTokenSource().token
                );
                returnedText = await parseChatResponse1(chatResponse);
            }
            naturalLanguageText.push(returnedText);
            console.log(returnedText);
        }
        writeNaturalLanguage(textEditor, naturalLanguageText, foldingRegions);
    }
);
  


async function parseChatResponse1(
  chatResponse: vscode.LanguageModelChatResponse,
) {
  let accumulatedResponse:string = '';

  for await (const fragment of chatResponse.text) {
    accumulatedResponse += fragment;    
  }
  return accumulatedResponse;
}

function getFoldingRegions(textEditor: vscode.TextEditor) :{region :{line: number, text: string}[], firstLine: number, lastLine: number}[] {
  let lineCount = textEditor.document.lineCount;
  let foldingRegions:{region :{line: number, text: string}[], firstLine: number, lastLine: number}[] = [];
  let foldingRegion:{region :{line: number, text: string}[], firstLine: number, lastLine: number} = {region :[], firstLine: 0, lastLine: 0};
  let inFoldedRegion = false;
  for (let currentLine = 0; currentLine < lineCount; currentLine++) {
    let lineText = textEditor.document.lineAt(currentLine).text;
    if(/#region/.test(lineText)) {
      inFoldedRegion = true;
      foldingRegion = {region :[], firstLine: currentLine, lastLine: 0};

    }else if(/#endregion/.test(lineText) && inFoldedRegion) {
      inFoldedRegion = false;
      foldingRegion.lastLine = currentLine;
      foldingRegions.push(foldingRegion);
    }else if(inFoldedRegion) {
      foldingRegion.region.push({line: currentLine + 1, text: textEditor.document.lineAt(currentLine).text});
     // foldingRegions[foldingRegions.length - 1].push(`${currentLine + 1}: ${textEditor.document.lineAt(currentLine).text} \n`);
    }
  }

  for (let foldingRegion of foldingRegions) {
    console.log(foldingRegion);
    console.log(getText(foldingRegion));
  }
  console.log(`Total lines in document: ${lineCount}`);
  return foldingRegions;
}

function getText(foldingRegion: {region :{line: number, text: string}[], firstLine: number, lastLine: number}){
  let returnText = '';
  for(let i = 0; i < foldingRegion.region.length; i++){
    returnText += foldingRegion.region[i].text + '\n';
  }
  return returnText;
}

function writeNaturalLanguage(textEditor: vscode.TextEditor, naturalLanguageTexts: string[] , foldedRegions:{region :{line: number, text: string}[], firstLine: number, lastLine: number}[]){
   textEditor.edit(
    editBuilder =>
    {
      let jsonStructures :  { firstLine: number, lastLine: number, code: string, naturalLanguage: string, isCodeOpened: number }[] = [];
      for(let i = 0; i < foldedRegions.length; i++){
       
        jsonStructures.push({
          firstLine: foldedRegions[i].firstLine,
          lastLine: foldedRegions[i].lastLine,
          code: getText(foldedRegions[i]),
          naturalLanguage: naturalLanguageTexts[i],
          isCodeOpened: 1
        });

      
      }
      let insertedText = 'naturalLanguagesOutline = ' + JSON.stringify(jsonStructures, null, 2);
      let naturalLPosition = new vscode.Position(textEditor.document.lineCount + 1,0);
      editBuilder.insert(naturalLPosition, insertedText);
    }
  );
}



function parseCodeWithNaturalLanguage(textEditor: vscode.TextEditor): {code: string, naturalLanguage: string}[]{
  let lineCount = textEditor.document.lineCount;
  let codeFragments :{code: string, naturalLanguage: string}[] = [];

  let codeFragment :{code: string, naturalLanguage: string} = {code: '', naturalLanguage: ''};
  let codeLines: string = '';
  let NLlines: string = '';

  
  let inCodeRegion: boolean = false;
  let inNLRegion: boolean = false;
  for (let currentLine = 0; currentLine < lineCount; currentLine++) {
    let lineText = textEditor.document.lineAt(currentLine).text;
    if(/#region/.test(lineText)) {
      codeFragment = {code: '', naturalLanguage: ''};
      codeLines = '';
      inCodeRegion = true;
      
    }else if(/#endregion/.test(lineText) && inCodeRegion) {
      inCodeRegion = false;
      codeFragment.code = codeLines;

    }else if(inCodeRegion) {
      codeLines += lineText + '\n';
    }
    if(/#NLregion/.test(lineText)) {
      NLlines = '';
      inNLRegion = true;
      
    }else if(/#NLendregion/.test(lineText) && inNLRegion) {
      inNLRegion = false;
      codeFragment.naturalLanguage = NLlines;
      codeFragments.push(codeFragment);

    }else if(inNLRegion) {
      NLlines += lineText + '\n';
    }
  }

  return codeFragments;
}



