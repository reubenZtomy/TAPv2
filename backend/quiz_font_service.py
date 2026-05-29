"""Per-quiz custom font upload, storage, and public URLs."""

import os
import re
import shutil
from datetime import datetime

from database import get_connection, row_to_dict
from werkzeug.utils import secure_filename

ALLOWED_FONT_EXTENSIONS = frozenset({'ttf', 'otf', 'woff', 'woff2'})

FONT_MIME = {
    'ttf': 'font/ttf',
    'otf': 'font/otf',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
}


def _utc_now() -> str:
    return datetime.utcnow().isoformat()


def _fonts_root() -> str:
    base = os.path.join(os.path.dirname(__file__), 'uploads', 'quiz_fonts')
    os.makedirs(base, exist_ok=True)
    return base


def _quiz_font_dir(quiz_uuid: str) -> str:
    return os.path.join(_fonts_root(), quiz_uuid)


def sanitize_font_family(name: str) -> str:
    cleaned = re.sub(r"[^\w\s\-']", '', (name or '').strip())
    cleaned = ' '.join(cleaned.split())
    return (cleaned[:80] if cleaned else 'Custom Font')


def _font_file_path(quiz_uuid: str, filename: str) -> str:
    return os.path.join(_quiz_font_dir(quiz_uuid), filename)


def custom_font_public_url(quiz_uuid: str) -> str:
    return f'/api/quiz-fonts/{quiz_uuid}/font'


def custom_font_payload(quiz: dict) -> dict | None:
    family = (quiz.get('custom_font_family') or '').strip()
    filename = (quiz.get('custom_font_filename') or '').strip()
    quiz_uuid = (quiz.get('quiz_uuid') or '').strip()
    if not family or not filename or not quiz_uuid:
        return None
    full = _font_file_path(quiz_uuid, filename)
    if not os.path.isfile(full):
        return None
    return {
        'family': family,
        'url': custom_font_public_url(quiz_uuid),
        'filename': filename,
    }


def delete_quiz_font_files(quiz_uuid: str) -> None:
    directory = _quiz_font_dir(quiz_uuid)
    if os.path.isdir(directory):
        shutil.rmtree(directory, ignore_errors=True)


def clear_quiz_font_db(conn, quiz_id: int, now: str) -> None:
    conn.execute(
        """
        UPDATE quizzes
        SET custom_font_family = NULL, custom_font_filename = NULL, updated_at = ?
        WHERE id = ?
        """,
        (now, quiz_id),
    )


def save_quiz_font(quiz_id: int, file_storage, family_name: str) -> tuple[dict | None, str | None]:
    if not file_storage or not file_storage.filename:
        return None, 'No font file provided'
    ext = file_storage.filename.rsplit('.', 1)[-1].lower() if '.' in file_storage.filename else ''
    if ext not in ALLOWED_FONT_EXTENSIONS:
        return None, f'Allowed font types: {", ".join(sorted(ALLOWED_FONT_EXTENSIONS))}'

    family = sanitize_font_family(family_name)
    now = _utc_now()

    with get_connection() as conn:
        row = conn.execute(
            'SELECT id, quiz_uuid FROM quizzes WHERE id = ?',
            (quiz_id,),
        ).fetchone()
        if not row:
            return None, 'Quiz not found'
        quiz_uuid = row['quiz_uuid']

        delete_quiz_font_files(quiz_uuid)
        directory = _quiz_font_dir(quiz_uuid)
        os.makedirs(directory, exist_ok=True)
        stored_name = f'font.{ext}'
        file_storage.save(os.path.join(directory, stored_name))

        conn.execute(
            """
            UPDATE quizzes
            SET custom_font_family = ?, custom_font_filename = ?, updated_at = ?
            WHERE id = ?
            """,
            (family, stored_name, now, quiz_id),
        )

        updated = row_to_dict(
            conn.execute('SELECT * FROM quizzes WHERE id = ?', (quiz_id,)).fetchone()
        )

    return custom_font_payload(updated), None


def delete_quiz_font(quiz_id: int) -> str | None:
    now = _utc_now()
    with get_connection() as conn:
        row = conn.execute(
            'SELECT id, quiz_uuid FROM quizzes WHERE id = ?',
            (quiz_id,),
        ).fetchone()
        if not row:
            return 'Quiz not found'
        delete_quiz_font_files(row['quiz_uuid'])
        clear_quiz_font_db(conn, quiz_id, now)
    return None


def resolve_font_file(quiz_uuid: str) -> tuple[str | None, str | None]:
    with get_connection() as conn:
        row = conn.execute(
            'SELECT custom_font_filename FROM quizzes WHERE quiz_uuid = ?',
            (quiz_uuid,),
        ).fetchone()
        if not row or not row['custom_font_filename']:
            return None, None
        filename = row['custom_font_filename']
        path = _font_file_path(quiz_uuid, filename)
        if not os.path.isfile(path):
            return None, None
        ext = filename.rsplit('.', 1)[-1].lower()
        mime = FONT_MIME.get(ext, 'application/octet-stream')
        return path, mime
