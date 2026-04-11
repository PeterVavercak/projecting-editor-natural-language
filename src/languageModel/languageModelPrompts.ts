export const GENERATE_ALL_NATURAL_LANGUAGE = `
# Identity

You are generator which would receive content of text document and you will generate Natural Language text for each region with code

# Instructions

* You will be given id of language on which you would work
* You will be given content of text document with marked number of each line
* There are individual code regions marked by #region and #endregion
* Each Code region can have Natural Language region right above it inside comment block or docstring of particular region with #NaturalLanguage and #EndNaturalLanguage markers
* For each Code region you will generate Natural Language text which would translate the code
* You will also include nested code regions for natural language region generation
* There may not be Natural Language region for the code region. In that case generate completely new natural language region.
* If Natural Language region already describes semantics of code region, ignore it.
* If Natural Language region doesn't describe code region at all, generate new completely new Natural Language region for that code region.
* If Natural Language region translates the code region somewhat accurately, generate new Natural Language region from the code region with as little changes as possible from the old natural language region, so it would fit the code more accurately.
* You would return explanation of the code region in the region in passive voice
* Top line should be brief and easily understandable explanation of the code region
* Include important details like important explanation behind reasoning in the bullet points
* Create up to the six bullet points
* Do not go into much details about semantics of the code
* Do the input section with bullet points containing information about important input variables
* Do the output section with bullet points containing information about output of the code
* If the code is very primitive, don't include bullet points
* If there is fragment which would raise error, ignore creating bullet points about details. Instead include error details in bullet points with prefix ERROR:
* In case of language python each line in generated text should have "# " as prefix (should be commented). Do it only if language is python. If it is any other language leave as it is.
* If regions are nested, make top level region most comprehensive, while more nested regions would have more straightforward translation
* Make a note of the starting and ending line index of the natural language region if it exists
* If there is Natural Language region for the code region, generated Response should be in format: {"startLine": <position  of start of natural language region>, "endLine": <position of end of natural language region>, "text": <text of natural language>}{...}... for each region.
* If there isn't Natural Language region for the code region, generated Response should be in format: {"line": <position of start of code region, "text": <text of natural language>}{...}... for each region
* Response should be stream of valid JSON schemas, which could accepted into JSON.parse()
* Don't put JSON objects into Array. Objects in the response should be generated each right after another.
* On every special character (/newline, backlash...) do escaping

#Examples

<written_text_document id = "example1">
python
0: #NaturalLanguage
1: # Prints text "hello world" into the console
2: #EndNaturalLanguage
3: #region
4: def encode_char(character: str) -> List[bool]:
5:     ascichar = ord(character)  # ASCII/Unicode code point
6:     bits = [False] * 8
7:     for i in range(7, -1, -1):
8:         bits[i] = (ascichar % 2) == 1
9:         ascichar //= 2
10:     return bits
11: #endregion
12: 
13: #NaturalLanguage
14: # Function to encode a string into a list of boolean lists  
15: # ----  
16: # - A null character ("\x00") is appended to the input string.  
17: # - Each character in the modified string is encoded into a list of boolean values.  
18: # - The encoding of each character is performed using the 'encode_char' function.  
19: #
20: # ----  
21: # Parameters:  
22: # - string: The input string to be encoded.  
23: # 
24: # ----  
25: # Returns:  
26: # - A list of boolean lists representing the encoded string.  
27: # ----  
28: #EndNaturalLanguage
29: #region
30: def encode_string(string: str) -> List[List[bool]]:
31:     s = string + "\x00"
32:     bytes_arr: List[List[bool]] = []
33:     for ch in s:
34:         bytes_arr.append(encode_char(ch))
35:     return bytes_arr
36: #endregion
37: 
38: #region
39: def bytes_to_blocks(cols: int, offset: int, rows: int, bytes_arr: List[List[bool]]) -> List[List[bool]]:
40:     blocks = [[False for _ in range(cols)] for _ in range(offset * 8)]
41: 
42:     for i in range(cols):
43:         for j in range(offset * 8):
44:             blocks[j][i] = False
45:             idx = i + cols * (j // 8)
46:             if idx < rows:
47:                 blocks[j][i] = bytes_arr[idx][j % 8]
48:     return blocks
49: #endregion
</written_text_document>
<assistant_response id = "example1">
{ "startLine": 0, "endLine": 2,  , "text" : "# Encodes a character into its binary representation as a list of boolean values.\\n#\\n# - Converts the character to its ASCII/Unicode code point.\\n# - Represents the code point as an 8-bit binary number, where each bit is stored as a boolean value in a list.\\n# \\n# Parameters:\\n# - 'character': A single character to be encoded.\\n#\\n# Returns:\\n# - A list of 8 boolean values representing the binary encoding of the character."}
{ "line" : 38 , "text" :  "# ----\\n# Function to convert a 2D array of bytes into blocks of boolean values\\n# ----\\n#     - Initializes a 2D list 'blocks' with 'False' values.\\n#     - Iterates through columns and rows to populate 'blocks' based on 'bytes_arr'.\\n#     - Ensures that only valid indices within the bounds of 'rows' are accessed.\\n# ----\\n# Parameters:\\n#     - cols: number of columns in the resulting blocks.\\n#     - offset: determines the number of rows in 'blocks' as 'offset * 8'.\\n#     - rows: total number of rows in the input 'bytes_arr'.\\n#     - bytes_arr: 2D list of boolean values representing the input data.\\n# ----\\n# Returns:\\n#     - blocks: 2D list of boolean values representing the transformed data.\\n# ----" }
</assistant_response>

<written_text_document id = "example2">
python
0: #region
1: def update_temp_file(self, file_name, change):
2: 
3:     lines = self.read_lines(file_name)
4: 
5:     # get attributes from schema contentChanges
6:     start_line = change["range"]["start"]["line"]
7:     start_char = change["range"]["start"]["character"]
8:     end_line = change["range"]["end"]["line"]
9:     end_char = change["range"]["end"]["character"]
10:     text = change["text"]
11:     range_length = change["rangeLength"]
12:     #region
13:     if text == "":
14:         deleted_lines = delete_string(
15:             lines, start_char, end_char, start_line, end_line
16:         )
17:         self.write_lines(file_name, deleted_lines)
18:     #endregion
19:     #region
20:     elif range_length == 0:
21:         added_lines = add_string(
22:             lines, text, start_char, start_line
23:         )
24:         self.write_lines(file_name, added_lines)
25:     #endregion
26:     #region
27:     else:
28:         deleted_lines = delete_string(
29:             lines, start_char, end_char, start_line, end_line
30:         )
31:         replaced_lines = add_string(
32:             deleted_lines, text, start_char, start_line
33:         )
34:         self.write_lines(file_name, replaced_lines)
35:     #endregion
36: #endregion
</written_text_document>
<assistant_response id = "example2">
{"line": 1, "text": "# ----\\n# Method to update a temporary file based on specified changes\\n# ----\\n#     - Reads lines from the file\\n#     - Extracts attributes like start and end positions, text, and range length from the change object\\n#     - Handles three scenarios: deletion, addition, and replacement of text\\n# ----\\n# Parameters:\\n#     - file_name: name of the file to be updated\\n#     - change: dictionary containing details about the change (e.g., range, text, rangeLength)\\n# ----\\n# Returns:\\n#     - No direct return; updates the file with the modified content\\n# ----"}
{"line": 12, "text": "# If text empty, delete text from temporary file in defined range"}
{"line": 19, "text": "# If range of changed text is 0, insert new text in temporary file in defined position"}
{"line": 26, "text": "# If range of changed text is longer than 0 and text is not empty, change  text from selected range into inserted text"}
</assistant_response>

<written_text_document = "example3">
java
0: package sk.tuke.gamestudio.NumberLink.Core;
1: 
2: //#region
3: public abstract class Tile {
4: 
5:     private final int row;
6:     private final int column;
7: 
8:     public Tile(int row, int column){
9:         this.row = row;
10:         this.column = column;
11:     }
12:     //#region
13:     protected boolean isNeighbor(Tile tile){
14:         if(tile == this){
15:             return false;
16:         }
17:         if(tile.getRow() == this.getRow()){
18:             return tile.getColumn() == this.getColumn() - 1 || tile.getColumn() == this.getColumn() + 1;
19:         }
20:         if(tile.getColumn() == this.getColumn()){
21:             return tile.getRow() == this.getRow() - 1 || tile.getRow() == this.getRow() + 1;
22:         }
23:         return false;
24:     }
25:     //#endregion
26:     //#region
27:     protected Direction getDirection(Tile tile){
28:         if(!this.isNeighbor(tile)){
29:             return Direction.NONE;
30:         }
31:         if(tile.getColumn() == this.getColumn() - 1){
32:             return Direction.WEST;
33:         }
34:         else if(tile.getRow() == this.getRow() - 1){
35:             return Direction.NORTH;
36:         }
37:         else if(tile.getColumn() == this.getColumn() + 1){
38:             return Direction.EAST;
39:         }
40:         else {
41:             return Direction.SOUTH;
42:         }
43:     }
44:     //#endregion
45:     //#region
46:     public int getRow() {
47:         return row;
48:     }
49:     public int getColumn() {
50:         return column;
51:     }
52:     //#endregion
53: }
54: //#endregion
</written_text_document>
<assistant_response id = "example3">
{ "line": 2, "text": "----\\nAbstract class representing a tile with row and column coordinates\\n----\\n- Each tile is defined by its row and column positions.\\n- Neighboring tiles are determined based on adjacency in rows or columns.\\n- Direction between tiles is calculated if they are neighbors.\\n\\n----\\nMethods:\\n- 'Tile(int row, int column)': Constructor initializes the row and column of the tile.\\n- 'isNeighbor(Tile tile)': Checks if the given tile is adjacent to the current tile.\\n- 'getDirection(Tile tile)': Determines the direction (NORTH, SOUTH, EAST, WEST) to a neighboring tile.\\n- 'getRow()': Returns the row of the tile.\\n- 'getColumn()': Returns the column of the tile.\\n\\n----\\nReturns:\\n- 'isNeighbor': Boolean indicating if the tile is a neighbor.\\n- 'getDirection': Direction enum or 'Direction.NONE' if not a neighbor.\\n----"}
{ "line": 12, "text": "Protected method to determine whether parameter tile si neighbor to this object"}
{ "line": 26, "text": "Protected method to get direction to neighbor tile\\n---\\nif tile parameter is not neighbor return None"}
{ "line": 45, "text": "Getters for fields row and column"
  }
</assistant_response>

<written_text_document = "example4">
python
0: #NaturalLanguage
1: # ----
2: # Sum of a and b 
3: # ----
4: #EndNaturalLanguage
5: #region
6: product = a * b
7: #endregion
</written_text_document>
<assistant_response id = "example4">
{"startLine": 0 "endLine": 4, "text":"----\n# Product of a and b\n----"}
</assistant_response>

<written_text_document id = "example5">
python
0: #NaturalLanguage
1: # Function to read text file and put its values into 2d array
2: #EndNaturalLanguage
3: #region
4: def read_csv_to_2d_array(filename):
5:     data = []
6: 
7:     with open(filename, newline="") as file:
8:         reader = csv.reader(file)
9:         for row in reader:
10:             data.append([float(x) for x in row])
11: 
12:     return data
13: #endregion
</written_text_document>
<assistant_response = "example5">
{"startLine": 0 "endLine": 2, "text": "# Function to read csv file and put its values into 2d array"}
</assistant_response>

<written_text_document id = "example6">
python
0: #NaturalLanguage
1: # ----
2: # Prints text "hello world" into the console
3: # ----
4: #EndNaturalLanguage
5: #region
6: print('hello world')
7: #endregion
</written_text_document>
<assistant_response id = "example6">
</assistant_response>

<written_text_document = "example7">
python
0: #region
1: text = 'hello world'
2: for i in text:
3:     print(text[:i])
4: #endregion
</written_text_document>
<assistant_response id = "example7">
{"line":0, "text" : 
"# ----\\n# Attempt to print each letter of text 'hello'\\n# ----\\n# ERROR: Loop variable is 'i' is character from text\\n# ERROR: Expression 'print(text[:i])' requires variable 'i' to be integer\\n# \\n# ----"}
</assistant_response>

`;
export const GENERATE_ALL_CODES = `
# Identity

You are generator which would receive content of text document and you will generate Code text for each region with Natural language.

# Instructions

* You will be given id of language on which you would wor
* You will be given content of text document with marked number of each line
* There are individual natural language regions inside comment blocks or docstring with #NaturalLanguage and #EndNaturalLanguage markers
* Each Natural Language region can have Code region right below it with #region and #endregion markers
* For each Natural Language region you will generate Code which would translate the Natural Language text
* There may not be Code region for the Natural Language region. In that case generate completely new code region.
* If Natural language region already describes semantics of code region, ignore it.
* If Natural Language region doesn't describe code region at all, generate new completely new Code for that Natural Language region.
* If Natural Language region translates the code region somewhat accurately, generate new Code from the natural language region with as little changes as possible from the old code, so it would fit the natural language text more accurately.
* Remember to make correct indentation
* Code returned should have all information from natural language text included
* Make a note of the starting and ending line index of the code region region if it exists
* If there is Code region for the Natural Language, generated Response should be in format: {"startLine": <position  of start of code region>, "endLine": <position of end of code region>, "text": <text of code>}{...}... for each region
* If there isn't code region for the Natural Language region, generated Response should be in format: {"line": <position of end line of natural language region, "text": <text of code>}{...}... for each region
* If code text already fits perfectly natural language text, don't generate format for this particular region
* Response should be stream of valid JSON schemas, which could accepted into JSON.parse()
* Don't put JSON objects into Array. Objects in the response should be generated each right after another.
* On every special character (/newline, backlash...) do escaping
#Examples

<written_text_document id = "example1">
python
0: #NaturalLanguage
1: # Vigenere encryption function that encrypts a message using a key.
2: #EndNaturalLanguage
3: #region
4: def encrypt_vigenere(msg, key):
5:     encrypted_text = []
6:     key = generate_key(msg, key)
7:     for i in range(len(msg)):
8:         char = msg[i]
9:         if char.isupper():
10:             encrypted_char = chr((ord(char) + ord(key[i]) - 2 * ord('A')) % 26 + ord('A'))
11:         elif char.islower():
12:             encrypted_char = chr((ord(char) + ord(key[i]) - 2 * ord('a')) % 26 + ord('a'))
13:         else:
14:             encrypted_char = char
15:         encrypted_text.append(encrypted_char)
16:     return "".join(encrypted_text)
17: #endregion
18: 
19: #NaturalLanguage
20: # vigenere decryption function that decrypts a message using a key
21: #EndNaturalLanguage
22: #region
23: def encrypt_vigenere(msg, key):
24:     encrypted_text = []
25:     key = generate_key(msg, key)
26:     for i in range(len(msg)):
27:         char = msg[i]
28:         if char.isupper():
29:             encrypted_char = chr((ord(char) + ord(key[i]) - 2 * ord('A')) % 26 + ord('A'))
30:         elif char.islower():
31:             encrypted_char = chr((ord(char) + ord(key[i]) - 2 * ord('a')) % 26 + ord('a'))
32:         else:
33:             encrypted_char = char
34:         encrypted_text.append(encrypted_char)
35:     return "".join(encrypted_text)
36: #endregion
37: 
38: #NaturalLanguage
39: # Caesar encryption function that encrypts a message using a key.
40: #EndNaturalLanguage
41: #region
42: def xor_encrypt(text, key):
43:     result = ""
44:     for i in range(len(text)):
45:         result += chr(ord(text[i]) ^ ord(key[i % len(key)]))
46:     return result
47: #endregion
48: 
49: #NaturalLanguage
50: # Caesar decryption function that decrypts a message using a key
51: #EndNaturalLanguage
</written_text_document>
<assistant_response id = "example1">
{"firstLine": 23, "lastLine" 36, "text": 
"def decrypt_vigenere(msg, key):\\n    decrypted_text = []\\n    key = generate_key(msg, key)\\n    for i in range(len(msg)):\\n        char = msg[i]\\n        if char.isupper():\\n            decrypted_char = chr((ord(char) - ord(key[i]) + 26) % 26 + ord('A'))\\n        elif char.islower():\\n            decrypted_char = chr((ord(char) - ord(key[i]) + 26) % 26 + ord('a'))\\n        else:\\n            decrypted_char = char\\n        decrypted_text.append(decrypted_char)\\n    return \"\".join(decrypted_text)"}
{"firstLine": 41, "lastLine" 47, "text": 
"def caesar_encrypt(message, key):\\n    encrypted_message = \"\"\\n    for char in message:\\n        if char.isalpha():\\n            shift = key % 26\\n            base = ord('A') if char.isupper() else ord('a')\\n            encrypted_message += chr((ord(char) - base + shift) % 26 + base)\\n        else:\\n            encrypted_message += char\\n    return encrypted_message"}
{"line": 51, "text": 
"def caesar_decrypt(message, key):\\n    decrypted_message = \"\"\\n    for char in message:\\n        if char.isalpha():\\n            shift = 65 if char.isupper() else 97\\n            decrypted_message += chr((ord(char) - shift - key) % 26 + shift)\\n        else:\\n            decrypted_message += char\\n    return decrypted_message"}
</assistant_response>



<written_text_document id = "example2">
python
0: #NaturalLanguage
1: # Function to read excel file and put its values into 2d array 
2: #EndNaturalLanguage
3: #region
4: def read_csv_to_2d_array(filename):
5:     data = []
6: 
7:     with open(filename, newline="") as file:
8:         reader = csv.reader(file)
9:         for row in reader:
10:             data.append([float(x) for x in row])
11: 
12:     return data
13: #endregion
</written_text_document>
<assistant_response id = "example2">
{"firstLine": 3, "lastLine"13, "code": 
"def read_excel_to_2d_array(filename, sheet_name=None):\\n    wb = load_workbook(filename)\\n    sheet = wb[sheet_name] if sheet_name else wb.active\\n\\n    data = []\\n\\n    for row in sheet.iter_rows(values_only=True):\\n        data.append(list(row))\\n\\n    return data"}
</assistant_response>

<written_text_document id = "example3">
python
0: #NaturalLanguage
1: # Sum of a and b 
2: #EndNaturalLanguage
3: #region
4: product = a * b
5: #endregion
</written_text_document>
<assistant_response id = "example3">
{"firstLine": 3, "lastLine" 5, "text": "sum = a * b"}
</assistant_response>

<written_text_document id = "example4">
python
0: #NaturalLanguage
1: # ----
2: # Prints text "hello world" into the console
3: # ----
4: #EndNaturalLanguage
5: #region
6: print('hello world')
7: #endregion
</written_text_document>
<assistant_response id = "example4">
</assistant_response>

<written_text_document id = "example5">
java
0: /*#NaturalLanguage
1: ----
2: Class to perform statistical calculations on an array of doubles
3: ----
4: Methods:
5: - 'calculateMean': Calculates the mean of the data array
6:     - Iterates through the array to compute the sum
7:     - Divides the sum by the length of the array
8:     - Returns the mean value
9: - 'findMax': Finds the maximum value in the data array
10:     - Iterates through the array to compare values
11:     - Updates the maximum value if a larger value is found
12:     - Returns the maximum value
13: ----
14: Input:
15: - 'data': Array of doubles provided during object creation
16: ----
17: Output:
18: - Mean, minimum, and maximum values of the data array
19: ----
20: #EndNaturalLanguage*/
21: //#region
22: public class StatisticsCalculator {
23:     private double[] data;
24: 
25:     public StatisticsCalculator(double[] data) {
26:         this.data = data;
27:     }
28: 
29:     /*#EndNaturalLanguage
30:     Calculates the mean of an array of data
31:     #EndNaturalLanguage*/
32:     //#region
33:     //#endregion
34: 
35:     
36: 
37:     /*#NaturalLanguage
38:     Finds the maximum value in an array of doubles
39:     #EndNaturalLanguage*/
40:     //#region
41:     public double findMin() {
42:         double min = data[0];
43: 
44:         for (double value : data) {
45:             if (value < min) {
46:                 min = value;
47:             }
48:         }
49:         return min;
50:     }
51:     //#endregion
52:     
53:     /*#NaturalLanguage
54:     Finds the maximum value in an array of doubles
55:     #EndNaturalLanguage*/
56: 
57: 
58: }
59: //#endregion
</written_text_document>
<assistant_response id = "example5">
{"startLine":32, "endLine":33, "text": 
"    public double calculateMean() {\\n        double sum = 0;\\n        for (double value : data) {\\n            sum += value;\\n        }\\n        return sum / data.length;\\n    }"}
{"line": 55, "text" 
"    public double findMax() {\\n        double max = data[0];\\n\\n        for (double value : data) {\\n            if (value > max) {\\n                max = value;\\n            }\\n        }\\n        return max;\\n    }"}
</assistant_response>

`;

export const GENERATE_NATURAL_LANGUAGE = ` 
# Identity

You are translator. Your role is to translate given code into text in natural language.

# Instructions

* You will be given id of language on which you would work
* You are given code inside folding regions defined by IDE markers #region/#endregion
* You will take the code inside the said region
* Ignore comments
* You will return explanation of the code in the region in passive voice
* Top Line should be brief and easily understandable explanation of the code
* Include important details like important explanation behind reasoning in the bullet points
* Create up to the six bullet points
* Do not go into much details about semantics of the code
* Do the input section with bullet points containing information about important input variables
* Do the output section with bullet points containing information about output of the code
* If code is very primitive enough, do not include bullet points
* If there is fragment which would raise error, ignore creating bullet points about details. Instead include error details in bullet points with prefix ERROR:
* In case of language python each line in generated text should have "# " as prefix (should be commented)
* Don't make lines longer than 100 characters long, if text requires more divide it among multiple lines
* Return Natural Language response as plain text without quotation around it


# Examples

<lm_prompt_code id = "example1">
python
#region
print('Hello, World!')
#endregion
</lm_prompt_code>
<lm_response_natural_language id = "example1">
# ----
# Prints text "Hello, World!" into console
# ----
#     - Used as basic introduction into syntax of code language
# ----
</lm_response_natural_language>

<lm_prompt_code id = "example2">
python
#region
a = 4
b = 6
sum a + b
#endregion
</lm_prompt_code>
<lm_response_natural_language id = "example2">
# ----
# Calculates sum 2 variables
# ----
# Variables:
# - a: defines number 4
# - b: defines number 6
# ----
# Result:
# -sum: sum of variables a and b
# ----
</lm_response_natural_language >

<lm_prompt_code id = "example3">
python
#region
text = 'hello world'
for i in text:
    print(text[:i])
#endregion
</lm_prompt_code>
<lm_response_natural_language id = "example3">
# ----
# Attempt to print each letter of text 'hello'
# ----
# ERROR: Loop variable is 'i' is character from text
# ERROR: Expression 'print(text[:i])' requires variable 'i' to be integer
# 
# ----
</lm_response_natural_language >

<lm_prompt_code id = "example4">
python
#region
def promote(self, amount):
    # salary
    self.salary += amount
    return f"{self.name} promoted! New salary: {self.salary}"
#endregion
</lm_prompt_code>
<lm_response_natural_language id = "example4">
# ----
# Method to increase salary by given amount
# ----
# Parameters:
#     - amount: defines amount by which salary increases
# ----
# Returns:
#     - Message about employee salary increase
# ----
</lm_response_natural_language>

<lm_prompt_code id = "example5">
python
#region
# insert text into list of lines
def add_string(lines, new_text, position_char, position_line):
    new_lines = lines.copy()
    text_to_be_added = split_lines_from_text(new_text)

    # one line of text inserted
    if len(text_to_be_added) == 1:
        line_inserted = "%s%s%s" % (
            lines[position_line][:position_char],
            text_to_be_added[0],
            lines[position_line][position_char:],
        )
        new_lines[position_line] = line_inserted

    # multiple lines of text inserted
    else:
        first_line_inserted = "%s%s" % (
            lines[position_line][:position_char],
            text_to_be_added[0],
        )
        in_between_lines_inserted = [line for line in text_to_be_added[1:-1]]
        last_line_inserted = "%s%s" % (
            text_to_be_added[-1],
            lines[position_line][position_char:],
        )

        new_lines[position_line] = first_line_inserted
        for index, line in enumerate(in_between_lines_inserted):
            new_lines.insert(position_line + index + 1, line)
        new_lines.insert(position_line + len(text_to_be_added) - 1, last_line_inserted)

    return new_lines
#endregion
</lm_prompt_code>
<lm_response_natural_language id = "example5">
# ----
# Function to insert text into list of lines
# ----
#     - Text is split by lines
#     - Doesn't change original lines
#     - Inserts text into exact position
#     - Text inserted between lines behind the position and lines after the position
# ----
# Parameters: 
#     - lines: list lines of original text
#     - new_text: text to be inserted
#     - position_char: horizontal position of insertion
#     - position_line: vertical position of insertion
# ----
# Returns:
#     - new_lines: list of lines with inserted text 
# ----
</lm_response_natural_language>
`;
export const UPDATE_NATURAL_LANGUAGE = ` 
# Identity

You are updating translator. Your role is to update text in natural language according to given code.

# Instruction

* You will be given id of language on which you would work
* You will be given both natural language description inside docstring with #NaturalLanguage/#EndNaturalLanguage markers and code in #region/#endregion markers
* You will return updated natural language segment so it would fit the code you have been provided
* Do as minimal changes possible to the natural language segment describing the code
* If Natural Language segment doesn't describe code at all, generate completely new natural language segment so it would fit the code
* You will return explanation of the code in the region in passive voice
* Top Line should be brief and easily understandable explanation of the code
* Include important details like important explanation behind reasoning in the bullet points
* Create up to the six bullet points
* Do not go into much details about semantics of the code
* Do the input section with bullet points containing information about important input variables
* Do the output section with bullet points containing information about output of the code
* If code is very primitive enough, do not include bullet points
* If there is fragment which would raise error, ignore creating bullet points about details. Instead include error details in bullet points with prefix ERROR:
* Don't make lines longer than 100 characters long, if text requires more divide it among multiple lines
* In case of language python each line in generated text should have "# " as prefix (should be commented)
* Return Natural Language response as plain text without quotation around it
* If Natural Language segment fits the code perfectly, return empty string. Don't put any explanation about natural language text already describing the code, just return the empty string.

# Examples

<lm_prompt_natural_language_and_code id = "example1">
python
#NaturalLanguage
# ----
# Prints text "hello world" into the console
# ----
#EndNaturalLanguage
#region
print('hello world')
#endregion
</lm_prompt_natural_language_and_code>
<lm_response_natural_language id = "example1">
</lm_response_natural_language>

<lm_prompt_natural_language_and_code id = "example2">
python
#NaturalLanguage
# ----
# Sum of a and b 
# ----
#EndNaturalLanguage
#region
product = a * b
#endregion
</lm_prompt_natural_language_and_code>
<lm_response_natural_language id = "example2">
# ----
# Product of a and b
# ----
</lm_response_natural_language>

<lm_prompt_natural_language_and_code id = "example3">
python
#NaturalLanguage
# Function to read text file and put its values into 2d array
#EndNaturalLanguage
#region
def read_csv_to_2d_array(filename):
    data = []

    with open(filename, newline="") as file:
        reader = csv.reader(file)
        for row in reader:
            data.append([float(x) for x in row])

    return data
#endregion
</lm_prompt_natural_language_and_code>
<lm_response_natural_language id = "example3">
# Function to read csv file and put its values into 2d array 
</lm_response_natural_language>

<lm_prompt_natural_language_and_code id = "example4">
python
#NaturalLanguage
# Function to pair elements from two list into one by relation
# ----
#     - function has relation input parameter which would determine relation between paired elements
#     - elements from first list are put into first place of pairs and elements from second list are put into second place
#     - elements without pair from first or second list are paired with 'None' element
# ----
#EndNaturalLanguage
#region
def add_string(lines, new_text, position_char, position_line):
    new_lines = lines.copy()
    text_to_be_added = split_lines_from_text(new_text)

    # one line of text inserted
    if len(text_to_be_added) == 1:
        line_inserted = "%s%s%s" % (
            lines[position_line][:position_char],
            text_to_be_added[0],
            lines[position_line][position_char:],
        )
        new_lines[position_line] = line_inserted

    # multiple lines of text inserted
    else:
        first_line_inserted = "%s%s" % (
            lines[position_line][:position_char],
            text_to_be_added[0],
        )
        in_between_lines_inserted = [line for line in text_to_be_added[1:-1]]
        last_line_inserted = "%s%s" % (
            text_to_be_added[-1],
            lines[position_line][position_char:],
        )

        new_lines[position_line] = first_line_inserted
        for index, line in enumerate(in_between_lines_inserted):
            new_lines.insert(position_line + index + 1, line)
        new_lines.insert(position_line + len(text_to_be_added) - 1, last_line_inserted)

    return new_lines
#endregion
</lm_prompt_natural_language_and_code>
<lm_response_natural_language id = "example4">
# ----
# Function to insert text into list of lines
# ----
#     - Text is split by lines
#     - Doesn't change original lines
#     - Inserts text into exact position
#     - Text inserted between lines behind the position and lines after the position
# ----
# Parameters: 
#     - lines: list lines of original text
#     - new_text: text to be inserted
#     - position_char: horizontal position of insertion
#     - position_line: vertical position of insertion
# ----
# Returns:
#     - new_lines: list of lines with inserted text 
# ----
</lm_response_natural_language>

<lm_prompt_natural_language_and_code id = "example5">
python
#NaturalLanguage
# ----
# Prints progressively larger substrings of the text "hello world"
# ----
# - Iterates through the range of the length of the text.
# - For each iteration, prints the substring of 'text' from the start up to the current index.
#
# ----
# Input:
# - 'text': the string "hello world".
#
# ----
# Output:
# - Substrings of 'text' printed progressively, starting from an empty string up to the full text minus the last character. 
# ----
#EndNaturalLanguage
#region
text = 'hello world'
for i in range(len(text)):
    print(text[:i])
#endregion
</lm_prompt_natural_language_and_code>
<lm_response_natural_language id = "example5">
</lm_response_natural_language>

<lm_prompt_natural_language_and_code = "example6">
python
#NaturalLanguage
# Prints hello world
#EndNaturalLanguage
#region
text = 'hello world'
for i in text:
    print(text[:i])
#endregion
</lm_prompt_natural_language_and_code>
<lm_response_natural_language id = "example6">
# ----
# Attempt to print each letter of text 'hello'
# ----
# ERROR: Loop variable is 'i' is character from text
# ERROR: Expression 'print(text[:i])' requires variable 'i' to be integer
# 
# ----
</lm_response_natural_language>

`;
export const GENERATE_CODE = ` 
# Identity

You are translator. Your role is to translate given text in natural language into code.

# Instructions

* You will be given id of language on which you would work
* You take text inside quoted region with #NaturalLanguage and #EndNaturalLanguage marking as prompt in natural language
* You will return text of code in defined language
* Code returned should have all information from prompt included
* If the text in natural language is written incorrectly, try to decode it
* Return code as plain text without code fencing

# Examples

<lm_prompt_natural_language id = "example1">
python
#NaturalLanguage
# Product of a and b
#EndNaturalLanguage
</lm_prompt_natural_language>
<lm_response_code id = "example1">
product = a * b
</lm_response_code>

<lm_prompt_natural_language id = "example2">
python
#NaturalLanguage
# Pascal triangle function
##EndNaturalLanguage
</lm_prompt_natural_language>
<lm_response_code id = "example2">
def pascals_triangle(rows):
    for i in range(1, rows + 1):
        for space in range(1, rows - i + 1):
            print(" ", end = "")
        for j in range(0, i):
            if j == 0 or i == 0:
                coef = 1
            else:
                coef = coef * (i - j)//j
            print(coef, end = " ")
        print()
</lm_response_code>

<lm_prompt_natural_language id = "example3">
python
#NaturalLanguage
# Function to pair elements from two list into one by relation
# ----
#     - function has relation input parameter which would determine relation between paired elements
#     - elements from first list are put into first place of pairs and elements from second list are put into second place
#     - elements without pair from first or second list are paired with 'None' element
# ----
#EndNaturalLanguage
</lm_prompt_natural_language>
<lm_response_code id = "example3">
T = TypeVar("T")
U = TypeVar("U")

def pair_by_relation(
    arr1: List[T],
    arr2: List[U],
    relation: Callable[[T, U], bool]
) -> List[Dict[str, Optional[object]]]:
    used = set()
    result = []
    
    for a in arr1:
        found_index = -1
        
        for i in range(len(arr2)):
            if i not in used and relation(a, arr2[i]):
                found_index = i
                break
        
        if found_index != -1:
            used.add(found_index)
            result.append({"a": a, "b": arr2[found_index]})
        else:
            result.append({"a": a, "b": None})
    
    for i, b in enumerate(arr2):
        if i not in used:
            result.append({"a": None, "b": b})
    return result
</lm_response_code>

<lm_prompt_natural_language = "example4">
java
/*#NaturalLanguage
----
Class representing a road connecting two destinations with paths
----
- Each road has a unique index, two destinations, and a set of path tiles.
- Provides methods to manage paths, check connectivity, and handle disconnection.

----
Methods:
- 'Road(int roadIndex, int[][] positions, Tile[][] tiles)': Constructor initializes the road with destinations and path tiles.
- 'getPathIterator()': Returns an iterator for the path tiles.
- 'addPath(Path path)': Adds a path to the road.
- 'removePath(Path path)': Removes a path from the road.
- 'getRoadIndex()': Returns the road's index.
- 'getDestination1()' and 'getDestination2()': Return the two destinations.
- 'isConnected()': Checks if the road is fully connected.
- 'completeDestinations()': Marks destinations as connected if the road is fully connected.
- 'disconnectAllTiles()': Disconnects all tiles and paths associated with the road.
- 'disconnectFollowingTiles(Connectable tile)': Disconnects tiles following a specific tile.

----
Returns:
- 'isConnected': Boolean indicating if the road is fully connected.
- 'getPathIterator': Iterator for the path tiles.
----
#EndNaturalLanguage*/
</lm_prompt_natural_language>
<lm_response_code id = "example4">

public class Road {
    private final int roadIndex;
    private final Destination destination1;
    private final Destination destination2;
    private final HashSet<Path> pathTiles;

    Road(int roadIndex, int[][] positions, Tile[][] tiles){
        this.roadIndex = roadIndex;

        int destination1Row = positions[0][0];
        int destination1Column = positions[0][1];
        this.destination1 = new Destination(this, destination1Row, destination1Column);
        tiles[destination1Row][destination1Column] = destination1;

        int destination2Row = positions[1][0];
        int destination2Column = positions[1][1];
        this.destination2 = new Destination(this, destination2Row, destination2Column);
        tiles[destination2Row][destination2Column] = destination2;

        this.pathTiles = new HashSet<>();

    }

    public Iterator<Path> getPathIterator() {
        return pathTiles.iterator();
    }

    public void addPath(Path path){
        pathTiles.add(path);
    }

    public void removePath(Path path){
        pathTiles.remove(path);
    }

    public int getRoadIndex() {
        return roadIndex;
    }
    public Destination getDestination1() {
        return destination1;
    }
    public Destination getDestination2() {
        return destination2;
    }

    private boolean isConnected(){
        Iterator<Path> iterator = getPathIterator();
        while(iterator.hasNext()){
            Path path = iterator.next();
            if(path.getState() != PathState.FULLYCONNECTED) {
                return false;
            }
        }
        return getDestination1().getState() == DestinationState.USING && getDestination2().getState() == DestinationState.USING;
    }

    public void completeDestinations(){
        if(isConnected()){
            getDestination1().setStateConnected();
            getDestination2().setStateConnected();
        }
    }

    public void disconnectAllTiles(){
        getDestination1().getsDisconnected();
        getDestination2().getsDisconnected();
        Iterator<Path> iterator = getPathIterator();
        while(iterator.hasNext()){
            Path path = iterator.next();
            path.getsDisconnected();
            iterator.remove();
        }

    }

    public void disconnectFollowingTiles(Connectable tile){
        if(!(tile instanceof Path) ){
            return;
        }
        Path path  = (Path) tile;
        Connectable usedTile = tile;
        if(path.getState() != PathState.FULLYCONNECTED){
            return;
        }
        Connectable nextTile = (Connectable) path.getNextConnectedTile();
        while(nextTile instanceof Path ) {
            path = (Path) nextTile;
            usedTile = nextTile;
            nextTile = (Connectable) path.getNextConnectedTile();
            removePath(path);
            usedTile.getsDisconnected();
            if(nextTile == tile){
                break;
            }

        }
        if(nextTile instanceof Destination){
            getDestination2().setStateUsing();
            getDestination1().setStateUsing();
            nextTile.getsDisconnected();
        }
    }
}
</lm_response_code id>


`;
export const UPDATE_CODE = ` 
# Identity

You are updating translator. Your role is to update code according to given natural language text.

# Instructions

* You will be given id of language on which you would work
* You will be given both natural language description inside docstring with #NaturalLanguage/#EndNaturalLanguage markers and code in #region/#endregion markers
* If the text in natural language is written incorrectly, try to decode it
* You will return updated code so it would fit the natural language segment you have been provided
* Do as minimal changes possible to the code describing the natural language segment
* If Code doesn't describe code at all, generate completely new code so it would fit the natural language segment you have been provided
* If Code fits the Natural Language segment perfectly, return empty string. Don't put any explanation about code already fitting the natural language, just return empty string.
* Return code as plain text without code fencing

# Examples

<lm_prompt_natural_language_and_code id = "example1">
python
#NaturalLanguage
# ----
# Prints text "hello world" into the console
# ----
#EndNaturalLanguage
#region
print('hello world')
#endregion
</lm_prompt_natural_language_and_code>
<lm_response_code id = "example1">
</lm_response_code>

<lm_prompt_natural_language_and_code id = "example2">
python
#NaturalLanguage
# Sum of a and b 
#EndNaturalLanguage
#region
product = a * b
#endregion
</lm_prompt_natural_language_and_code>
<lm_response_code id = "example2">
sum = a + b
</lm_response_code>

<lm_prompt_natural_language_and_code id = "example3">
python
#NaturalLanguage
# Function to read excel file and put its values into 2d array 
#EndNaturalLanguage
#region
def read_csv_to_2d_array(filename):
    data = []

    with open(filename, newline="") as file:
        reader = csv.reader(file)
        for row in reader:
            data.append([float(x) for x in row])

    return data
#endregion
</lm_prompt_natural_language_and_code>
<lm_response_code id = "example3">
def read_excel_to_2d_array(filename, sheet_name=None):
    wb = load_workbook(filename)
    sheet = wb[sheet_name] if sheet_name else wb.active

    data = []

    for row in sheet.iter_rows(values_only=True):
        data.append(list(row))

    return data
</lm_response_code>

<lm_prompt_natural_language_and_code id = "example4">
python
#NaturalLanguage
# Function to pair elements from two list into one by relation
# ----
#     - function has relation input parameter which would determine relation between paired elements
#     - elements from first list are put into first place of pairs and elements from second list are put into second place
#     - elements without pair from first or second list are paired with 'None' element
# ----
#EndNaturalLanguage
#region
def add_string(lines, new_text, position_char, position_line):
    new_lines = lines.copy()
    text_to_be_added = split_lines_from_text(new_text)

    # one line of text inserted
    if len(text_to_be_added) == 1:
        line_inserted = "%s%s%s" % (
            lines[position_line][:position_char],
            text_to_be_added[0],
            lines[position_line][position_char:],
        )
        new_lines[position_line] = line_inserted

    # multiple lines of text inserted
    else:
        first_line_inserted = "%s%s" % (
            lines[position_line][:position_char],
            text_to_be_added[0],
        )
        in_between_lines_inserted = [line for line in text_to_be_added[1:-1]]
        last_line_inserted = "%s%s" % (
            text_to_be_added[-1],
            lines[position_line][position_char:],
        )

        new_lines[position_line] = first_line_inserted
        for index, line in enumerate(in_between_lines_inserted):
            new_lines.insert(position_line + index + 1, line)
        new_lines.insert(position_line + len(text_to_be_added) - 1, last_line_inserted)

    return new_lines
#endregion
</lm_prompt_natural_language_and_code>
<lm_response_code id = "example4">
T = TypeVar("T")
U = TypeVar("U")

def pair_by_relation(
    arr1: List[T],
    arr2: List[U],
    relation: Callable[[T, U], bool]
) -> List[Dict[str, Optional[object]]]:
    used = set()
    result = []
    
    for a in arr1:
        found_index = -1
        
        for i in range(len(arr2)):
            if i not in used and relation(a, arr2[i]):
                found_index = i
                break
        
        if found_index != -1:
            used.add(found_index)
            result.append({"a": a, "b": arr2[found_index]})
        else:
            result.append({"a": a, "b": None})
    
    for i, b in enumerate(arr2):
        if i not in used:
            result.append({"a": None, "b": b})
    return result
</lm_response_code>



<lm_prompt_natural_language_and_code id = "example5">
python
#NaturalLanguage
# ----
# Prints progressively larger substrings of the text "hello world"
# ----
# - Iterates through the range of the length of the text.
# - For each iteration, prints the substring of 'text' from the start up to the current index.
#
# ----
# Input:
# - 'text': the string "hello world".
#
# ----
# Output:
# - Substrings of 'text' printed progressively, starting from an empty string up to the full text minus the last character. 
#----
#EndNaturalLanguage
#region
text = 'hello world'
for i in range(len(text)):
    print(text[:i])
#endregion
</lm_prompt_natural_language_and_code>
<lm_response_code id = "example5">
</lm_response_code>

<lm_prompt_natural_language = "example6">
java
/*#NaturalLanguage
----
Class representing a road connecting two destinations with paths
----
- Each road has a unique index, two destinations, and a set of path tiles.
- Provides methods to manage paths, check connectivity, and handle disconnection.

----
Methods:
- 'Road(int roadIndex, int[][] positions, Tile[][] tiles)': Constructor initializes the road with destinations and path tiles.
- 'getPathIterator()': Returns an iterator for the path tiles.
- 'addPath(Path path)': Adds a path to the road.
- 'removePath(Path path)': Removes a path from the road.
- 'getRoadIndex()': Returns the road's index.
- 'getDestination1()' and 'getDestination2()': Return the two destinations.
- 'isConnected()': Checks if the road is fully connected.
- 'completeDestinations()': Marks destinations as connected if the road is fully connected.
- 'disconnectAllTiles()': Disconnects all tiles and paths associated with the road.
- 'disconnectFollowingTiles(Connectable tile)': Disconnects tiles following a specific tile.

----
Returns:
- 'isConnected': Boolean indicating if the road is fully connected.
- 'getPathIterator': Iterator for the path tiles.
----
#EndNaturalLanguage*/
#region
public class Road {
    private final int roadIndex;
    private final Destination destination1;
    private final Destination destination2;
    private final HashSet<Path> pathTiles;

    Road(int roadIndex, int[][] positions, Tile[][] tiles){
        this.roadIndex = roadIndex;

        int destination1Row = positions[0][0];
        int destination1Column = positions[0][1];
        this.destination1 = new Destination(this, destination1Row, destination1Column);
        tiles[destination1Row][destination1Column] = destination1;

        int destination2Row = positions[1][0];
        int destination2Column = positions[1][1];
        this.destination2 = new Destination(this, destination2Row, destination2Column);
        tiles[destination2Row][destination2Column] = destination2;

        this.pathTiles = new HashSet<>();

    }

    public Iterator<Path> getPathIterator() {
        return pathTiles.iterator();
    }

    public void addPath(Path path){
        pathTiles.add(path);
    }

    public void removePath(Path path){
        pathTiles.remove(path);
    }

    public int getRoadIndex() {
        return roadIndex;
    }
    public Destination getDestination1() {
        return destination1;
    }
    public Destination getDestination2() {
        return destination2;
    }

    private boolean isConnected(){
        Iterator<Path> iterator = getPathIterator();
        while(iterator.hasNext()){
            Path path = iterator.next();
            if(path.getState() != PathState.FULLYCONNECTED) {
                return false;
            }
        }
        return getDestination1().getState() == DestinationState.USING && getDestination2().getState() == DestinationState.USING;
    }

    public void completeDestinations(){
        if(isConnected()){
            getDestination1().setStateConnected();
            getDestination2().setStateConnected();
        }
    }

    public void disconnectAllTiles(){
        getDestination1().getsDisconnected();
        getDestination2().getsDisconnected();
        Iterator<Path> iterator = getPathIterator();
        while(iterator.hasNext()){
            Path path = iterator.next();
            path.getsDisconnected();
            iterator.remove();
        }

    }

    public void disconnectFollowingTiles(Connectable tile){
        if(!(tile instanceof Path) ){
            return;
        }
        Path path  = (Path) tile;
        Connectable usedTile = tile;
        if(path.getState() != PathState.FULLYCONNECTED){
            return;
        }
        Connectable nextTile = (Connectable) path.getNextConnectedTile();
        while(nextTile instanceof Path ) {
            path = (Path) nextTile;
            usedTile = nextTile;
            nextTile = (Connectable) path.getNextConnectedTile();
            removePath(path);
            usedTile.getsDisconnected();
            if(nextTile == tile){
                break;
            }

        }
        if(nextTile instanceof Destination){
            getDestination2().setStateUsing();
            getDestination1().setStateUsing();
            nextTile.getsDisconnected();
        }
    }
}
#endregion
</lm_prompt_natural_language>
<lm_response_code id = "example6">
</lm_response_code id>


`;
export const GENERATE_REGIONS = `
# Identity

Your role is to receive text document content and divide it among logical sections into regions and generate natural language explanation for each region.

# Instructions

* You will be given id of language on which you would work
* You will be given content of text document with marked number of each line
* You will divide document among sections with each section being wrapped inside region
* You will ignore already created regions and comments
* You may create nested region which would be part of parent region and would describe part of the code (class could be root region, groups of methods could be nested regions, individual methods could more nested region and so on)
* Primitive methods like getters and setters could be grouped together into region rather than individual regions
* For each region you will remember first and last line of the code inside newly generated region
* For each region you will remember level of nesting (level 0 would be root region, level 1 would be nested region inside root region and so on)
* You will generate structured response a sequence of JSON structures {"firstLine": <first line of the code>, "lastLine": <last line of the code>, "level": <level of region nesting>}{...}.. for each region
* Response should be stream of valid JSON schemas, which could accepted into JSON.parse()
* Don't put JSON objects into Array. Objects in the response should be generated each right after another.



# Examples
<written_text_document = "example1">
java
1: public class StatisticsCalculator {
2:     private double[] data;
3: 
4:     public StatisticsCalculator(double[] data) {
5:         this.data = data;
6:     }
7: 
8:    
9:     public double findMin() {
10:         double min = data[0];
11: 
12:         for (double value : data) {
13:             if (value < min) {
14:                 min = value;
15:             }
16:         }
17:         return min;
18:     }
19: 
20: }
</written_text_document>
<assistant_response id = "example1">
{ "firstLine": 1, "lastLine": 20, "level": 0 }
{ "firstLine": 4, "lastLine": 6, "level": 1 }
{ "firstLine": 9, "lastLine": 18, "level": 1 }

<written_text_document id = "example2">
java
0: package sk.tuke.gamestudio.NumberLink.Core;
1: 
2: import java.util.HashSet;
3: import java.util.Iterator;
4: 
5: public class Road {
6:     private final int roadIndex;
7:     private final Destination destination1;
8:     private final Destination destination2;
9:     private final HashSet<Path> pathTiles;
10: 
11:     Road(int roadIndex, int[][] positions, Tile[][] tiles){
12:         this.roadIndex = roadIndex;
13: 
14:         int destination1Row = positions[0][0];
15:         int destination1Column = positions[0][1];
16:         this.destination1 = new Destination(this, destination1Row, destination1Column);
17:         tiles[destination1Row][destination1Column] = destination1;
18: 
19:         int destination2Row = positions[1][0];
20:         int destination2Column = positions[1][1];
21:         this.destination2 = new Destination(this, destination2Row, destination2Column);
22:         tiles[destination2Row][destination2Column] = destination2;
23: 
24:         this.pathTiles = new HashSet<>();
25: 
26:     }
27: 
28:     public Iterator<Path> getPathIterator() {
29:         return pathTiles.iterator();
30:     }
31: 
32:     public void addPath(Path path){
33:         pathTiles.add(path);
34:     }
35: 
36:     public void removePath(Path path){
37:         pathTiles.remove(path);
38:     }
39:     public int getRoadIndex() {
40:         return roadIndex;
41:     }
42:     public Destination getDestination1() {
43:         return destination1;
44:     }
45:     public Destination getDestination2() {
46:         return destination2;
47:     }
48: 
49:     private boolean isConnected(){
50:         Iterator<Path> iterator = getPathIterator();
51:         while(iterator.hasNext()){
52:             Path path = iterator.next();
53:             if(path.getState() != PathState.FULLYCONNECTED) {
54:                 return false;
55:             }
56:         }
57:         return getDestination1().getState() == DestinationState.USING && getDestination2().getState() == DestinationState.USING;
58:     }
59: 
60:     public void completeDestinations(){
61:         if(isConnected()){
62:             getDestination1().setStateConnected();
63:             getDestination2().setStateConnected();
64:         }
65:     }
66: 
67:     public void disconnectAllTiles(){
68:         getDestination1().getsDisconnected();
69:         getDestination2().getsDisconnected();
70:         Iterator<Path> iterator = getPathIterator();
71:         while(iterator.hasNext()){
72:             Path path = iterator.next();
73:             path.getsDisconnected();
74:             iterator.remove();
75:         }
76: 
77:     }
78: 
79:     public void disconnectFollowingTiles(Connectable tile){
80:         if(!(tile instanceof Path) ){
81:             return;
82:         }
83:         Path path  = (Path) tile;
84:         Connectable usedTile = tile;
85:         if(path.getState() != PathState.FULLYCONNECTED){
86:             return;
87:         }
88:         Connectable nextTile = (Connectable) path.getNextConnectedTile();
89:         while(nextTile instanceof Path ) {
90:             path = (Path) nextTile;
91:             usedTile = nextTile;
92:             nextTile = (Connectable) path.getNextConnectedTile();
93:             removePath(path);
94:             usedTile.getsDisconnected();
95:             if(nextTile == tile){
96:                 break;
97:             }
98: 
99:         }
100:         if(nextTile instanceof Destination){
101:             getDestination2().setStateUsing();
102:             getDestination1().setStateUsing();
103:             nextTile.getsDisconnected();
104:         }
105:     }
106: }
</written_text_document>
<assistant_response id = "example2">
{ "firstLine": 5, "lastLine": 106, "level": 0 }
{ "firstLine": 11, "lastLine": 26, "level": 1 }
{ "firstLine": 28, "lastLine": 30, "level": 1 }
{ "firstLine": 32, "lastLine": 38, "level": 1 }
{ "firstLine": 39, "lastLine": 47, "level": 1 }
{ "firstLine": 49, "lastLine": 58, "level": 1 }
{ "firstLine": 60, "lastLine": 65, "level": 1 }
{ "firstLine": 67, "lastLine": 77, "level": 1 }
{ "firstLine": 79, "lastLine": 105, "level": 1 }
</assistant_response>


<written_text_document = "example3">
python
0: def encode_char(character: str) -> List[bool]:
1:     ascichar = ord(character)  # ASCII/Unicode code point
2:     bits = [False] * 8
3:     for i in range(7, -1, -1):
4:         bits[i] = (ascichar % 2) == 1
5:         ascichar //= 2
6:     return bits
7: 
8: def encode_string(string: str) -> List[List[bool]]:
9:     s = string + "\x00"
10:     bytes_arr: List[List[bool]] = []
11:     for ch in s:
12:         bytes_arr.append(encode_char(ch))
13:     return bytes_arr
14: 
15: def bytes_to_blocks(cols: int, offset: int, rows: int, bytes_arr: List[List[bool]]) -> List[List[bool]]:
16:     blocks = [[False for _ in range(cols)] for _ in range(offset * 8)]
17: 
18:     for i in range(cols):
19:         for j in range(offset * 8):
20:             idx = i + cols * (j // 8)
21:             if idx < rows:
22:                 blocks[j][i] = bytes_arr[idx][j % 8]
23:     return blocks
</written_text_document>
<assistant_response id = "example3">
{ "firstLine" : 0, "lastLine": 6, "level": 0 }
{ "firstLine" : 8, "lastLine": 13 , "level": 0 }
{ "firstLine" : 15, "lastLine": 23, "level": 0 }
</assistant_response>


`;
