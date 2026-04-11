# Projecting Editor Using Large Language Model

Extension to generate and display natural language description from code language using language model generation and vice versa.

    - generates code language out of natural language.
    - generates natural language out of code language.

## Projecting text

Shows natural language region and hides code language region when folding code language or unfolding natural language and vice versa.

![Projecting text](/docResources/projecting-code-explanation.gif)

Extension uses #region/#endregion markers for code language regions and #NaturalLanguage/#EndNaturalLanguage markers for natural language regions inside comment blocks.

Natural language region would be right above its complementary code language region.

## Local generation

Generation for individual region

### Natural Language Generation

Generates new natural language region from code language region when code language region is closed.

![Generating Natural Language Region](/docResources/natural-languge-generation.gif)

### Code Language Generation

Generates new code language region from natural language region when natural language region is closed.

![Generating Code Language Region](/docResources/code-language-generation.gif)

### Update Natural Language

Updates natural language region according current version of code language region when code language region is closed and complementary natural language region already exists.

![Update Natural Language Region](/docResources/updating-natural-language.gif)

### Update Code Language

Updates code language region according current version of natural language region when natural language region is closed and complementary code language region already exists.

![Update Code Language Region](/docResources/updating-code-language.gif)

### Point out errors

Points out errors in code language inside natural language.

![Generate Code Language ERROR](/docResources/generate-code-error.gif)

## Global Generation

Global generation according to currently opened text Document

### Global generation of natural language

Generates natural language for every code language region marked by #region/#endregion in currently opened text document by pressing button.

### Global generation of code language

Generates code language for every natural language region marked by #NaturalLanguage/#EndNaturalLanguage in currently opened text document by pressing button.

### Generation of regions

Clear Text Document of natural language regions and #region/#endregion markers divides code into logical segment marked by #region/#endregion.

## Decoration

Option to have folded region projecting by replacement text

If no region name exists decoration for folded text is "Code"/"Natural Language".

If region name exists decoration name is that name.

## AutoCompletion

Auto completion of code language region and natural language region.