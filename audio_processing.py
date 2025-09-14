# audio_processing.py
import speech_recognition as sr
from pydub import AudioSegment
from deep_translator import GoogleTranslator
import tempfile
import os

def audio_file_to_text(file_storage, lang="en"):
    """
    file_storage: Werkzeug FileStorage object (from Flask request.files['audio'])
    lang: language code used by Google recognizer (e.g., 'en', 'ur', 'fr')
    returns: transcript text
    """
    # save to temp file (preserve original extension if available)
    suffix = ""
    if hasattr(file_storage, "filename") and "." in file_storage.filename:
        suffix = os.path.splitext(file_storage.filename)[1]
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix or ".mp3")
    file_storage.save(tmp.name)
    tmp.flush()
    tmp.close()

    # convert to wav (SpeechRecognition works well with WAV)
    wav_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    sound = AudioSegment.from_file(tmp.name)
    sound.export(wav_tmp.name, format="wav")
    wav_tmp.flush()
    wav_tmp.close()

    try:
        r = sr.Recognizer()
        with sr.AudioFile(wav_tmp.name) as source:
            audio = r.record(source)
            text = r.recognize_google(audio, language=lang)
    finally:
        # cleanup temp files
        try:
            os.remove(tmp.name)
        except: pass
        try:
            os.remove(wav_tmp.name)
        except: pass

    return text

def translate_to_english(text, src_lang="en"):
    """
    Translate 'text' to English if src_lang != 'en'.
    If translation fails, returns original text.
    """
    try:
        if not text.strip():
            return text
        if src_lang.lower() == "en":
            return text
        return GoogleTranslator(source=src_lang, target="en").translate(text)
    except Exception:
        return text
