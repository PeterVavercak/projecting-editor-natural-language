# Projecting Editor Using Large Language Model

Extension to generate and display natural language description from source code using language model generation and vice versa.

### ⚠️ Warning

This extension requires GitHub Copilot to function properly.

## Projecting text

Shows natural language region and hides code language region when folding source code or unfolding natural language and vice versa.

![Projecting text](/resources/README/projecting-code-explanation.gif)

- Source Code region is marked by #region/#endregion.
- Natural Language region is marked #NaturalLanguage/#EndNaturalLanguage and uses comments
or comment block for it´s content.



Natural language region would be right above its complementary source code region.

## Local generation

Generation for individual region

### Natural Language Generation

Generates new natural language region from source code region when source code region is closed.

![Generating Natural Language Region](/resources/README/natural-language-generation.gif)

### Code Language Generation

Generates new source code region from natural language region when natural language region is closed.

![Generating Code Language Region](/resources/README/code-language-generation.gif)

### Update Natural Language

Updates natural language region according current version of source code region when source code region is closed and complementary natural language region already exists.

![Update Natural Language Region](/resources/README/updating-natural-language.gif)

### Update Source Code

Updates source code region according current version of natural language region when natural language region is closed and complementary source code region already exists.

![Update Code Language Region](/resources/README/updating-code-language.gif)

### Point out errors

Points out errors in source code inside natural language.

![Generate Code Language ERROR](/resources/README/generate-code-error.gif)

## Global Generation

Global generation according to currently opened text Document

### Global generation of natural language

Generates natural language for every source code region marked by #region/#endregion in currently opened text document by pressing button.

![Global Generate Natural Language](/resources/README/global-generate-natural-language.gif)

### Global generation of source code

Generates source code for every natural language region marked by #NaturalLanguage/#EndNaturalLanguage in currently opened text document by pressing button.

![Global Generate Code Language](/resources/README/global-generate-code-language.gif)

### Generation of regions

Clear Text Document of natural language regions and #region/#endregion markers divides source code into logical segment marked by #region/#endregion.

![Global Generate Regions](/resources/README/global-generate-regions.gif)

## Decoration

Option to have folded region projecting by replacement text

If no region name exists decoration for folded text is "Source Code"/"Natural Language".

![Unnamed Decoration](/resources/README/unnamed-decoration.gif)

If region name exists decoration name is that name.

![Named decoration](/resources/README/named-decoration.gif)

### Reset Decoration

Can reset glitched decoration by command `Reset Decoration`. Command bar can be opened by pressing `Ctrl + Shift + P`.

![Reset Decoration](/resources/README/reset-decorations.gif)

## AutoCompletion

Auto completion of code language region and natural language region.

![Autocompletion](/resources/README/autoompletion.gif)