from flask import Flask, render_template, request, jsonify, send_file, session, redirect, url_for
from ai_engine_gemini import get_answer as get_gemini_answer, get_answer_with_image
from ai_engine_openai import get_answer as get_openai_answer  # Only Groq
from ai_engine_cloudflare import generate_image
from pdf_processing import extract_text_from_pdf
from audio_processing import audio_file_to_text, translate_to_english
from db import save_notes, get_notes, save_user, check_user, save_chat_message, get_user_chats, get_chat_messages, delete_chat
from dotenv import load_dotenv
import os, tempfile
import google.generativeai as genai
from datetime import datetime
from gtts import gTTS
import base64
import time

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = os.getenv("SECRET_KEY", "supersecretkey")

user_chat_history = {}
pdf_memory = ""
last_notes = ""

# ================================
# ROUTES
# ================================

@app.route("/")
def index():
    return render_template("generative/index.html")


# FIXED: Added missing @
@app.route("/subscribe", methods=["POST"])
def subscribe():
    email = request.form.get("email")
    if not email:
        return jsonify({"error": "Email is required"}), 400
    print(f"New subscription from: {email}")
    return redirect(url_for('index'))


@app.route("/chat")
def chat():
    if not session.get('user'):
        return redirect(url_for('login'))
    return render_template("index.html")


@app.route("/main")
def main_index():
    return render_template("index.html")


@app.route("/light")
def light():
    if not session.get('user'):
        return redirect(url_for('login'))
    return render_template("light.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        if username and password and check_user(username, password):
            session['user'] = username
            if username not in user_chat_history:
                user_chat_history[username] = []
            return redirect(url_for('chat'))
        return jsonify({"error": "Invalid username or password"}), 400
    return render_template("login.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400
        if save_user(username, password):
            session['user'] = username
            user_chat_history[username] = []
            return redirect(url_for('login'))
        return jsonify({"error": "Username already exists"}), 400
    return render_template("register.html")


@app.route("/logout")
def logout():
    session.pop('user', None)
    session.pop('current_chat_id', None)
    return redirect(url_for('index'))


@app.route("/history")
def history():
    if not session.get('user'):
        return redirect(url_for('login'))
    notes = get_notes(session['user'])
    return render_template("history.html", notes=notes)


# ================================
# MAIN CHAT: TEXT + MODEL
# ================================
@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json() or {}
    query = data.get("query", "").strip()
    model = data.get("model", "gemini").lower()

    if not query:
        return jsonify({"error": "Empty query"}), 400

    user = session.get('user')
    if not user:
        return jsonify({"error": "Not logged in"}), 401

    chat_id = session.get('current_chat_id')
    if not chat_id:
        chat_id = f"chat_{user}_{int(time.time())}"
        session['current_chat_id'] = chat_id
        user_chat_history[user] = []

    chat_history = user_chat_history[user]
    chat_history.append({"role": "user", "content": query})

    # Inject PDF context if relevant
    if pdf_memory and ("pdf" in query.lower() or "summarize" in query.lower()):
        query += f"\n\nHere is PDF content:\n{pdf_memory[:3000]}"

    answer = ""
    image_base64 = None

    if model == "gemini":
        context = "\n".join([f"{m['role']}: {m['content']}" for m in chat_history])
        answer = get_gemini_answer(context)

    elif model == "cloudflare":
        try:
            image_base64 = generate_image(query)
            answer = "Generated image with Cloudflare AI:"
        except Exception as e:
            answer = f"Error generating image: {str(e)}"

    elif model == "groq":
        messages = [{"role": "system", "content": "You are a helpful assistant."}]
        for msg in chat_history:
            api_role = "assistant" if msg["role"] == "bot" else msg["role"]
            messages.append({"role": api_role, "content": msg["content"]})
        answer = get_openai_answer(messages, model="groq")

    else:
        return jsonify({"error": "Invalid model. Use: gemini, groq, cloudflare"}), 400

    chat_history.append({"role": "bot", "content": answer, "image": image_base64})
    global last_notes
    last_notes = answer

    save_chat_message(user, chat_id, "user", query)
    save_chat_message(user, chat_id, "bot", answer, image_base64)

    return jsonify({"answer": answer, "image_base64": image_base64, "chat_id": chat_id})


# ================================
# IMAGE + TEXT
# ================================
@app.route("/ask_with_image", methods=["POST"])
def ask_with_image():
    user = session.get('user')
    if not user:
        return jsonify({"error": "Not logged in"}), 401

    query = request.form.get("query", "").strip()
    image_file = request.files.get("image")
    if not image_file:
        return jsonify({"error": "No image uploaded"}), 400

    chat_id = session.get('current_chat_id')
    if not chat_id:
        chat_id = f"chat_{user}_{int(time.time())}"
        session['current_chat_id'] = chat_id
        user_chat_history[user] = []

    image_bytes = image_file.read()
    encoded_image = base64.b64encode(image_bytes).decode("utf-8")

    user_msg = query if query else "Image uploaded"
    save_chat_message(user, chat_id, "user", user_msg, encoded_image, image_file.filename)

    chat_history = user_chat_history[user]
    chat_history.append({"role": "user", "content": query})

    answer, _ = get_answer_with_image(query, image_bytes)
    chat_history.append({"role": "bot", "content": answer})
    global last_notes
    last_notes = answer

    save_chat_message(user, chat_id, "bot", answer)

    return jsonify({
        "answer": answer,
        "image_base64": encoded_image,
        "chat_id": chat_id
    })


# ================================
# PDF UPLOAD & SUMMARIZE
# ================================
@app.route("/upload_pdf", methods=["POST"])
def upload_pdf():
    global pdf_memory, last_notes
    if "pdf" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["pdf"]
    text = extract_text_from_pdf(file)
    if text.startswith("Error"):
        pdf_memory = ""
    else:
        pdf_memory = text
        save_notes(session['user'], text, text, '', text)
    last_notes = text
    return jsonify({"text": text})


@app.route("/summarize_pdf", methods=["POST"])
def summarize_pdf():
    global pdf_memory, last_notes
    if not pdf_memory:
        return jsonify({"error": "No PDF loaded"}), 400

    user = session.get('user')
    chat_id = session.get('current_chat_id')
    if not chat_id:
        chat_id = f"chat_{user}_{int(time.time())}"
        session['current_chat_id'] = chat_id
        user_chat_history[user] = []

    data = request.get_json() or {}
    model = data.get("model", "gemini").lower()

    prompt = f"Please summarize the following meeting/document and produce: Executive Summary, Key Discussion Points, Decisions, Action Items, Sentiment.\n\n{pdf_memory[:30000]}"

    if model == "gemini":
        answer = get_gemini_answer(prompt)
    elif model == "groq":
        messages = [{"role": "user", "content": prompt}]
        answer = get_openai_answer(messages, model="groq")
    else:
        return jsonify({"error": "Invalid model. Use: gemini or groq"}), 400

    last_notes = answer
    save_notes(session['user'], pdf_memory, pdf_memory, '', answer)

    save_chat_message(user, chat_id, "user", "Summarize my PDF")
    save_chat_message(user, chat_id, "bot", answer)

    return jsonify({"summary": answer})


# ================================
# AUDIO PROCESSING
# ================================
@app.route("/upload_audio", methods=["POST"])
def upload_audio():
    global last_notes
    if "audio" not in request.files:
        return jsonify({"error": "No audio uploaded"}), 400
    audio_file = request.files["audio"]
    lang = request.form.get("lang", "en") or "en"

    user = session.get('user')
    chat_id = session.get('current_chat_id')
    if not chat_id:
        chat_id = f"chat_{user}_{int(time.time())}"
        session['current_chat_id'] = chat_id
        user_chat_history[user] = []

    try:
        transcript = audio_file_to_text(audio_file, lang=lang)
        english_text = translate_to_english(transcript, src_lang=lang)
        summary_prompt = f"Summarize the following meeting transcript. Provide Executive Summary, Key Points, Decisions, Action Items, and Sentiment.\n\n{english_text}"
        summary = get_gemini_answer(summary_prompt)

        save_chat_message(user, chat_id, "user", f"[Uploaded audio transcript] {transcript[:200]}")
        save_chat_message(user, chat_id, "bot", summary)
        last_notes = summary
        save_notes(session['user'], transcript, english_text, '', summary)

        return jsonify({
            "transcript": transcript,
            "english_text": english_text,
            "summary": summary
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ================================
# UTILS
# ================================
@app.route("/download_notes", methods=["GET"])
def download_notes():
    global last_notes
    if not last_notes:
        return "No notes available", 400
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".txt")
    tmp.write(last_notes.encode("utf-8"))
    tmp.flush()
    tmp.close()
    return send_file(tmp.name, as_attachment=True, download_name="meeting_notes.txt")


@app.route("/api/new_chat", methods=["POST"])
def api_new_chat():
    user = session.get('user')
    if not user:
        return jsonify({"error": "Not logged in"}), 401

    chat_id = f"chat_{user}_{int(time.time())}"
    session['current_chat_id'] = chat_id
    user_chat_history[user] = []

    save_chat_message(user, chat_id, "system", "New chat started.")
    return jsonify({"chat_id": chat_id, "success": True})


@app.route("/speak_urdu", methods=["POST"])
def speak_urdu():
    text = request.form.get("text", "").strip()
    if not text:
        return jsonify({"error": "No text provided"}), 400

    try:
        # Generate Urdu TTS
        tts = gTTS(text=text, lang="ur", slow=False)
        fp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
        tts.save(fp.name)
        fp.close()

        # Read and encode
        with open(fp.name, "rb") as audio_file:
            audio_base64 = base64.b64encode(audio_file.read()).decode("utf-8")

        # Clean up
        os.unlink(fp.name)

        return jsonify({
            "audio_base64": audio_base64,
            "mime_type": "audio/mpeg"
        })

    except Exception as e:
        print(f"[Urdu TTS Error] {str(e)}")
        return jsonify({"error": f"TTS failed: {str(e)}"}), 500


# ================================
# CHAT HISTORY API
# ================================
@app.route("/api/chats")
def api_chats():
    user = session.get('user')
    if not user:
        return jsonify({"error": "Not logged in"}), 401

    chats = get_user_chats(user)
    return jsonify({
        "chats": [
            {
                "chat_id": chat["_id"],
                "preview": chat["latest_message"][:50] + "..." if len(chat["latest_message"]) > 50 else chat["latest_message"],
                "timestamp": chat["latest_timestamp"].strftime("%Y-%m-%d %H:%M"),
                "message_count": chat["message_count"]
            }
            for chat in chats
        ]
    })


@app.route("/api/chat/<chat_id>")
def api_chat_messages(chat_id):
    user = session.get('user')
    if not user:
        return jsonify({"error": "Not logged in"}), 401

    messages = get_chat_messages(user, chat_id)
    return jsonify({
        "messages": [
            {
                "sender": msg["sender"],
                "text": msg["text"],
                "image": msg["image"],
                "file_name": msg["file_name"],
                "timestamp": msg["timestamp"].strftime("%H:%M")
            }
            for msg in messages
        ]
    })


@app.route("/api/delete_chat/<chat_id>", methods=["DELETE"])
def api_delete_chat(chat_id):
    user = session.get('user')
    if not user:
        return jsonify({"error": "Not logged in"}), 401

    delete_chat(user, chat_id)
    if session.get('current_chat_id') == chat_id:
        session.pop('current_chat_id', None)
    return jsonify({"success": True})


@app.route("/load_chat/<chat_id>", methods=["POST"])
def load_chat(chat_id):
    session['current_chat_id'] = chat_id
    print(f"Loaded chat {chat_id} for user {session.get('user')}")
    return jsonify({"success": True})


@app.route("/api/save_message", methods=["POST"])
def save_message():
    user = session.get('user')
    if not user:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json()
    if not data or "chat_id" not in data or "sender" not in data or "text" not in data:
        return jsonify({"error": "Missing required fields"}), 400

    chat_id = data['chat_id']
    sender = data['sender']
    text = data['text']
    image = data.get('image')
    file_name = data.get('file_name')

    save_chat_message(user, chat_id, sender, text, image, file_name)
    return jsonify({"success": True})


@app.route("/_health")
def health():
    return "ok"


if __name__ == "__main__":
    app.run(debug=True, port=5001)
