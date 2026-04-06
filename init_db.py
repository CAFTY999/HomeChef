import sqlite3
from werkzeug.security import generate_password_hash

conn = sqlite3.connect("database.db")
cur = conn.cursor()

# USERS
cur.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
)
""")

# DOCTORS
cur.execute("""
CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    specialization TEXT
)
""")

# PATIENTS
cur.execute("""
CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT
)
""")

# APPOINTMENTS (IMPORTANT CHANGE)
cur.execute("""
CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    doctor_id INTEGER,
    date TEXT,
    time TEXT,
    status TEXT,
    symptoms TEXT
)
""")

# DEFAULT USERS
doctor_pass = generate_password_hash("1234")

cur.execute("INSERT INTO users (username,password,role) VALUES (?,?,?)",
            ("doc1", doctor_pass, "doctor"))

doc_user_id = cur.lastrowid

cur.execute("INSERT INTO doctors (user_id,name,specialization) VALUES (?,?,?)",
            (doc_user_id, "Dr. Sharma", "General"))

conn.commit()
conn.close()

print("DB Ready 🚀")