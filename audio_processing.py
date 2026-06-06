# audio_processing.py - BULLETPROOF FFmpeg FIX
import speech_recognition as sr
from pydub import AudioSegment
from deep_translator import GoogleTranslator
import tempfile
import os
import subprocess

# ✅ BULLETPROOF: Test FFmpeg FIRST
# FFMPEG_PATH = r"D:\NK_WEB_VENGERSUpdated\TalkToTextPro\ffmpeg.exe"
# FFMPEG_PATH = r"F:\NK_WEB_VENGERSUpdated\TalkToTextPro\ffmpeg.exe"
FFMPEG_PATH = r"C:\NK_WEB_VENGERSUpdated\TalkToTextPro\ffmpeg.exe"
# FFMPEG_PATH = r"C:\Users\USER\Downloads\NK_WEB_VENGERSUpdated\TalkToTextPro\ffmpeg.exe"
print(f"🔍 Testing FFmpeg: {FFMPEG_PATH}")

# Verify FFmpeg works
try:
    result = subprocess.run([FFMPEG_PATH, "-version"], capture_output=True, text=True)
    print(f"✅ FFmpeg OK: {result.stdout[:50]}")
    AudioSegment.converter = FFMPEG_PATH
except Exception as e:
    print(f"❌ FFmpeg Error: {e}")
    raise

def audio_file_to_text(file_storage, lang="en"):
    print(f"🎵 Processing: {file_storage.filename}")
    
    # Save uploaded file
    suffix = os.path.splitext(file_storage.filename)[1]
    tmp_audio = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    file_storage.save(tmp_audio.name)
    tmp_audio.close()
    print(f"📁 Saved: {tmp_audio.name}")

    # Convert to WAV
    wav_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    wav_tmp.close()
    
    try:
        # BULLETPROOF: Use subprocess directly
        cmd = [FFMPEG_PATH, "-i", tmp_audio.name, "-ar", "16000", "-ac", "1", wav_tmp.name, "-y"]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(f"FFmpeg failed: {result.stderr}")
        print("✅ Converted to WAV")
    finally:
        os.unlink(tmp_audio.name)

    # Transcribe
    try:
        r = sr.Recognizer()
        with sr.AudioFile(wav_tmp.name) as source:
            audio = r.record(source)
            text = r.recognize_google(audio, language=lang)
        print(f"✅ Transcript: {text[:50]}...")
        return text
    finally:
        os.unlink(wav_tmp.name)

def translate_to_english(text, src_lang="en"):
    try:
        if not text.strip() or src_lang.lower() == "en":
            return text
        return GoogleTranslator(source=src_lang, target="en").translate(text)
    except:
        return text