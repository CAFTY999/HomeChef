from flask import Flask, render_template, request, redirect, session
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = "secret123"

def get_user(username):
    conn = sqlite3.connect("database.db")
    cur = conn.cursor()
    cur.execute("SELECT id, password, role FROM users WHERE username=?", (username,))
    user = cur.fetchone()
    conn.close()
    return user

@app.route("/")
def home():
    return render_template("home.html")
@app.route("/login", methods=["POST"])
def login():
    username = request.form["username"]
    password = request.form["password"]

    user = get_user(username)

    if user and check_password_hash(user[1], password):

        session["user_id"] = user[0]
        session["role"] = user[2]

        # 🔵 PATIENT LOGIN FLOW
        if user[2] == "patient":

            conn = sqlite3.connect("database.db")
            cur = conn.cursor()

            cur.execute(
                "SELECT profile_completed FROM patients WHERE user_id=?",
                (user[0],)
            )
            p = cur.fetchone()

            conn.close()

            # first login OR profile incomplete
            if not p or p[0] == 0:
                return redirect("/complete_profile")

            return redirect("/patient")

        # 🔵 DOCTOR / PHARMACY
        return redirect(f"/{user[2]}")

    return "Invalid credentials"

@app.route("/signup", methods=["POST"])
def signup():
    username = request.form["username"]
    password = generate_password_hash(request.form["password"])

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    try:
        # create user
        cur.execute(
            "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
            (username, password, "patient")
        )

        user_id = cur.lastrowid

        # create EMPTY patient profile row
        cur.execute("""
            INSERT INTO patients (user_id, profile_completed)
            VALUES (?, 0)
        """, (user_id,))

        conn.commit()

    except:
        conn.close()
        return "User already exists"

    conn.close()

    return redirect("/")

@app.route("/complete_profile", methods=["GET", "POST"])
def complete_profile():

    if session.get("role") != "patient":
        return redirect("/")

    if request.method == "POST":

        name = request.form["name"]
        age = request.form["age"]
        gender = request.form["gender"]
        phone = request.form["phone"]
        address = request.form["address"]
        blood = request.form["blood"]
        allergies = request.form["allergies"]
        chronic = request.form["chronic"]
        emergency = request.form["emergency"]

        conn = sqlite3.connect("database.db")
        cur = conn.cursor()

        cur.execute("""
            UPDATE patients
            SET name=?, age=?, gender=?, phone=?,
                address=?, blood_group=?, allergies=?,
                chronic_conditions=?, emergency_contact=?,
                profile_completed=1
            WHERE user_id=?
        """, (name, age, gender, phone,
              address, blood, allergies,
              chronic, emergency,
              session["user_id"]))

        conn.commit()
        conn.close()

        return redirect("/patient")

    return render_template("complete_profile.html")

# ---------------- PATIENT DASHBOARD ----------------
@app.route("/patient")
def patient():
    user_id = session.get("user_id")

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    cur.execute("SELECT id FROM patients WHERE user_id=?", (user_id,))
    patient = cur.fetchone()

    if not patient:
        cur.execute(
            "INSERT INTO patients (user_id, name, age, gender, phone) VALUES (?, ?, ?, ?, ?)",
            (user_id, "New Patient", 0, "-", "-")
        )
        conn.commit()
        cur.execute("SELECT id FROM patients WHERE user_id=?", (user_id,))
        patient = cur.fetchone()

    patient_id = patient[0]

    cur.execute("""
        SELECT appointments.appointment_date, doctors.name, appointments.status
        FROM appointments
        JOIN doctors ON appointments.doctor_id = doctors.id
        WHERE appointments.patient_id=?
    """, (patient_id,))
    appointments = cur.fetchall()

    conn.close()

    return render_template("patient_dashboard.html", appointments=appointments)

@app.route("/patient_profile", methods=["GET", "POST"])
def patient_profile():

    if session.get("role") != "patient":
        return redirect("/")

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    if request.method == "POST":

        cur.execute("""
            UPDATE patients
            SET name=?,
                age=?,
                gender=?,
                phone=?,
                address=?,
                blood_group=?,
                allergies=?,
                chronic_conditions=?,
                emergency_contact=?
            WHERE user_id=?
        """, (
            request.form["name"],
            request.form["age"],
            request.form["gender"],
            request.form["phone"],
            request.form["address"],
            request.form["blood"],
            request.form["allergies"],
            request.form["chronic"],
            request.form["emergency"],
            session["user_id"]
        ))

        conn.commit()

    cur.execute("""
        SELECT name, age, gender, phone,
               address, blood_group,
               allergies, chronic_conditions,
               emergency_contact
        FROM patients
        WHERE user_id=?
    """, (session["user_id"],))

    patient = cur.fetchone()

    conn.close()

    return render_template("patient_profile.html",
                           patient=patient)

@app.route("/book", methods=["GET", "POST"])
def book():

    if session.get("role") != "patient":
        return redirect("/")

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    # get patient id
    cur.execute("SELECT id FROM patients WHERE user_id=?", (session["user_id"],))
    patient = cur.fetchone()

    if not patient:
        return redirect("/patient_profile")

    patient_id = patient[0]

    # booking submit
    if request.method == "POST":

        doctor_id = request.form["doctor_id"]
        date = request.form["date"]
        time = request.form["time"]
        symptoms = request.form["symptoms"]

        cur.execute("""
            INSERT INTO appointments
            (patient_id, doctor_id, appointment_date, appointment_time, status, symptoms)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            patient_id,
            doctor_id,
            date,
            time,
            "Pending",
            symptoms
        ))

        conn.commit()
        conn.close()

        return redirect("/patient")

    # load doctors
    # load doctors
    cur.execute("""
        SELECT id, name, department
        FROM doctors
    """)
    doctors = cur.fetchall()

    # suggestion map
    suggested = None

    if request.method == "GET":
        symptom = request.args.get("symptom")

        if symptom:

            symptom = symptom.lower()

            if "fever" in symptom or "cold" in symptom or "cough" in symptom:
                suggested = "General Medicine"

            elif "heart" in symptom or "chest pain" in symptom:
                suggested = "Cardiology"

            elif "skin" in symptom or "rash" in symptom:
                suggested = "Dermatology"

            elif "bone" in symptom or "joint" in symptom:
                suggested = "Orthopedics"

            elif "eye" in symptom:
                suggested = "Ophthalmology"

    conn.close()

    return render_template(
        "book_appointment.html",
        doctors=doctors,
        suggested=suggested
)

@app.route("/patient_pharmacy")
def patient_pharmacy():

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    cur.execute("SELECT id FROM patients WHERE user_id=?", (session["user_id"],))
    patient = cur.fetchone()

    if not patient:
        conn.close()
        return redirect("/patient")

    patient_id = patient[0]

    cur.execute("""
        SELECT id, status, created_at
        FROM prescriptions
        WHERE patient_id=?
    """, (patient_id,))
    prescriptions = cur.fetchall()

    cur.execute("""
        SELECT d.id, p.id, d.dispensed_at
        FROM dispense_logs d
        JOIN prescriptions p ON d.prescription_id = p.id
        WHERE p.patient_id=?
    """, (patient_id,))
    history = cur.fetchall()

    conn.close()

    return render_template("patient_pharmacy.html",
                           prescriptions=prescriptions,
                           history=history)
# ---------------- DOCTOR DASHBOARD ----------------
@app.route("/doctor")
def doctor_dashboard():

    if session.get("role") != "doctor":
        return redirect("/")

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    # get logged-in doctor's doctor_id
    cur.execute("""
        SELECT id
        FROM doctors
        WHERE user_id=?
    """, (session["user_id"],))

    doctor = cur.fetchone()

    if not doctor:
        conn.close()
        return "Doctor profile not found"

    doctor_id = doctor[0]

    # load only this doctor's appointments
    cur.execute("""
        SELECT a.id,
               p.name,
               a.appointment_date,
               a.appointment_time,
               a.status,
               a.symptoms
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.doctor_id=?
        ORDER BY a.appointment_date ASC
    """, (doctor_id,))

    appointments = cur.fetchall()

    conn.close()

    return render_template(
        "doctor.html",
        appointments=appointments
    )

@app.route("/approve/<int:appointment_id>")
def approve(appointment_id):

    if session.get("role") != "doctor":
        return redirect("/")

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    cur.execute("""
        UPDATE appointments
        SET status='Approved'
        WHERE id=?
    """, (appointment_id,))

    conn.commit()
    conn.close()

    return redirect("/doctor")

@app.route("/reject/<int:appointment_id>")
def reject(appointment_id):

    if session.get("role") != "doctor":
        return redirect("/")

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    cur.execute("""
        UPDATE appointments
        SET status='Rejected'
        WHERE id=?
    """, (appointment_id,))

    conn.commit()
    conn.close()

    return redirect("/doctor")

@app.route("/consult/<int:appointment_id>")
def consult(appointment_id):

    if session.get("role") != "doctor":
        return redirect("/")

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    # appointment + patient info
    cur.execute("""
        SELECT a.id,
               p.id,
               p.name,
               p.age,
               p.gender,
               p.phone,
               a.symptoms
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.id=?
    """, (appointment_id,))

    data = cur.fetchone()

    conn.close()

    return render_template(
        "consult.html",
        data=data
    )

@app.route("/save_prescription", methods=["POST"])
def save_prescription():

    if session.get("role") != "doctor":
        return redirect("/")

    appointment_id = request.form["appointment_id"]
    patient_id = request.form["patient_id"]
    medicine_name = request.form["medicine"]
    dosage = request.form["dosage"]
    quantity = int(request.form["quantity"])

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    # get logged doctor id
    cur.execute("""
        SELECT id
        FROM doctors
        WHERE user_id=?
    """, (session["user_id"],))

    doctor = cur.fetchone()
    doctor_id = doctor[0]

    # check medicine exists
    cur.execute("""
        SELECT id
        FROM medicines
        WHERE name=?
    """, (medicine_name,))

    med = cur.fetchone()

    if med:
        medicine_id = med[0]
    else:
        # auto create if not existing
        cur.execute("""
            INSERT INTO medicines
            (name, manufacturer, category, price, symptom)
            VALUES (?, ?, ?, ?, ?)
        """, (
            medicine_name,
            "General",
            "Tablet",
            0,
            ""
        ))

        medicine_id = cur.lastrowid

    # create prescription
    cur.execute("""
        INSERT INTO prescriptions
        (
            appointment_id,
            doctor_id,
            patient_id,
            status,
            created_at
        )
        VALUES (?, ?, ?, ?, datetime('now'))
    """, (
        appointment_id,
        doctor_id,
        patient_id,
        "Pending"
    ))

    prescription_id = cur.lastrowid

    # add item
    cur.execute("""
        INSERT INTO prescription_items
        (
            prescription_id,
            medicine_id,
            dosage,
            quantity
        )
        VALUES (?, ?, ?, ?)
    """, (
        prescription_id,
        medicine_id,
        dosage,
        quantity
    ))

    # mark appointment completed
    cur.execute("""
        UPDATE appointments
        SET status='Completed'
        WHERE id=?
    """, (appointment_id,))

    conn.commit()
    conn.close()

    return redirect("/doctor")

@app.route("/patient_prescriptions")
def patient_prescriptions():

    if session.get("role") != "patient":
        return redirect("/")

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    # get patient id
    cur.execute("""
        SELECT id FROM patients WHERE user_id=?
    """, (session["user_id"],))

    patient = cur.fetchone()
    patient_id = patient[0]

    # get prescriptions
    cur.execute("""
        SELECT p.id, p.created_at, p.status
        FROM prescriptions p
        WHERE p.patient_id=?
        ORDER BY p.created_at DESC
    """, (patient_id,))

    prescriptions = cur.fetchall()

    conn.close()

    return render_template(
        "patient_prescriptions.html",
        prescriptions=prescriptions
    )

@app.route("/view_prescription/<int:prescription_id>")
def view_prescription(prescription_id):

    if session.get("role") != "patient":
        return redirect("/")

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    cur.execute("""
        SELECT m.name,
               pi.dosage,
               pi.quantity
        FROM prescription_items pi
        JOIN medicines m
            ON pi.medicine_id = m.id
        WHERE pi.prescription_id=?
    """, (prescription_id,))

    items = cur.fetchall()

    conn.close()

    return render_template(
        "view_prescription.html",
        items=items,
        prescription_id=prescription_id
    )

@app.route("/order_prescription/<int:prescription_id>")
def order_prescription(prescription_id):

    if session.get("role") != "patient":
        return redirect("/")

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    cur.execute("""
        SELECT m.name,
               m.price,
               pi.quantity
        FROM prescription_items pi
        JOIN medicines m
            ON pi.medicine_id = m.id
        WHERE pi.prescription_id=?
    """, (prescription_id,))

    items = cur.fetchall()

    total = 0

    for item in items:
        total += item[1] * item[2]

    conn.close()

    return render_template(
        "bill.html",
        items=items,
        total=total,
        prescription_id=prescription_id
    )

@app.route("/confirm_order/<int:prescription_id>")
def confirm_order(prescription_id):

    if session.get("role") != "patient":
        return redirect("/")

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    # mark prescription completed
    cur.execute("""
        UPDATE prescriptions
        SET status='Dispensed'
        WHERE id=?
    """, (prescription_id,))

    # add log
    cur.execute("""
        INSERT INTO dispense_logs
        (prescription_id, pharmacist_id, dispensed_at)
        VALUES (?, ?, datetime('now'))
    """, (
        prescription_id,
        1
    ))

    conn.commit()
    conn.close()

    return redirect("/patient_prescriptions")

@app.route("/order_lab", methods=["POST"])
def order_lab():

    if session.get("role") != "doctor":
        return redirect("/")

    appointment_id = request.form["appointment_id"]
    patient_id = request.form["patient_id"]
    test_id = request.form["test_id"]

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    # get doctor id
    cur.execute("""
        SELECT id
        FROM doctors
        WHERE user_id=?
    """, (session["user_id"],))

    doctor = cur.fetchone()
    doctor_id = doctor[0]

    # create lab request
    cur.execute("""
        INSERT INTO lab_orders
        (
            patient_id,
            doctor_id,
            test_id,
            appointment_id,
            status,
            ordered_at
        )
        VALUES (?, ?, ?, ?, ?, datetime('now'))
    """, (
        patient_id,
        doctor_id,
        test_id,
        appointment_id,
        "Pending"
    ))

    conn.commit()
    conn.close()

    return redirect("/doctor")

@app.route("/doctors")
def doctors_api():

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    cur.execute("""
        SELECT id, name, department
        FROM doctors
    """)

    data = cur.fetchall()
    conn.close()

    return data

@app.route("/pharmacy")
def pharmacy_dashboard():

    # 🔐 Role Protection
    if session.get("role") != "pharmacy":
        return redirect("/")

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    # ---------------- Pending Prescriptions ----------------
    cur.execute("""
        SELECT p.id, pa.name AS patient_name, p.created_at
        FROM prescriptions p
        JOIN patients pa ON p.patient_id = pa.id
        WHERE p.status = 'Pending'
        ORDER BY p.created_at DESC
    """)
    pending = cur.fetchall()
    pending_count = len(pending)

    # ---------------- Total Medicines ----------------
    cur.execute("SELECT COUNT(*) FROM medicines")
    total_meds = cur.fetchone()[0] or 0
    
    cur.execute("""
    SELECT m.id, m.name, m.price,
           IFNULL(SUM(ms.quantity),0) as total_stock
    FROM medicines m
    LEFT JOIN medicine_stock ms ON m.id = ms.medicine_id
    GROUP BY m.id
    """)
    inventory = cur.fetchall()
    # ---------------- Low Stock Alert ----------------
    cur.execute("""
        SELECT m.name,
               IFNULL(SUM(ms.quantity), 0) AS total_stock
        FROM medicines m
        LEFT JOIN medicine_stock ms ON m.id = ms.medicine_id
        GROUP BY m.id
        HAVING total_stock < 20
    """)
    low_stock = cur.fetchall()
    low_stock_count = len(low_stock)

    # ---------------- Expiry Alerts (30 Days) ----------------
    cur.execute("""
        SELECT m.name,
               ms.batch_number,
               ms.expiry_date
        FROM medicine_stock ms
        JOIN medicines m ON ms.medicine_id = m.id
        WHERE ms.expiry_date <= date('now', '+30 day')
        ORDER BY ms.expiry_date ASC
    """)
    expiry_alerts = cur.fetchall()
    expiry_count = len(expiry_alerts)

    conn.close()

    return render_template(
        "pharmacy_dashboard.html",
        pending=pending,
        pending_count=pending_count,
        total_meds=total_meds,
        low_stock=low_stock,
        low_stock_count=low_stock_count,
        expiry_alerts=expiry_alerts,
        expiry_count=expiry_count,
        inventory=inventory
    )


@app.route("/dispense/<int:prescription_id>")
def dispense(prescription_id):

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    # Get prescription items
    cur.execute("""
        SELECT medicine_id, quantity
        FROM prescription_items
        WHERE prescription_id=?
    """, (prescription_id,))
    items = cur.fetchall()

    for medicine_id, required_qty in items:

        # Get batches sorted by earliest expiry
        cur.execute("""
            SELECT id, quantity
            FROM medicine_stock
            WHERE medicine_id=?
            ORDER BY expiry_date ASC
        """, (medicine_id,))
        batches = cur.fetchall()

        total_available = sum([b[1] for b in batches])
        if total_available < required_qty:
            conn.close()
            return "Insufficient stock"

        qty_to_deduct = required_qty

        for batch_id, batch_qty in batches:
            if qty_to_deduct <= 0:
                break

            deduct = min(batch_qty, qty_to_deduct)

            cur.execute("""
                UPDATE medicine_stock
                SET quantity = quantity - ?
                WHERE id=?
            """, (deduct, batch_id))

            qty_to_deduct -= deduct

    # Update prescription status
    cur.execute("""
        UPDATE prescriptions
        SET status='Dispensed'
        WHERE id=?
    """, (prescription_id,))

    # Log action
    cur.execute("""
        INSERT INTO dispense_logs (prescription_id, pharmacist_id, dispensed_at)
        VALUES (?, ?, datetime('now'))
    """, (prescription_id, session["user_id"]))

    conn.commit()
    conn.close()

    return redirect("/pharmacy")

@app.route("/restock", methods=["POST"])
def restock():
    if session.get("role") != "pharmacy":
        return redirect("/")

    medicine_id = request.form["medicine_id"]
    batch = request.form["batch"]
    quantity = int(request.form["quantity"])
    expiry = request.form["expiry"]

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO medicine_stock
        (medicine_id, batch_number, quantity, expiry_date, purchase_date)
        VALUES (?, ?, ?, ?, date('now'))
    """, (medicine_id, batch, quantity, expiry))

    conn.commit()
    conn.close()

    return redirect("/pharmacy")


@app.route("/add_medicine", methods=["POST"])
def add_medicine():
    if session.get("role") != "pharmacy":
        return redirect("/")

    name = request.form["name"]
    manufacturer = request.form["manufacturer"]
    category = request.form["category"]
    price = float(request.form["price"])
    symptom = request.form["symptom"]

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO medicines (name, manufacturer, category, price, symptom)
        VALUES (?, ?, ?, ?, ?)
    """, (name, manufacturer, category, price, symptom))

    conn.commit()
    conn.close()

    return redirect("/pharmacy")


def role_required(role):
    def decorator(func):
        def wrapper(*args, **kwargs):
            if session.get("role") != role:
                return redirect("/")
            return func(*args, **kwargs)
        wrapper.__name__ = func.__name__
        return wrapper
    return decorator

@app.route("/order_medicines", methods=["GET", "POST"])
def order_medicines():

    if session.get("role") != "patient":
        return redirect("/")

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    medicines = []

    if request.method == "POST":
        search = request.form["search"]

        cur.execute("""
            SELECT id, name, price
            FROM medicines
            WHERE name LIKE ?
        """, ('%' + search + '%',))

        medicines = cur.fetchall()

    conn.close()

    cart = get_cart()

    return render_template("order_medicines.html",
                           medicines=medicines,
                           cart=cart)

@app.route("/add_to_cart/<int:medicine_id>", methods=["POST"])
def add_to_cart(medicine_id):

    if session.get("role") != "patient":
        return redirect("/")

    quantity = int(request.form["quantity"])

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    cur.execute("SELECT name, price FROM medicines WHERE id=?", (medicine_id,))
    med = cur.fetchone()
    conn.close()

    if not med:
        return redirect("/order_medicines")

    cart = get_cart()

    if str(medicine_id) in cart:
        cart[str(medicine_id)]["quantity"] += quantity
    else:
        cart[str(medicine_id)] = {
            "name": med[0],
            "price": med[1],
            "quantity": quantity
        }

    session["cart"] = cart

    return redirect("/order_medicines")

@app.route("/remove_from_cart/<int:medicine_id>")
def remove_from_cart(medicine_id):

    cart = get_cart()

    if str(medicine_id) in cart:
        del cart[str(medicine_id)]

    session["cart"] = cart

    return redirect("/order_medicines")

@app.route("/checkout")
def checkout():

    cart = get_cart()

    total = sum(item["price"] * item["quantity"] for item in cart.values())

    return render_template("checkout.html",
                           cart=cart,
                           total=total)

@app.route("/confirm_purchase")
def confirm_purchase():

    if session.get("role") != "patient":
        return redirect("/")

    cart = get_cart()

    if not cart:
        return redirect("/order_medicines")

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    cur.execute("SELECT id FROM patients WHERE user_id=?", (session["user_id"],))
    patient_id = cur.fetchone()[0]

    total_amount = 0

    # Validate stock first
    for med_id, item in cart.items():
        cur.execute("""
            SELECT IFNULL(SUM(quantity),0)
            FROM medicine_stock
            WHERE medicine_id=?
        """, (med_id,))
        available = cur.fetchone()[0]

        if available < item["quantity"]:
            conn.close()
            return "Insufficient stock"

    # Create bill
    cur.execute("""
        INSERT INTO bills (patient_id, total_amount, created_at)
        VALUES (?, ?, datetime('now'))
    """, (patient_id, 0))

    bill_id = cur.lastrowid

    # Deduct stock FIFO
    for med_id, item in cart.items():

        qty_to_deduct = item["quantity"]
        total_amount += item["price"] * item["quantity"]

        cur.execute("""
            SELECT id, quantity
            FROM medicine_stock
            WHERE medicine_id=?
            ORDER BY expiry_date ASC
        """, (med_id,))

        batches = cur.fetchall()

        for batch_id, batch_qty in batches:
            if qty_to_deduct <= 0:
                break

            deduct = min(batch_qty, qty_to_deduct)

            cur.execute("""
                UPDATE medicine_stock
                SET quantity = quantity - ?
                WHERE id=?
            """, (deduct, batch_id))

            qty_to_deduct -= deduct

        cur.execute("""
            INSERT INTO bill_items (bill_id, medicine_id, quantity, price)
            VALUES (?, ?, ?, ?)
        """, (bill_id, med_id, item["quantity"], item["price"]))

    cur.execute("""
        UPDATE bills
        SET total_amount=?
        WHERE id=?
    """, (total_amount, bill_id))

    conn.commit()
    conn.close()

    session["cart"] = {}

    return redirect(f"/invoice/{bill_id}")

@app.route("/invoice/<int:bill_id>")
def invoice(bill_id):

    if session.get("role") != "patient":
        return redirect("/")

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    # Get bill
    cur.execute("""
        SELECT total_amount, created_at
        FROM bills
        WHERE id=?
    """, (bill_id,))
    bill = cur.fetchone()

    # Get bill items
    cur.execute("""
        SELECT m.name, bi.quantity, bi.price
        FROM bill_items bi
        JOIN medicines m ON bi.medicine_id = m.id
        WHERE bi.bill_id=?
    """, (bill_id,))
    items = cur.fetchall()

    conn.close()

    return render_template("invoice.html",
                           bill_id=bill_id,
                           bill=bill,
                           items=items)

def get_cart():
    if "cart" not in session:
        session["cart"] = {}
    return session["cart"]


@app.route("/patient_lab", methods=["GET", "POST"])
def patient_lab():

    if session.get("role") != "patient":
        return redirect("/")

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    # get patient id
    cur.execute("SELECT id FROM patients WHERE user_id=?", (session["user_id"],))
    patient_id = cur.fetchone()[0]

    # new booking
    if request.method == "POST":
        test_id = request.form["test_id"]
        date = request.form["date"]

        cur.execute("""
            INSERT INTO lab_orders
            (patient_id, test_id, scheduled_date, status, created_at)
            VALUES (?, ?, ?, 'Scheduled', datetime('now'))
        """, (patient_id, test_id, date))

        conn.commit()

    # available tests
    cur.execute("SELECT id, name, department, cost FROM lab_tests")
    tests = cur.fetchall()

    # patient history
    cur.execute("""
        SELECT lo.id, lt.name, lo.scheduled_date, lo.status
        FROM lab_orders lo
        JOIN lab_tests lt ON lo.test_id = lt.id
        WHERE lo.patient_id=?
        ORDER BY lo.created_at DESC
    """, (patient_id,))
    history = cur.fetchall()

    conn.close()

    return render_template(
        "patient_lab.html",
        tests=tests,
        history=history
    )

@app.route("/lab")
def lab_dashboard():

    if session.get("role") != "lab":
        return redirect("/")

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    cur.execute("""
        SELECT lo.id,
               p.name,
               lt.name,
               lo.scheduled_date,
               lo.status
        FROM lab_orders lo
        JOIN patients p
            ON lo.patient_id = p.id
        JOIN lab_tests lt
            ON lo.test_id = lt.id
        ORDER BY lo.scheduled_date ASC
    """)

    orders = cur.fetchall()

    conn.close()

    return render_template(
        "lab_dashboard.html",
        orders=orders
    )


@app.route("/lab_complete/<int:order_id>", methods=["GET", "POST"])
def lab_complete(order_id):

    if session.get("role") != "lab":
        return redirect("/")

    if request.method == "POST":

        report = request.form["report"]

        conn = sqlite3.connect("database.db")
        cur = conn.cursor()

        cur.execute("""
            UPDATE lab_orders
            SET status='Completed',
                report_file=?
            WHERE id=?
        """, (report, order_id))

        conn.commit()
        conn.close()

        return redirect("/lab")

    return render_template("lab_report_upload.html",
                           order_id=order_id)

@app.route("/view_lab_report/<int:order_id>")
def view_lab_report(order_id):

    if session.get("role") != "patient":
        return redirect("/")

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    cur.execute("""
        SELECT lt.name, lo.scheduled_date, lo.report_file
        FROM lab_orders lo
        JOIN lab_tests lt ON lo.test_id = lt.id
        WHERE lo.id=?
    """, (order_id,))

    report = cur.fetchone()
    conn.close()

    return render_template("lab_report_view.html",
                           report=report)

@app.route("/patient_history")
def patient_history():

    if session.get("role") != "patient":
        return redirect("/")

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    cur.execute(
        "SELECT id FROM patients WHERE user_id=?",
        (session["user_id"],)
    )

    patient = cur.fetchone()

    if not patient:
        conn.close()
        return redirect("/patient")

    patient_id = patient[0]

    # ---------------- Appointments ----------------
    cur.execute("""
        SELECT a.id,
               d.name,
               a.appointment_date,
               a.status
        FROM appointments a
        JOIN doctors d
            ON a.doctor_id = d.id
        WHERE a.patient_id=?
        ORDER BY a.appointment_date DESC
    """, (patient_id,))

    appointments = cur.fetchall()

    # ---------------- Prescriptions ----------------
    cur.execute("""
        SELECT id,
               created_at,
               status
        FROM prescriptions
        WHERE patient_id=?
        ORDER BY created_at DESC
    """, (patient_id,))

    prescriptions = cur.fetchall()

    # ---------------- Lab Reports ----------------
    cur.execute("""
        SELECT lo.id,
               lt.name,
               lo.scheduled_date,
               lo.status
        FROM lab_orders lo
        JOIN lab_tests lt
            ON lo.test_id = lt.id
        WHERE lo.patient_id=?
        ORDER BY lo.scheduled_date DESC
    """, (patient_id,))

    labs = cur.fetchall()

    # ---------------- Bills ----------------
    cur.execute("""
        SELECT id,
               total_amount,
               created_at
        FROM bills
        WHERE patient_id=?
        ORDER BY created_at DESC
    """, (patient_id,))

    bills = cur.fetchall()

    conn.close()

    return render_template(
        "patient_history.html",
        appointments=appointments,
        prescriptions=prescriptions,
        labs=labs,
        bills=bills
    )
# Reciptionist
@app.route("/receptionist")
def receptionist():

    if session.get("role") != "receptionist":
        return redirect("/")

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    cur.execute("""
        SELECT a.id,
               p.name,
               d.name,
               a.appointment_date,
               a.appointment_time,
               a.status
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN doctors d ON a.doctor_id = d.id
        ORDER BY a.appointment_date DESC
    """)

    appointments = cur.fetchall()

    cur.execute("""
        SELECT id, name, department
        FROM doctors
    """)
    doctors = cur.fetchall()

    conn.close()

    return render_template(
        "receptionist.html",
        appointments=appointments,
        doctors=doctors
    )

@app.route("/search_patient/<name>")
def search_patient(name):

    if session.get("role") != "receptionist":
        return redirect("/")

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    cur.execute("""
        SELECT id, name
        FROM patients
        WHERE name LIKE ?
        LIMIT 10
    """, ('%' + name + '%',))

    data = cur.fetchall()

    conn.close()

    return data

@app.route("/available_slots/<int:doctor_id>/<date>")
def available_slots(doctor_id, date):

    if session.get("role") not in ["receptionist", "patient"]:
        return redirect("/")

    all_slots = [
        "09:00 AM",
        "10:00 AM",
        "11:00 AM",
        "12:00 PM",
        "02:00 PM",
        "03:00 PM",
        "04:00 PM"
    ]

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    cur.execute("""
        SELECT appointment_time
        FROM appointments
        WHERE doctor_id=? AND appointment_date=?
    """, (doctor_id, date))

    booked = [row[0] for row in cur.fetchall()]
    conn.close()

    result = []

    for slot in all_slots:
        result.append({
            "time": slot,
            "available": slot not in booked
        })

    return result

@app.route("/rec_book", methods=["POST"])
def rec_book():

    if session.get("role") != "receptionist":
        return redirect("/")

    data = request.get_json()

    patient_id = data["patient_id"]
    doctor_id = data["doctor_id"]
    date = data["date"]
    time = data["time"]

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO appointments
        (
            patient_id,
            doctor_id,
            appointment_date,
            appointment_time,
            reason,
            symptoms,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        patient_id,
        doctor_id,
        date,
        time,
        "Reception Booking",
        "",
        "Approved"
    ))

    conn.commit()
    conn.close()

    return {"msg": "Appointment booked successfully"}

@app.route("/filter_appts")
def filter_appts():

    if session.get("role") != "receptionist":
        return redirect("/")

    doctor = request.args.get("doctor", "")
    date = request.args.get("date", "")

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    query = """
        SELECT a.id,
               p.name,
               d.name,
               a.appointment_date,
               a.appointment_time,
               a.status
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN doctors d ON a.doctor_id = d.id
        WHERE 1=1
    """

    params = []

    if doctor:
        query += " AND d.name LIKE ?"
        params.append('%' + doctor + '%')

    if date:
        query += " AND a.appointment_date=?"
        params.append(date)

    query += " ORDER BY a.appointment_date DESC"

    cur.execute(query, params)

    data = cur.fetchall()

    conn.close()

    return data

@app.route("/receptionist")
def receptionist_dashboard():

    if session.get("role") != "receptionist":
        return redirect("/")

    return render_template("receptionist.html")

if __name__ == "__main__":
    app.run(debug=True)
