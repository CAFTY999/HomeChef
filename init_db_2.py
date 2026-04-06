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
    department TEXT
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

# SLOTS
cur.execute("""
CREATE TABLE IF NOT EXISTS slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER,
    time TEXT,
    is_booked INTEGER DEFAULT 0
)
""")

# APPOINTMENTS
cur.execute("""
CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    doctor_id INTEGER,
    slot_id INTEGER,
    status TEXT,
    symptoms TEXT
)
""")

# -------- DEFAULT USERS --------

doc_pass = generate_password_hash("1234")
rec_pass = generate_password_hash("1234")

# Doctor 1
cur.execute("INSERT OR IGNORE INTO users VALUES (1,'doc1',?, 'doctor')", (doc_pass,))
cur.execute("INSERT OR IGNORE INTO doctors VALUES (1,1,'Dr. Sharma','general')")

# Doctor 2
cur.execute("INSERT OR IGNORE INTO users VALUES (2,'doc2',?, 'doctor')", (doc_pass,))
cur.execute("INSERT OR IGNORE INTO doctors VALUES (2,2,'Dr. Mehta','cardio')")

# Receptionist
cur.execute("INSERT OR IGNORE INTO users VALUES (3,'rec1',?, 'receptionist')", (rec_pass,))

# Slots (15 min)
times = ["10:00","10:15","10:30","10:45","11:00"]
for t in times:
    cur.execute("INSERT INTO slots (doctor_id,time) VALUES (1,?)", (t,))
    cur.execute("INSERT INTO slots (doctor_id,time) VALUES (2,?)", (t,))

conn.commit()
conn.close()
print("DB Ready")