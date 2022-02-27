import json

mdhs_json_path = "./machine-learning/data/mdhs_not_suicide.json"

with open(mdhs_json_path, newline="", encoding="cp850") as f:
    data = json.load(f)

not_suicide_list = []

#takes 4669, non-empty messages from the JSON
#4669 because that is the amount of training examples of suicidal messages
k = 0
while len(not_suicide_list) < 4669:  
    if data["messages"][k]["content"] != "":
        #0 for non-suicidal message
        each_element = [0, data["messages"][k]["content"]]
        not_suicide_list.append(each_element)
    k += 1

print(not_suicide_list)

#makes a txt document for each non-suicidal message
for i in range(len(not_suicide_list)):
    new_txt = open("./machine-learning/data/new_mdhs/_not_suicide_" + str(i) +  ".txt", "w", newline="", encoding="cp850")
    new_txt.write(not_suicide_list[i][1])
    new_txt.close()