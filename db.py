import sqlite3
from pymongo import MongoClient
import os
from dotenv import load_dotenv
import bcrypt

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db_mongo = client["talktotext"]
notes_collection = db_mongo["meeting_notes"]

SQLITE_DB = "users.db"

def init_sqlite_db():
    conn = sqlite3.connect(SQLITE_DB)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

init_sqlite_db()

def save_user(username, password):
    """
    Save a new user to SQLite database with hashed password.
    Returns True if successful, False if username already exists.
    """
    try:
        conn = sqlite3.connect(SQLITE_DB)
        cursor = conn.cursor()
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed_password))
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        conn.close()
        return False

def check_user(username, password):
    """
    Check if user exists and password is correct.
    Returns True if credentials are valid, False otherwise.
    """
    conn = sqlite3.connect(SQLITE_DB)
    cursor = conn.cursor()
    cursor.execute("SELECT password FROM users WHERE username = ?", (username,))
    result = cursor.fetchone()
    conn.close()
    if result:
        return bcrypt.checkpw(password.encode('utf-8'), result[0])
    return False

def save_notes(user, raw, translated, cleaned, final_notes):
    notes_collection.insert_one({
        "user": user,
        "raw_transcript": raw,
        "translated": translated,
        "cleaned": cleaned,
        "final_notes": final_notes
    })

def get_notes(user):
    return list(notes_collection.find({"user": user}))