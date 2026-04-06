from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hms.db'
app.config['JWT_SECRET_KEY'] = 'super-secret-key'

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# ------------------ MODEL ------------------

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(200))
    role = db.Column(db.String(50))
    specialization = db.Column(db.String(100), nullable=True)

# ------------------ INIT DB ------------------

@app.before_first_request
def create_tables():
    db.create_all()

# ------------------ REGISTER ------------------

@app.route('/register', methods=['POST'])
def register():
    data = request.json

    # check existing user
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"msg": "User already exists"}), 400

    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')

    user = User(
        name=data['name'],
        email=data['email'],
        password=hashed_pw,
        role=data['role'],
        specialization=data.get('specialization')
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"msg": "Registration successful"})

# ------------------ LOGIN ------------------

@app.route('/login', methods=['POST'])
def login():
    data = request.json

    user = User.query.filter_by(email=data['email']).first()

    if not user or not bcrypt.check_password_hash(user.password, data['password']):
        return jsonify({"msg": "Invalid credentials"}), 401

    token = create_access_token(identity={
        "id": user.id,
        "role": user.role,
        "name": user.name
    })

    return jsonify({
        "token": token,
        "role": user.role,
        "name": user.name
    })

# ------------------ RUN ------------------

if __name__ == '__main__':
    app.run(debug=True)