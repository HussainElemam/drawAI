import os

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from PIL import Image, ImageOps
import io

app = Flask(__name__)
CORS(app)

@app.route('/api/predict', methods=['POST'])
def predict():
    file = request.files['image']
    image = Image.open(file.stream)

    # Do your thing and return the prediction
    prediction = "Mountain"
    print(jsonify({"prediction": prediction}))
    return jsonify({"prediction": prediction})

@app.route('/api/enhance', methods=['POST'])
def enhance():
    file = request.files['image']
    image = Image.open(file.stream)

    # Do your thing here and return proccessed image

    img_io = io.BytesIO()
    image.save(img_io, 'PNG')
    img_io.seek(0)

    return send_file(img_io, mimetype='image/png')

if __name__ == '__main__':
    app.run(debug=True, port=8080)

