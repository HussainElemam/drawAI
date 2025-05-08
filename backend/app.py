import os
from dotenv import load_dotenv
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from PIL import Image, ImageOps
import io
from google import genai
from google.genai import types


load_dotenv()
app = Flask(__name__)
CORS(app)
client = genai.Client(api_key=os.getenv('GOOGLE_API_KEY'))

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        file = request.files['image']
        image = Image.open(file.stream)
        response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[image, "Predict what I am trying to draw, respond with only up to three words as your prediction"]
        )  
        prediction = response.text.strip()
        return jsonify({"prediction": prediction})
        
    except Exception as e:
        print(f"Error in predict function: {str(e)}")  # Debug logging
        return jsonify({"error": str(e)}), 500

@app.route('/api/enhance', methods=['POST'])
def enhance():
    file = request.files['image']
    image = Image.open(file.stream)

    # Do your thing here and return proccessed image
    # text_input = """
    # Can you generate a more refined version of this sketch,
    # keep the image sketch-like if possible and dont add too many details,
    # stick to the essence of the provided sketch
    # """
    text_input = """
    generate a petterand more interesting version of this sketch,
    add more details and make it as if it was drawn by an artist,
    while keeping the sketch-like feel of it and keep the main elements 
    """
    response = client.models.generate_content(
      model="gemini-2.0-flash-exp-image-generation",
      contents=[text_input, image],
      config=types.GenerateContentConfig(
        response_modalities=['TEXT', 'IMAGE']
      )
    )
    for part in response.candidates[0].content.parts:
        if part.text is not None:
            print(part.text)
        elif part.inline_data is not None:
            image = Image.open(io.BytesIO(part.inline_data.data))
    img_io = io.BytesIO()
    image.save(img_io, 'PNG')
    img_io.seek(0)

    return send_file(img_io, mimetype='image/png')

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 8080)))

