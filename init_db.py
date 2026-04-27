import sqlite3
from werkzeug.security import generate_password_hash

conn = sqlite3.connect("database.db")
cur = conn.cursor()

# ---------------- USERS ----------------
cur.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
)
""")

# ---------------- DOCTORS ----------------
cur.execute("""
CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    specialization TEXT
)
""")

# ---------------- PATIENTS ----------------
cur.execute("""
CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT
)
""")

# ---------------- APPOINTMENTS ----------------
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

# ---------------- DEFAULT DATA ----------------

def insert_user(username, password, role):
    try:
        cur.execute("INSERT INTO users (username,password,role) VALUES (?,?,?)",
                    (username, generate_password_hash(password), role))
        return cur.lastrowid
    except:
        return None  # already exists

# -------- DOCTORS --------
doctors = [
    ("doc1", "1234", "Dr. Sharma", "General"),
    ("doc2", "1234", "Dr. Reddy", "Cardiology"),
    ("doc3", "1234", "Dr. Mehta", "Dermatology"),
    ("doc4", "1234", "Dr. Khan", "Neurology"),
]

for username, pw, name, spec in doctors:
    user_id = insert_user(username, pw, "doctor")
    if user_id:
        cur.execute("""
        INSERT INTO doctors (user_id,name,specialization)
        VALUES (?,?,?)
        """, (user_id, name, spec))

# -------- RECEPTIONISTS --------
receptionists = [
    ("rec1", "1234"),
    ("rec2", "1234")
]

for username, pw in receptionists:
    insert_user(username, pw, "receptionist")

# -------- SAMPLE PATIENT (OPTIONAL) --------
patient_id = insert_user("patient1", "1234", "patient")
if patient_id:
    cur.execute("INSERT INTO patients (user_id,name) VALUES (?,?)",
                (patient_id, "Test Patient"))

# ---------------- COMMIT ----------------
conn.commit()
conn.close()

print("DB Initialized with doctors + receptionists 🚀")