#region
#region
def encode_char(character: str) -> List[bool]:
    ascichar = ord(character)  # ASCII/Unicode code point
    bits = [False] * 8
    for i in range(7, -1, -1):
        bits[i] = (ascichar % 2) == 1
        ascichar //= 2
    return bits
#endregion

#region
def encode_string(string: str) -> List[List[bool]]:
    s = string + "\x00"
    bytes_arr: List[List[bool]] = []
    for ch in s:
        bytes_arr.append(encode_char(ch))
    return bytes_arr
#endregion

#region
def bytes_to_blocks(cols: int, offset: int, rows: int, bytes_arr: List[List[bool]]) -> List[List[bool]]:
    blocks = [[False for _ in range(cols)] for _ in range(offset * 8)]

    for i in range(cols):
        for j in range(offset * 8):
            idx = i + cols * (j // 8)
            if idx < rows:
                blocks[j][i] = bytes_arr[idx][j % 8]
    return blocks
#endregion
#endregion