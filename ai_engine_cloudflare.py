# ai_engine_cloudflare.py
import os
import requests
import base64
from dotenv import load_dotenv

load_dotenv()

def generate_image(prompt, model="@cf/stabilityai/stable-diffusion-xl-base-1.0", width=1024, height=1024, n=1):
    """
    Generate image using Cloudflare's free Stable Diffusion API.
    Returns base64-encoded image.
    """
    account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID")
    api_token = os.getenv("CLOUDFLARE_API_TOKEN")
    if not account_id or not api_token:
        raise ValueError("CLOUDFLARE_CREDENTIALS required in .env")

    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}"
    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "prompt": prompt,
        "width": width,
        "height": height,
        "num_outputs": n,
        "num_inference_steps": 28,
        "guidance_scale": 7.5,
        "negative_prompt": ""
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=120)
        print(f"Status Code: {response.status_code}")
        print(f"Response Text: {response.text}")
        print(f"Content-Type: {response.headers.get('Content-Type')}")
        print(f"Content-Length: {response.headers.get('Content-Length')}")  # Debug: Check response size
        if not response.text and not response.content:
            raise Exception("Empty response from API")
        if response.status_code == 400:
            raise Exception(f"400 Bad Request - Check payload or enable Workers: {response.text}")
        response.raise_for_status()

        # Try to parse as JSON first
        try:
            data = response.json()
            if not data.get("success"):
                raise Exception(f"API failed: {data.get('errors', [])}")
            result = data.get("result", [])
            if not result:
                raise Exception("No image generated - Enable Workers & Pages first")
            first_image = result[0]
        except ValueError:
            # Fallback to handle raw binary or text as base64
            raw_data = response.content  # Use content instead of text for binary
            first_image = base64.b64encode(raw_data).decode("utf-8")

        # Validate and decode base64
        try:
            if first_image.startswith("data:image"):
                base64_data = first_image.split(",")[1]
            else:
                base64_data = first_image
            image_bytes = base64.b64decode(base64_data)
            return base64.b64encode(image_bytes).decode("utf-8")
        except base64.binascii.Error:
            raise Exception("Invalid base64 data in response")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Network error: {str(e)} - Response: {response.text if 'response' in locals() else 'No response'}")
    except Exception as e:
        raise Exception(f"Cloudflare error: {str(e)}")