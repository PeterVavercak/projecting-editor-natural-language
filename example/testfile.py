0: """nlregion
1: Function to read excel file and put its values into 2d array 
2: endnlregion"""
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
"""nlregion
Function to read excel file and put its values into 2d array 
endnlregion"""
#region
def read_csv_to_2d_array(filename):
    data = []

    with open(filename, newline="") as file:
        reader = csv.reader(file)
        for row in reader:
            data.append([float(x) for x in row])

    return data
#endregion