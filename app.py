from flask import Flask, render_template, request, jsonify, send_file, session, redirect, url_for
from ai_engine_gemini import get_answer, get_answer_with_image
from pdf_processing import extract_text_from_pdf
from audio_processing import audio_file_to_text, translate_to_english
from db import save_notes, get_notes, save_user, check_user
from dotenv import load_dotenv
import os, tempfile
import google.generativeai as genai

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = os.getenv("SECRET_KEY", "supersecretkey")

chat_history = []
pdf_memory = ""
last_notes = ""

@app.route("/")
def index():
    return render_template("generative/index.html")

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
            return redirect(url_for('login'))
        return jsonify({"error": "Username already exists"}), 400
    return render_template("register.html")

@app.route("/logout")
def logout():
    session.pop('user', None)
    return redirect(url_for('index'))

@app.route("/history")
def history():
    if not session.get('user'):
        return redirect(url_for('login'))
    notes = get_notes(session['user'])
    return render_template("history.html", notes=notes)

@app.route("/ask", methods=["POST"])
def ask():
    global chat_history, pdf_memory, last_notes
    data = request.get_json() or {}
    query = data.get("query", "").strip()
    if not query:
        return jsonify({"error": "Empty query"}), 400

    chat_history.append({"role": "user", "content": query})
    context = "\n".join([f"{m['role']}: {m['content']}" for m in chat_history])

    if pdf_memory and ("pdf" in query.lower() or "summarize" in query.lower()):
        context += f"\n\nHere is PDF content:\n{pdf_memory[:3000]}"

    answer = get_answer(context)
    chat_history.append({"role": "bot", "content": answer})
    last_notes = answer
    return jsonify({"answer": answer})

@app.route("/ask_with_image", methods=["POST"])
def ask_with_image():
    global chat_history, last_notes
    query = request.form.get("query", "").strip()
    image_file = request.files.get("image")
    if not query:
        return jsonify({"error": "Empty query"}), 400

    answer, encoded_image = get_answer_with_image(query, image_file)
    chat_history.append({"role": "user", "content": query})
    chat_history.append({"role": "bot", "content": answer})
    last_notes = answer
    return jsonify({"answer": answer, "image": encoded_image})

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
    global pdf_memory, last_notes, chat_history
    if not pdf_memory:
        return jsonify({"error": "No PDF loaded"}), 400
    prompt = f"Please summarize the following meeting/document and produce: Executive Summary, Key Discussion Points, Decisions, Action Items, Sentiment.\n\n{pdf_memory[:30000]}"
    answer = get_answer(prompt)
    chat_history.append({"role": "bot", "content": answer})
    last_notes = answer
    save_notes(session['user'], pdf_memory, pdf_memory, '', answer)
    return jsonify({"summary": answer})

@app.route("/upload_audio", methods=["POST"])
def upload_audio():
    global last_notes, chat_history
    if "audio" not in request.files:
        return jsonify({"error": "No audio uploaded"}), 400
    audio_file = request.files["audio"]
    lang = request.form.get("lang", "en") or "en"

    try:
        transcript = audio_file_to_text(audio_file, lang=lang)
        english_text = translate_to_english(transcript, src_lang=lang)
        summary_prompt = f"Summarize the following meeting transcript. Provide Executive Summary, Key Points, Decisions, Action Items, and Sentiment.\n\n{english_text}"
        summary = get_answer(summary_prompt)

        chat_history.append({"role": "user", "content": f"[Uploaded audio transcript] {transcript[:200]}"})
        chat_history.append({"role": "bot", "content": summary})
        last_notes = summary
        save_notes(session['user'], transcript, english_text, '', summary)

        return jsonify({
            "transcript": transcript,
            "english_text": english_text,
            "summary": summary
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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

@app.route("/_health")
def health():
    return "ok"

if __name__ == "__main__":
    app.run(debug=True, port=5001)


