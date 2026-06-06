# ai_engine_openai.py - Handles Groq (OpenAI-compatible API only)
import os
import time
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

def get_client():
    return OpenAI(
        api_key=os.getenv("GROQ_API_KEY"),
        base_url="https://api.groq.com/openai/v1"
    ), "llama-3.3-70b-versatile"

def get_answer(messages: list, model: str = "groq") -> str:
    if model != "groq":
        return "Error: Only Groq is supported."

    time.sleep(1)  # Rate limit buffer
    try:
        client, model_name = get_client()
        print(f"Using GROQ: {model_name}")
        
        response = client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=0.7,
            max_tokens=2000
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"GROQ ERROR: {str(e)}")
        return f"Error: {str(e)}"