import  csv

suicide_notes_path = "./machine-learning/data/suicide.csv"

#opens suicide.csv
with open(suicide_notes_path, newline="", encoding="cp850") as f:
    reader = csv.reader(f)
    data = list(reader)

suicide_list = []
#makes a new list that does not include empty elements
for k in range(len(data)):
    if data[k][1] != "":
        suicide_list.append(data[k])

# makes a txt document for each suicide note's sentences
for i in range(len(suicide_list)):
    
    #seperates each sentence into a new text document
    seperated_list = suicide_list[i][1].split(".")

    for j in range(len(seperated_list)):
        #only makes a new sentence if non-empty
        if seperated_list[j] != "":
            new_txt = open("./machine-learning/data/suicide_preprocessed/suicide_" + str(i) + "_" + str(j) + ".txt", "w", newline="", encoding="cp850")
            new_txt.write(seperated_list[j])
            new_txt.close()

   