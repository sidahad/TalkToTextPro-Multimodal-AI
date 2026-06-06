# ai_engine_gemini.py - FIXED FOR IMAGE UPLOADS!
import os
import base64
import time
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.0-flash-exp")
chat_session = model.start_chat(history=[])

def get_answer(query: str) -> str:
    time.sleep(4)
    try:
        response = chat_session.send_message(query)
        return response.text
    except Exception as e:
        return f"Error: {str(e)}"

def get_answer_with_image(query: str, image_bytes=None):  # 🔥 FIXED: BYTES not FILE!
    time.sleep(4)
    try:
        if not image_bytes:
            return get_answer(query), None
        
        # 🔥 FIXED: Use passed BYTES (not file.read()!)
        encoded_image = base64.b64encode(image_bytes).decode("utf-8")
        
        # Auto-detect MIME type
        mime_type = "image/jpeg"
        if image_bytes.startswith(b'\xff\xd8\xff'):
            mime_type = "image/jpeg"
        elif image_bytes.startswith(b'\x89PNG'):
            mime_type = "image/png"
        elif image_bytes.startswith(b'RIFF') and b'WEBP' in image_bytes[:12]:
            mime_type = "image/webp"
        
        response = model.generate_content([
            {
                "inline_data": {
                    "mime_type": mime_type,
                    "data": encoded_image
                }
            },
            query
        ])
        return response.text, encoded_image
    except Exception as e:
        return f"Error: {str(e)}", None
