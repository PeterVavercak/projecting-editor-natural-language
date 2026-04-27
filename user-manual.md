# User Documentation

Extension allows to use large language model for generation of natural language text out of source code and vice versa, while user could switch between both of these explanations

## Projecting Editor for LLM

Extension available on webpage [Projecting Editor using Large Language Model](https://marketplace.visualstudio.com/items?itemName=PeterVaverk.projecting-editor-nl-code)

## Requirements

- [Visual Studio Code](https://code.visualstudio.com/)
- [Github Copilot Extension](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat)
- [GitHub Account](https://github.com/login)

## Installation

1. Open Visual Studio Code.
2. Make sure you have Github Account.
    - Sign to your account in Visual Studio Code IDE.(Accounts (Bottom left corner) -> Sign In)
2. Make sure you have have [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-cha) extension installed and activated.
    - Open Extension in left Bar(Ctrl + Shift + X)
    - Search GitHub Copilot Chat
    - Click Install
4. Github Copilot would not activated unless you have linked your GitHub Account to your IDE.
    - Click on Copilot icon in bottom right.
    - 
5. Download Extension [Projecting Editor using Large Language Model](https://marketplace.visualstudio.com/items?itemName=PeterVaverk.projecting-editor-nl-code)
    - Search Extension for Projecting Editor using LLM
    - Click Install.

##### In case of extnsion not working try to restart Visual Studio Code 

## Manual

### Source Code Region

Source code region is written in between #region/#endregion markers according to given language

Python, C#
```
#region
<source code>
#endregion
```

Java, JavaScript, TypeScript
```
//#region
<source code>
//#endregion 
```

C, C++
```
#pragma region
<source code>
#pragma endregion 
```


### Natural Language Region

Natural language region is written in between #NaturalLanguage/#EndNaturalLanguage markers inside comment block or inside comment sequence by language used

Python
```
#NaturalLanguage
# <natural language text>
#EndNaturalLanguage
```

Java, C#, JavaScript, TypeScript, C, C++
```
/*#NaturalLanguage
<natural language text>
#EndNaturalLanguage*/
```

### Folding region

Each source code region is assigned to its complementary natural language region. Natural language region is right above source code region. 

Each folding or unfolding region triggers unfolding or folding of complementary region.

Opened region has its content generated or updated based on content of closed region.

Switch between region by triggering folding/unfolding on one of the regions.

![Unfolded Natural Language](/resources/user-manual/natural-language-unfolded.png)
![Unfolded Source Code](/resources/user-manual/source-code-unfolded.png)

### Commands

Pick a command by pressing Ctrl + Shift + p.

Command under category Generation:
- Generate Natural Language - generates natural language regions for all source code region in opened text document file
- Generate Source Code - generates source code regions for all natural language regions in opened text document file
- Generate Regions - creates regions in opened text document file according to logical sections

Commands under category Projection:
- Show Natural Language Regions- Shows all natural language regions in upper nesting level and hides all source code regions.
- Show Source Code Regions - Shows all source code regions and hides all natural language regions regions.
- Show All Regions - Shows all natural language and source code regions.
- Hide All Regions - Hides all natural language and source code regions.
- Reset Decorations - Will remove all glitched decoration in text document.

### Decoration

When Decorations in setting are switched on, decorations will show in place of text of firtst line of folded region

Decoration that will show up:
- Natural Language/ Source Code when name is not defined

![Unnamed Decoration](/resources/user-manual/unnanmed-decoration.png)

- Name of region when name is defined

![Named Decoration](/resources/user-manual/named-decoration.png)

#### Commands in UI

![Command In UI](/resources/user-manual/commands-in-ui.png)

## Configuration

### Settings location

1. Find the extension in extension menu
2. Click on gear icon -> Settings

![Gear Icon](/resources/user-manual/configuration-options.png)

### Possible settings

#### Automatic folding

Switched on default. 
Allows to switch off automatic folding/unfolding of complementary region.

#### Automatic Translation

Switched on default
Allows to switch off automatic generation of complementary region on folding.

#### Language Model

GPT 4o picked on default.
Allows to choose language model used by the extension.

#### Show decoration

Switched off on default.
Allows to switch on to show decorations in place of folded regions.

