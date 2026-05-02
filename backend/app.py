import os
import base64
from dotenv import load_dotenv
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from PIL import Image
import io
import requests


load_dotenv()
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"], "allow_headers": ["Content-Type"]}})

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
TEXT_MODEL = "google/gemini-3.1-flash-lite-preview"
IMAGE_MODEL = "google/gemini-3.1-flash-image-preview"
OPENROUTER_TIMEOUT_SECONDS = 120
PREDICTION_PROMPT = (
    "Predict what I am trying to draw, respond with up to three words "
    "(less words is better)"
)
ENHANCE_PROMPT = """
generate a better and more interesting version of this sketch,
add more details and make it as if it was drawn by an artist,
while keeping the sketch-like feel of it and keep the main elements
"""


def get_openrouter_headers():
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not configured")

    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


def image_file_to_data_url(file):
    image = Image.open(file.stream)
    img_io = io.BytesIO()
    image.save(img_io, "PNG")
    encoded_image = base64.b64encode(img_io.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded_image}"


def openrouter_chat(payload):
    response = requests.post(
        OPENROUTER_API_URL,
        headers=get_openrouter_headers(),
        json=payload,
        timeout=OPENROUTER_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.json()


def build_multimodal_message(prompt, image_data_url):
    return [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": image_data_url}},
            ],
        }
    ]


def extract_message(openrouter_response):
    choices = openrouter_response.get("choices") or []
    if not choices:
        raise RuntimeError("OpenRouter response did not include choices")

    message = choices[0].get("message")
    if not message:
        raise RuntimeError("OpenRouter response did not include a message")

    return message


def extract_text(openrouter_response):
    content = extract_message(openrouter_response).get("content")
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        text_parts = [
            part.get("text", "")
            for part in content
            if isinstance(part, dict) and part.get("type") == "text"
        ]
        text = " ".join(text_parts).strip()
        if text:
            return text

    raise RuntimeError("OpenRouter response did not include text content")


def extract_image(openrouter_response):
    images = extract_message(openrouter_response).get("images") or []
    if not images:
        raise RuntimeError("OpenRouter response did not include an image")

    image_url = images[0].get("image_url") or images[0].get("imageUrl") or {}
    data_url = image_url.get("url")
    if not data_url or "," not in data_url:
        raise RuntimeError("OpenRouter image response was not a data URL")

    header, encoded_image = data_url.split(",", 1)
    mimetype = "image/png"
    if header.startswith("data:") and ";" in header:
        mimetype = header.removeprefix("data:").split(";", 1)[0] or mimetype

    return base64.b64decode(encoded_image), mimetype

@app.route('/')
def health():
    return jsonify({"status": "ok"})

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        file = request.files['image']
        image_data_url = image_file_to_data_url(file)
        response = openrouter_chat(
            {
                "model": TEXT_MODEL,
                "messages": build_multimodal_message(
                    PREDICTION_PROMPT,
                    image_data_url,
                ),
                "max_completion_tokens": 16,
                "temperature": 0.2,
            }
        )
        prediction = extract_text(response)
        return jsonify({"prediction": prediction})
        
    except Exception as e:
        print(f"Error in predict function: {str(e)}")  # Debug logging
        return jsonify({"error": str(e)}), 500

@app.route('/api/enhance', methods=['POST'])
def enhance():
    try:
        file = request.files['image']
        image_data_url = image_file_to_data_url(file)
        response = openrouter_chat(
            {
                "model": IMAGE_MODEL,
                "messages": build_multimodal_message(
                    ENHANCE_PROMPT,
                    image_data_url,
                ),
                "modalities": ["image", "text"],
            }
        )
        image_bytes, mimetype = extract_image(response)
        img_io = io.BytesIO(image_bytes)
        img_io.seek(0)

        return send_file(img_io, mimetype=mimetype)

    except Exception as e:
        print(f"Error in enhance function: {str(e)}")  # Debug logging
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 8080)))

