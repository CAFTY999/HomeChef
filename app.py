from flask import Flask, request, jsonify, render_template
import sqlite3
from werkzeug.security import check_password_hash, generate_password_hash
import jwt
import datetime

app = Flask(__name__)
SECRET = "secret"

# -------- DB --------
def get_db():
    return sqlite3.connect("database.db")

# -------- PAGES --------
@app.route('/')
def home():
    return render_template("index.html")

@app.route('/patient')
def patient():
    return render_template("patient.html")

@app.route('/doctor')
def doctor():
    return render_template("doctor.html")

@app.route('/receptionist')
def receptionist():
    return render_template("receptionist.html")

# -------- REGISTER --------
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    db = get_db()
    cur = db.cursor()

    # check user
    cur.execute("SELECT * FROM users WHERE username=?", (data['email'],))
    if cur.fetchone():
        return jsonify({"msg":"User exists"}),400

    pw = generate_password_hash(data['password'])

    cur.execute("INSERT INTO users (username,password,role) VALUES (?,?,?)",
                (data['email'], pw, "patient"))

    user_id = cur.lastrowid

    cur.execute("INSERT INTO patients (user_id,name) VALUES (?,?)",
                (user_id, data['name']))

    db.commit()
    return jsonify({"msg":"Registered"})

# -------- LOGIN --------
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    db = get_db()
    cur = db.cursor()

    cur.execute("SELECT * FROM users WHERE username=?", (data['email'],))
    user = cur.fetchone()

    if not user or not check_password_hash(user[2], data['password']):
        return jsonify({"msg":"Invalid"}),401

    token = jwt.encode({
        "id": user[0],
        "role": user[3],
        "exp": datetime.datetime.utcnow()+datetime.timedelta(hours=2)
    }, SECRET, algorithm="HS256")

    return jsonify({
        "token": token,
        "role": user[3],
        "id": user[0]
    })

# -------- GET DOCTOR --------
@app.route('/get_doctor', methods=['POST'])
def get_doctor():
    data = request.json
    symptoms = data.get('symptoms',"").lower()

    db = get_db()
    cur = db.cursor()

    if "heart" in symptoms:
        spec = "Cardiology"
    elif "skin" in symptoms:
        spec = "Dermatology"
    else:
        spec = "General"

    cur.execute("""
    SELECT id,name,specialization FROM doctors 
    WHERE specialization LIKE ?
    """,(f"%{spec}%",))

    doc = cur.fetchone()

    if not doc:
        return jsonify({"msg":"No doctor found"}),404

    return jsonify({
        "doctor_id": doc[0],
        "doctor_name": doc[1],
        "specialist": doc[2]
    })

# -------- AVAILABLE SLOTS --------
@app.route('/available_slots/<int:doc_id>/<date>')
def available_slots(doc_id,date):

    all_slots = ["09:00","09:20","09:40","10:00","10:20"]

    db = get_db()
    cur = db.cursor()

    cur.execute("""
    SELECT time FROM appointments
    WHERE doctor_id=? AND date=?
    """,(doc_id,date))

    booked = [x[0] for x in cur.fetchall()]

    result = []
    for t in all_slots:
        result.append({
            "time": t,
            "available": t not in booked
        })

    return jsonify(result)

# -------- BOOK --------
@app.route('/book', methods=['POST'])
def book():
    data = request.json
    db = get_db()
    cur = db.cursor()

    cur.execute("""
    SELECT * FROM appointments
    WHERE doctor_id=? AND date=? AND time=?
    """,(data['doctor_id'],data['date'],data['time']))

    if cur.fetchone():
        return jsonify({"msg":"Slot already booked"}),400

    cur.execute("""
    INSERT INTO appointments (patient_id,doctor_id,date,time,status,symptoms)
    VALUES (?,?,?,?,?,?)
    """,(
        data['patient_id'],
        data['doctor_id'],
        data['date'],
        data['time'],
        "pending",
        data['symptoms']
    ))

    db.commit()
    return jsonify({"msg":"Appointment booked"})

# -------- PATIENT APPOINTMENTS --------
@app.route('/appointments/<int:pid>')
def patient_appts(pid):
    db = get_db()
    cur = db.cursor()

    cur.execute("""
    SELECT d.name, a.date, a.time, a.status, a.symptoms
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.patient_id=?
    """,(pid,))

    return jsonify(cur.fetchall())

# -------- DOCTOR VIEW --------
@app.route('/doctor_appts/<int:doc_id>')
def doctor_appts(doc_id):
    db = get_db()
    cur = db.cursor()

    cur.execute("""
    SELECT a.id, p.name, a.date, a.time, a.status, a.symptoms
    FROM appointments a
    JOIN patients p ON a.patient_id = p.user_id
    WHERE a.doctor_id=?
    """,(doc_id,))

    return jsonify(cur.fetchall())

# -------- APPROVE --------
@app.route('/approve/<int:id>')
def approve(id):
    db = get_db()
    cur = db.cursor()

    cur.execute("UPDATE appointments SET status='approved' WHERE id=?",(id,))
    db.commit()

    return jsonify({"msg":"Approved"})
@app.route('/doctors')
def get_doctors():
    db = get_db()
    cur = db.cursor()

    cur.execute("SELECT id,name,specialization FROM doctors")
    return jsonify(cur.fetchall())
@app.route('/search_patient/<name>')
def search_patient(name):
    db = get_db()
    cur = db.cursor()

    cur.execute("""
    SELECT user_id,name FROM patients 
    WHERE name LIKE ?
    """, (f"%{name}%",))

    return jsonify(cur.fetchall())
@app.route('/rec_book', methods=['POST'])
def rec_book():
    data = request.json
    db = get_db()
    cur = db.cursor()

    # prevent double booking
    cur.execute("""
    SELECT * FROM appointments
    WHERE doctor_id=? AND date=? AND time=?
    """,(data['doctor_id'],data['date'],data['time']))

    if cur.fetchone():
        return jsonify({"msg":"Slot already booked"}),400

    cur.execute("""
    INSERT INTO appointments (patient_id,doctor_id,date,time,status,symptoms)
    VALUES (?,?,?,?,?,?)
    """,(
        data['patient_id'],
        data['doctor_id'],
        data['date'],
        data['time'],
        "approved",  # receptionist auto-approved
        "N/A"
    ))

    db.commit()
    return jsonify({"msg":"Booked by receptionist"})
@app.route('/filter_appts')
def filter_appts():
    doctor = request.args.get("doctor")
    date = request.args.get("date")

    db = get_db()
    cur = db.cursor()

    query = """
    SELECT a.id, p.name, d.name, a.date, a.time, a.status
    FROM appointments a
    JOIN patients p ON a.patient_id = p.user_id
    JOIN doctors d ON a.doctor_id = d.id
    WHERE 1=1
    """

    params = []

    if doctor:
        query += " AND d.name LIKE ?"
        params.append(f"%{doctor}%")

    if date:
        query += " AND a.date=?"
        params.append(date)

    cur.execute(query, params)
    return jsonify(cur.fetchall())

# -------- RUN --------
if __name__ == '__main__':
    app.run(debug=True)