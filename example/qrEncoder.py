"""nlregion
Encodes a character into its binary representation as a list of boolean values.

- Converts the character to its ASCII/Unicode code point.
- Represents the code point as an 8-bit binary number, where each bit is stored as a boolean value in a list.

Parameters:
- `character`: A single character to be encoded.

Returns:
- A list of 8 boolean values representing the binary encoding of the character.
endnlregion"""
#region
def encode_char(character: str) -> List[bool]:
    ascichar = ord(character)  # ASCII/Unicode code point
    bits = [False] * 8
    for i in range(7, -1, -1):
        bits[i] = (ascichar % 2) == 1
        ascichar //= 2
    return bits
#endregion

"""nlregion
Function to encode a string into a list of boolean lists  
----  
- A null character ("\x00") is appended to the input string.  
- Each character in the modified string is encoded into a list of boolean values.  
- The encoding of each character is performed using the `encode_char` function.  

----  
Parameters:  
- string: The input string to be encoded.  

----  
Returns:  
- A list of boolean lists representing the encoded string.  
----  
endnlregion"""
#region
def encode_string(string: str) -> List[List[bool]]:
    s = string + "\x00"
    bytes_arr: List[List[bool]] = []
    for ch in s:
        bytes_arr.append(encode_char(ch))
    return bytes_arr
#endregion

"""nlregion
----
Function to convert a 2D array of bytes into blocks of boolean values
----
    - Initializes a 2D list `blocks` with `False` values.
    - Iterates through columns and rows to populate `blocks` based on `bytes_arr`.
    - Ensures that only valid indices within the bounds of `rows` are accessed.
----
Parameters:
    - cols: number of columns in the resulting blocks.
    - offset: determines the number of rows in `blocks` as `offset * 8`.
    - rows: total number of rows in the input `bytes_arr`.
    - bytes_arr: 2D list of boolean values representing the input data.
----
Returns:
    - blocks: 2D list of boolean values representing the transformed data.
----
endnlregion"""
#region
def bytes_to_blocks(cols: int, offset: int, rows: int, bytes_arr: List[List[bool]]) -> List[List[bool]]:
    blocks = [[False for _ in range(cols)] for _ in range(offset * 8)]

    for i in range(cols):
        for j in range(offset * 8):
            blocks[j][i] = False
            idx = i + cols * (j // 8)
            if idx < rows:
                blocks[j][i] = bytes_arr[idx][j % 8]
    return blocks
#endregion