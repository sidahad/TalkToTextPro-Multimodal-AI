import sqlite3
from pymongo import MongoClient
import os
from dotenv import load_dotenv
import bcrypt
from datetime import datetime

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db_mongo = client["talktotexts"]
notes_collection = db_mongo["meeting_notes"]
chat_collection = db_mongo["chat_history"]  # Ensure this collection is used

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
        "final_notes": final_notes,
        "timestamp": datetime.utcnow()
    })

def get_notes(user):
    return list(notes_collection.find({"user": user}).sort("timestamp", -1))

def save_chat_message(user, chat_id, sender, text, image=None, file_name=None):
    """Save a single chat message to MongoDB with error logging"""
    try:
        chat_document = {
            "user": user,
            "chat_id": chat_id,
            "sender": sender,
            "text": text,
            "image": image,
            "file_name": file_name,
            "timestamp": datetime.utcnow()
        }
        result = chat_collection.insert_one(chat_document)
        print(f"Inserted chat message with ID: {result.inserted_id}")  # Debug log
    except Exception as e:
        print(f"Error saving chat message: {str(e)}")  # Log any errors

def get_user_chats(user):
    """Get all chat sessions for a user with latest message preview"""
    pipeline = [
        {"$match": {"user": user}},
        {"$sort": {"timestamp": -1}},
        {"$group": {
            "_id": "$chat_id",
            "latest_message": {"$last": "$text"},
            "latest_timestamp": {"$last": "$timestamp"},
            "message_count": {"$sum": 1}
        }},
        {"$sort": {"latest_timestamp": -1}},
        {"$limit": 50}
    ]
    return list(chat_collection.aggregate(pipeline))

def get_chat_messages(user, chat_id):
    """Get all messages for a specific chat session"""
    return list(chat_collection.find({"user": user, "chat_id": chat_id}).sort("timestamp", 1))

def delete_chat(user, chat_id):
    """Delete a specific chat session"""
    chat_collection.delete_many({"user": user, "chat_id": chat_id})

def get_pinned_chats(user):
    """Get pinned chat sessions (placeholder)"""
    return get_user_chats(user)[:5]
