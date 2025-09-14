# ai_engine_gemini.py
import os, base64
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# create model
model = genai.GenerativeModel("models/gemini-1.5-flash")

# start a chat session (keeps history inside Gemini session)
chat_session = model.start_chat(history=[])

def get_answer(query: str) -> str:
    try:
        response = chat_session.send_message(query)
        return response.text
    except Exception as e:
        return f"Error generating answer: {str(e)}"

def get_answer_with_image(query: str, image_file):
    try:
        if not image_file:
            return get_answer(query), None
        # read bytes
        img_bytes = image_file.read()
        # send image + text to model
        # note: mime_type may be auto-detected; using image/png as generic
        response = model.generate_content([
            {"mime_type": "image/png", "data": img_bytes},
            query
        ])
        encoded_image = base64.b64encode(img_bytes).decode("utf-8")
        return response.text, encoded_image
    except Exception as e:
        return f"Error: {str(e)}", None
