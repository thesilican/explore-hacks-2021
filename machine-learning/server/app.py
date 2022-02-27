from flask import Flask, request
import tensorflow as tf

#loads the model
model = tf.keras.models.load_model("./accurate_model_0")


def ml_info(message):
    suicide_risk = model.predict([message])

    #returns False if the predicted risk is <= 50%
    if suicide_risk <= 0.5:
        return False
    
    #returns True if the predicted risk is > 50%
    else:
        return True


app = Flask(__name__)


@app.route("/")
def hello_world():
    msg = request.args.get("message")
    if ml_info(msg):
        return "true"
    else:
        return "false"
