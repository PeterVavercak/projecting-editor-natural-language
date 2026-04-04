"""nlregion
Vigenere encryption function that encrypts a message using a key.
endnlregion"""
#region
def encrypt_vigenere(msg, key):
    encrypted_text = []
    key = generate_key(msg, key)
    for i in range(len(msg)):
        char = msg[i]
        if char.isupper():
            encrypted_char = chr((ord(char) + ord(key[i]) - 2 * ord('A')) % 26 + ord('A'))
        elif char.islower():
            encrypted_char = chr((ord(char) + ord(key[i]) - 2 * ord('a')) % 26 + ord('a'))
        else:
            encrypted_char = char
        encrypted_text.append(encrypted_char)
    return "".join(encrypted_text)
#endregion 1 1 1

"""nlregion
vigenere decryption function that decrypts a message using a key
endnlregion"""
#region
def decrypt_vigenere(msg, key):
    decrypted_text = []
    key = generate_key(msg, key)
    for i in range(len(msg)):
        char = msg[i]
        if char.isupper():
            decrypted_char = chr((ord(char) - ord(key[i]) + 26) % 26 + ord('A'))
        elif char.islower():
            decrypted_char = chr((ord(char) - ord(key[i]) + 26) % 26 + ord('a'))
        else:
            decrypted_char = char
        decrypted_text.append(decrypted_char)
    return "".join(decrypted_text)
#endregion 1 1

"""nlregion
Caesar encryption function that encrypts a message using a key.  
- Shifts each alphabetic character by the key value (modulo 26).  
- Preserves the case of the characters.  
- Non-alphabetic characters remain unchanged.  
Parameters:  
- `message`: The string to be encrypted.  
- `key`: The integer value used for shifting characters.  
Returns:  
- `encrypted_message`: The encrypted string.  
endnlregion"""
#region
def caesar_encrypt(message, key):
    encrypted_message = ""
    for char in message:
        if char.isalpha():
            shift = key % 26
            base = ord('A') if char.isupper() else ord('a')
            encrypted_message += chr((ord(char) - base + shift) % 26 + base)
        else:
            encrypted_message += char
    return encrypted_message
#endregion

"""nlregion
Caesar decryption function that decrypts a message using a key
endnlregion"""

#region
def caesar_decrypt(message: str, key: int) -> str:
    decrypted_message = ""
    for char in message:
        if char.isalpha():
            shift = 65 if char.isupper() else 97
            decrypted_message += chr((ord(char) - shift - key) % 26 + shift)
        else:
            decrypted_message += char
    return decrypted_message
#endregion
