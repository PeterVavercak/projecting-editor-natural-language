#nlregion
# ----
# Prints the text "hello world" to the console
# ----
#     - Used as a basic demonstration of output functionality
# ----
#endnlregion
#region
print('hello world')
#endregion

#nlregion
# 
#endnlregion


#nlregion
# ----
# Function to print Pascal's Triangle up to a given number of rows
# ----
#     - Prints each row of Pascal's Triangle with proper spacing
#     - Uses combinatorial logic to calculate values in the triangle
# ----
# Parameters:
#     - rows: number of rows to generate in Pascal's Triangle
# ----
# Output:
#     - Pascal's Triangle printed row by row
# ----
#endnlregion
#region
def pascals_triangle(rows):
    for i in range(rows):
        for space in range(rows - i - 1):
            print(" ", end="")
        num = 1
        for j in range(i + 1):
            print(num, end=" ")
            num = num * (i - j) // (j + 1)
        print()
#endregion

#nlregion
# 
#endnlregion
