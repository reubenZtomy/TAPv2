"""SQLite schema, migrations, and connection helpers."""

import os
import sqlite3
import uuid
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), 'auth.db')

SCHEMA_VERSION = 4


def get_db_path() -> str:
    return os.environ.get('DATABASE_PATH', DB_PATH)


@contextmanager
def get_connection():
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _table_columns(cursor, table: str) -> set[str]:
    cursor.execute(f'PRAGMA table_info({table})')
    return {row[1] for row in cursor.fetchall()}


def _migrate_users_role(cursor):
    cursor.execute(
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
    columns = _table_columns(cursor, 'users')
    if 'role' not in columns:
        cursor.execute(
            "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student'"
        )


def _migrate_quiz_intro_layout(cursor):
    columns = _table_columns(cursor, 'quizzes')
    if 'intro_layout_json' not in columns:
        cursor.execute('ALTER TABLE quizzes ADD COLUMN intro_layout_json TEXT')


def _migrate_quiz_custom_font(cursor):
    columns = _table_columns(cursor, 'quizzes')
    if 'custom_font_family' not in columns:
        cursor.execute('ALTER TABLE quizzes ADD COLUMN custom_font_family TEXT')
    if 'custom_font_filename' not in columns:
        cursor.execute('ALTER TABLE quizzes ADD COLUMN custom_font_filename TEXT')


def _create_admin_tables(cursor):
    cursor.executescript(
        """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS quizzes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quiz_uuid TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'draft',
            created_by INTEGER NOT NULL,
            default_language TEXT DEFAULT 'English',
            allow_language_selection INTEGER DEFAULT 1,
            result_engine_type TEXT DEFAULT 'tap_personality',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(created_by) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS quiz_languages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quiz_id INTEGER NOT NULL,
            language_code TEXT NOT NULL,
            language_name TEXT NOT NULL,
            is_default INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(quiz_id, language_code),
            FOREIGN KEY(quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS quiz_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quiz_id INTEGER NOT NULL,
            question_key TEXT NOT NULL,
            order_index INTEGER NOT NULL,
            layout_type TEXT NOT NULL,
            is_required INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(quiz_id, question_key),
            FOREIGN KEY(quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS quiz_question_translations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER NOT NULL,
            language_code TEXT NOT NULL,
            title TEXT NOT NULL,
            subtitle TEXT,
            helper_text TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(question_id, language_code),
            FOREIGN KEY(question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS quiz_options (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER NOT NULL,
            option_key TEXT NOT NULL,
            order_index INTEGER NOT NULL,
            image_url TEXT,
            value TEXT,
            metadata_json TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(question_id, option_key),
            FOREIGN KEY(question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS quiz_option_translations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            option_id INTEGER NOT NULL,
            language_code TEXT NOT NULL,
            label TEXT NOT NULL,
            description TEXT,
            UNIQUE(option_id, language_code),
            FOREIGN KEY(option_id) REFERENCES quiz_options(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS quiz_layout_configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER NOT NULL,
            layout_json TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS quiz_links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            link_uuid TEXT UNIQUE NOT NULL,
            quiz_id INTEGER NOT NULL,
            link_name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            language_mode TEXT NOT NULL DEFAULT 'allow_selection',
            default_language TEXT,
            allowed_languages_json TEXT,
            unavailable_screen_config_json TEXT,
            starts_at DATETIME,
            ends_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS quiz_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            submission_uuid TEXT UNIQUE NOT NULL,
            quiz_id INTEGER NOT NULL,
            quiz_link_id INTEGER,
            user_id INTEGER,
            language_code TEXT,
            started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            result_personality_id TEXT,
            result_title TEXT,
            result_json TEXT,
            user_agent TEXT,
            ip_hash TEXT,
            FOREIGN KEY(quiz_id) REFERENCES quizzes(id),
            FOREIGN KEY(quiz_link_id) REFERENCES quiz_links(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS quiz_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            submission_id INTEGER NOT NULL,
            question_key TEXT NOT NULL,
            option_key TEXT,
            answer_label TEXT,
            answer_json TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(submission_id) REFERENCES quiz_submissions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS dashboard_table_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            table_name TEXT NOT NULL,
            columns_json TEXT NOT NULL,
            filters_json TEXT,
            sort_json TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, table_name),
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """
    )


def init_db():
    with get_connection() as conn:
        cursor = conn.cursor()
        _migrate_users_role(cursor)
        _create_admin_tables(cursor)
        _migrate_quiz_intro_layout(cursor)
        _migrate_quiz_custom_font(cursor)
        cursor.execute(
            'INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)',
            (SCHEMA_VERSION,),
        )
        _seed_default_quiz(cursor)


def _seed_default_quiz(cursor):
    cursor.execute("SELECT id FROM quizzes WHERE quiz_uuid = ?", ('tap-system-default',))
    if cursor.fetchone():
        return

    cursor.execute('SELECT id FROM users ORDER BY id LIMIT 1')
    row = cursor.fetchone()
    if not row:
        return

    created_by = row[0]
    now = _utc_now()
    cursor.execute(
        """
        INSERT INTO quizzes (
            quiz_uuid, name, description, status, created_by,
            default_language, allow_language_selection, result_engine_type,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            'tap-system-default',
            'TAP Personality Quiz',
            'Default system quiz — original TAP personality assessment (file-based content until migrated).',
            'active',
            created_by,
            'English',
            1,
            'tap_personality',
            now,
            now,
        ),
    )
    quiz_id = cursor.lastrowid
    for code, name, is_default in [
        ('English', 'English', 1),
        ('Chinese', 'Chinese', 0),
    ]:
        cursor.execute(
            """
            INSERT INTO quiz_languages (quiz_id, language_code, language_name, is_default)
            VALUES (?, ?, ?, ?)
            """,
            (quiz_id, code, name, is_default),
        )


def new_uuid() -> str:
    return str(uuid.uuid4())


def _utc_now() -> str:
    from datetime import datetime

    return datetime.utcnow().isoformat()


def row_to_dict(row: sqlite3.Row | None) -> dict | None:
    if row is None:
        return None
    return {key: row[key] for key in row.keys()}
