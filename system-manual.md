# System documentation

## Run extension

* Install dependencies by typing into terminal `npm install`
* Press `F5` to open a new window with your extension loaded.
* Run your command from the command palette by pressing (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac).
* Set breakpoints in your code inside `src` directory to debug your extension.
* Find output from your extension in the debug console.
* `example/` - Potential folder used as main directory after launching extension.


## Structure

* `package.json` - This is the manifest file with declaration of metadata and command for the extension.
* `tsconfig.json` - Configures compiling of typescript files.
* `README.md` - Introduction page.
* `CHANGELOG.md`
* `LICENCE.md`

* `src` - Directory with source code.
* `snippets` - snippets for different programming language.
* `recourses`

## Source Code Files

##### Source Files Structure

```
src/
├── actions/
│   ├── complementaryFoldingAction.ts
│   └── globalFoldingAction.ts
├── decorators/
│   ├── betterFoldingDecorator.ts
│   └── foldingDecorator.ts
├── languageModel/
│   ├── languageModelPrompts.ts
│   ├── languageModelSegments.ts
│   └── languageModelTextDoc.ts
├── languageTokens/
│   ├── languageCommentBlockToken.ts
│   └── languageRegionToken.ts
├── providers/
│   ├── betterFoldingRangeProvider.ts
│   ├── nlRangesProvider.ts
│   ├── regionRangesProvider.ts
│   ├── snapshotProvider.ts
│   └── toolsProvider.ts
├── utils/
│   ├── classes/
│   │   ├── managers/
│   │   │   ├── actionMutex.ts
│   │   │   ├── foldedLinesManager.ts
│   │   │   └── foldManipulationManager.ts
│   │   ├── extendedMaps.ts
│   │   └── toolNode.ts
│   ├── functions/
│   │   └── utils.ts
│   └── variables.ts
├── commands.ts
├── configuration.ts
├── constants.ts
├── extension.ts
└── types.ts
``` 

`Extension.ts` is main for which program launches.

---

### `actions` folder

* Processes actions in the text editor

##### `complementaryFoldingAction.ts`

* Implements complementary folding and generation.
* Reaction to folding in the editor.

##### `globalFoldingActions`

* Implements commands for global folding.

---

### `decorators` folder

* Implements decorator in the editor.

##### `betterFoldingDecorator.ts`

* Abstract class for decorators
* Inheritors:
  * `foldingDecorator.ts`
    - Implements decorator for folding ranges.

---

### `languageModel` folder

* Related to language model work

##### `languageModelPrompts.ts`

* Texts with instruction for language model prompts.

##### `languageModelSegment.ts`

* Implements generation of language model response for selected segment.
* Generates plain text.

##### `languageModelTextDoc.ts`

* Implements generation of language model response for whole content of text document.
* Generates structured output.

---

### `languageTokens` folder

* Tokens defined for different Programming Language.

##### `LanguageCommentBlockToken.ts`

##### `LanguageRegionToken.ts`

---

### `providers` folder

* work with VS Code API

##### `betterFoldingRangeProvider.ts`

* Provides and updates folding ranges.
* inheritors:
  * `nlRangesProvider.ts`
    - Finds natural language ranges. 
  * `regionRangesProvider.ts`
    - Finds source code range

##### `snapshotProvider.ts`
* Provides snapshots for text documents
* Stores their contents

##### `toolProvider.ts`

* Provides tree items for UI.

---

### `utils` folder

##### `variables.ts`

* Global variables used across the extension.


##### `functions/utils.ts`

* Util function used across the source code.

#### `classes` folder

* Classes used across the source code.

##### `extendedMap.ts`

* Extends map data type.

##### `toolNode.ts`

* Implements node for tree view UI.

#### `managers` folder

* Managers to take care of the system

##### `actionMutex.ts`

* mutex class

##### `foldedLinesManager.ts`

* Singleton class.
* Finds whether ranges are folded in tex editor or not.

##### `foldManipulationManager`

* Singleton class.
* Finds which folding was used last.

---

##### `commands.ts`

##### `configuration.ts`

##### `constants.ts`

##### `extension.ts`

* Main file of source code.
* Function activate() for running the extension.
* Function deactivate for deactivating extension.

##### `types.ts`

* Defined Types used in across the source code.

## Run tests

* Install the [Extension Test Runner](https://marketplace.visualstudio.com/items?itemName=ms-vscode.extension-test-runner)
* Run the "watch" task via the **Tasks: Run Task** command. Make sure this is running, or tests might not be discovered.
* Open the Testing view from the activity bar and click the Run Test" button, or use the hotkey `Ctrl/Cmd + ; A`
* See the output of the test result in the Test Results view.
* Make changes to `src/test/extension.test.ts` or create new test files inside the `test` folder.
  * The provided test runner will only consider files matching the name pattern `**.test.ts`.
  * You can create folders inside the `test` folder to structure your tests any way you want.

