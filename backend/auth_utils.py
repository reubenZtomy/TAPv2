"""JWT helpers and admin authorization."""

from functools import wraps

import jwt
from flask import current_app, jsonify, request

from database import get_connection, row_to_dict


def create_token(user_id: int, email: str, role: str) -> str:
    from datetime import datetime, timedelta

    payload = {
        'sub': str(user_id),
        'email': email,
        'role': role,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(days=7),
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')


def verify_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
    except Exception:
        return None


def get_bearer_token() -> str | None:
    auth = request.headers.get('Authorization', '')
    parts = auth.split()
    if len(parts) == 2 and parts[0].lower() == 'bearer':
        return parts[1]
    return None


def get_user_by_id(user_id: int) -> dict | None:
    with get_connection() as conn:
        row = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    return row_to_dict(row)


def get_current_user() -> dict | None:
    token = get_bearer_token()
    if not token:
        return None
    payload = verify_token(token)
    if not payload:
        return None
    return get_user_by_id(int(payload['sub']))


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401
        if user.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return fn(*args, **kwargs, admin_user=user)

    return wrapper
