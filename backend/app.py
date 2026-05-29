from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import datetime
import os

from database import get_connection, init_db, row_to_dict
from auth_utils import create_token, verify_token, get_bearer_token, get_user_by_id
from routes.admin_quizzes import admin_quizzes_bp
from routes.admin_preferences import admin_preferences_bp
from routes.admin_dashboard import admin_dashboard_bp
from routes.admin_builder import admin_builder_bp
from routes.admin_links import admin_links_bp
from routes.public_quiz import public_quiz_bp
from routes.quiz_fonts import quiz_fonts_bp

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

static_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')

app = Flask(__name__, static_folder=static_dir)
CORS(app)

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_secret_key_change_me')

app.register_blueprint(admin_quizzes_bp)
app.register_blueprint(admin_preferences_bp)
app.register_blueprint(admin_dashboard_bp)
app.register_blueprint(admin_builder_bp)
app.register_blueprint(admin_links_bp)
app.register_blueprint(public_quiz_bp)
app.register_blueprint(quiz_fonts_bp)


def _user_public(row) -> dict:
    return {
        'id': row['id'],
        'email': row['email'],
        'name': row['name'],
        'role': row.get('role') or 'student',
    }


def _dev_auto_login_enabled() -> bool:
    """Dev-only: use ADMIN_EMAIL / ADMIN_PASSWORD from backend/.env."""
    flag = (os.environ.get('DEV_AUTO_LOGIN') or '').strip().lower()
    if flag in ('0', 'false', 'no', 'off'):
        return False
    if flag in ('1', 'true', 'yes', 'on'):
        return True
    return bool(app.debug)


def _maybe_seed_admin():
    email = (os.environ.get('ADMIN_EMAIL') or '').strip().lower()
    password = os.environ.get('ADMIN_PASSWORD') or ''
    name = (os.environ.get('ADMIN_NAME') or 'TAP Admin').strip()
    if not email or not password:
        return
    password_hash = generate_password_hash(password)
    with get_connection() as conn:
        row = conn.execute(
            'SELECT id, role, password_hash FROM users WHERE email = ?',
            (email,),
        ).fetchone()
        if row:
            updates = []
            params = []
            if row['role'] != 'admin':
                updates.append("role = 'admin'")
            if not check_password_hash(row['password_hash'], password):
                updates.append('password_hash = ?')
                params.append(password_hash)
            if updates:
                params.append(row['id'])
                conn.execute(
                    f"UPDATE users SET {', '.join(updates)} WHERE id = ?",
                    params,
                )
            return
        conn.execute(
            'INSERT INTO users (email, name, password_hash, created_at, role) VALUES (?, ?, ?, ?, ?)',
            (
                email,
                name,
                generate_password_hash(password),
                datetime.datetime.utcnow().isoformat(),
                'admin',
            ),
        )


@app.route('/api/hello')
def hello():
    return jsonify({'message': 'TAP admin API'})


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json(force=True, silent=True) or {}

    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({'error': 'Missing credentials'}), 400

    with get_connection() as conn:
        row = conn.execute(
            'SELECT * FROM users WHERE email = ?',
            (email,),
        ).fetchone()

    if not row or not check_password_hash(row['password_hash'], password):
        return jsonify({'error': 'Invalid email or password'}), 401

    user = row_to_dict(row)
    token = create_token(user['id'], email, user.get('role') or 'student')

    return jsonify({'token': token, 'user': _user_public(user)})


@app.route('/api/dev/auto-admin-login', methods=['POST'])
def dev_auto_admin_login():
    """Development only — signs in admin from ADMIN_EMAIL / ADMIN_PASSWORD in .env."""
    if not _dev_auto_login_enabled():
        return jsonify({'error': 'Dev auto-login is disabled'}), 404

    email = (os.environ.get('ADMIN_EMAIL') or '').strip().lower()
    password = os.environ.get('ADMIN_PASSWORD') or ''
    if not email or not password:
        return jsonify({
            'error': 'Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env for dev auto-login',
        }), 503

    _maybe_seed_admin()

    with get_connection() as conn:
        row = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()

    if not row or not check_password_hash(row['password_hash'], password):
        return jsonify({'error': 'Invalid admin credentials in .env'}), 401

    if (row['role'] or 'student') != 'admin':
        return jsonify({'error': 'ADMIN_EMAIL user is not an admin'}), 403

    user = row_to_dict(row)
    token = create_token(user['id'], email, user['role'])
    return jsonify({'token': token, 'user': _user_public(user), 'auto_login': True})


@app.route('/api/auth/me', methods=['GET'])
def me():
    token = get_bearer_token()
    if not token:
        return jsonify({'error': 'Unauthorized'}), 401
    payload = verify_token(token)
    if not payload:
        return jsonify({'error': 'Unauthorized'}), 401
    user = get_user_by_id(int(payload['sub']))
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    return jsonify({'user': _user_public(user)})


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder = app.static_folder

    if path.startswith('api/'):
        return jsonify({'error': 'Not found'}), 404

    if path != '' and os.path.exists(os.path.join(static_folder, path)):
        return send_from_directory(static_folder, path)

    index_path = os.path.join(static_folder, 'index.html')

    if os.path.exists(index_path):
        return send_from_directory(static_folder, 'index.html')

    return jsonify({
        'message': 'Frontend not built. Run the Vite dev server or build frontend/dist.',
    }), 200


if __name__ == '__main__':
    init_db()
    _maybe_seed_admin()
    app.run(host='127.0.0.1', port=5000, debug=True)
