import  tensorflow as tf

model = tf.keras.models.load_model("./machine-learning/model_1000d")

while True:
    message = input()
    if message == "":
        break
    else:
        suicide_risk = model.predict([message])
        if suicide_risk <= 0.5:
            print(0)
        else:
            print(1)