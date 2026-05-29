import os
import tempfile

import pytest
from datetime import datetime
from werkzeug.security import generate_password_hash


@pytest.fixture
def client(tmp_path):
    db_fd, db_path = tempfile.mkstemp(suffix='.db')
    os.close(db_fd)

    os.environ['DATABASE_PATH'] = db_path
    os.environ['SECRET_KEY'] = 'test-secret-key-for-pytest-only-32chars'
    os.environ['ADMIN_EMAIL'] = ''
    os.environ['ADMIN_PASSWORD'] = ''

    import app as flask_app
    from database import init_db, get_connection

    flask_app.app.config['TESTING'] = True
    flask_app.app.config['SECRET_KEY'] = os.environ['SECRET_KEY']

    init_db()

    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO users (email, name, password_hash, created_at, role)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                'admin@test.com',
                'Admin User',
                generate_password_hash('adminpass'),
                datetime.utcnow().isoformat(),
                'admin',
            ),
        )
        conn.execute(
            """
            INSERT INTO users (email, name, password_hash, created_at, role)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                'student@test.com',
                'Student User',
                generate_password_hash('studentpass'),
                datetime.utcnow().isoformat(),
                'student',
            ),
        )

    with flask_app.app.test_client() as test_client:
        yield test_client

    try:
        os.remove(db_path)
    except OSError:
        pass
    os.environ.pop('DATABASE_PATH', None)


def admin_headers(client):
    res = client.post(
        '/api/auth/login',
        json={'email': 'admin@test.com', 'password': 'adminpass'},
    )
    assert res.status_code == 200, res.get_json()
    token = res.get_json()['token']
    return {'Authorization': f'Bearer {token}'}


def student_headers(client):
    res = client.post(
        '/api/auth/login',
        json={'email': 'student@test.com', 'password': 'studentpass'},
    )
    assert res.status_code == 200, res.get_json()
    token = res.get_json()['token']
    return {'Authorization': f'Bearer {token}'}
