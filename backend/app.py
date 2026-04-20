from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import jwt
import datetime
import os

# Static folder points to frontend build directory (../frontend/dist)
static_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')

app = Flask(__name__, static_folder=static_dir)
CORS(app)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_secret_key_change_me')
db_path = os.path.join(os.path.dirname(__file__), 'auth.db')


def init_db():
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()


def create_token(user_id, email):
    payload = {
        'sub': user_id,
        'email': email,
        'iat': datetime.datetime.utcnow(),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')


def verify_token(token):
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except Exception:
        return None


@app.route('/api/hello')
def hello():
    return jsonify({'message': 'Hello from Flask backend'})


@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    name = (data.get('name') or '').strip()
    password = data.get('password') or ''
    if not email or not name or not password:
        return jsonify({'error': 'Missing required fields'}), 400
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    try:
        c.execute(
            'INSERT INTO users (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)',
            (email, name, generate_password_hash(password), datetime.datetime.utcnow().isoformat()),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Email already registered'}), 409
    c.execute('SELECT id FROM users WHERE email = ?', (email,))
    row = c.fetchone()
    conn.close()
    user_id = row[0]
    token = create_token(user_id, email)
    return jsonify({'token': token, 'user': {'id': user_id, 'email': email, 'name': name}}), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    if not email or not password:
        return jsonify({'error': 'Missing credentials'}), 400
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute('SELECT id, name, password_hash FROM users WHERE email = ?', (email,))
    row = c.fetchone()
    conn.close()
    if not row or not check_password_hash(row[2], password):
        return jsonify({'error': 'Invalid email or password'}), 401
    user_id, name = row[0], row[1]
    token = create_token(user_id, email)
    return jsonify({'token': token, 'user': {'id': user_id, 'email': email, 'name': name}})


@app.route('/api/auth/me', methods=['GET'])
def me():
    auth = request.headers.get('Authorization', '')
    parts = auth.split()
    if len(parts) == 2 and parts[0].lower() == 'bearer':
        payload = verify_token(parts[1])
        if payload:
            return jsonify({'user': {'id': payload['sub'], 'email': payload['email']}})
    return jsonify({'error': 'Unauthorized'}), 401

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Serve built frontend files if present
    static_folder = app.static_folder
    if path != '' and os.path.exists(os.path.join(static_folder, path)):
        return send_from_directory(static_folder, path)
    index_path = os.path.join(static_folder, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(static_folder, 'index.html')
    return jsonify({'message': 'Frontend not built. Run frontend in dev mode or build it.'}), 200


if __name__ == '__main__':
    init_db()
    app.run(host='127.0.0.1', port=5000, debug=True)
