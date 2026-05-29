"""Import translated quiz language JSON into builder data."""

import json
from datetime import datetime

from database import get_connection
from quiz_builder_service import load_quiz_builder


def _utc_now() -> str:
    return datetime.utcnow().isoformat()


def _upsert_question_translation(cursor, question_id: int, language_code: str, fields: dict, now: str):
    title = (fields.get('question') or fields.get('title') or '').strip()
    if not title:
        return
    subtitle = (fields.get('subtitle') or '').strip() or None
    helper_text = (fields.get('helper_text') or '').strip() or None
    existing = cursor.execute(
        """
        SELECT id FROM quiz_question_translations
        WHERE question_id = ? AND language_code = ?
        """,
        (question_id, language_code),
    ).fetchone()
    if existing:
        cursor.execute(
            """
            UPDATE quiz_question_translations
            SET title = ?, subtitle = ?, helper_text = ?, updated_at = ?
            WHERE question_id = ? AND language_code = ?
            """,
            (title, subtitle, helper_text, now, question_id, language_code),
        )
    else:
        cursor.execute(
            """
            INSERT INTO quiz_question_translations (
                question_id, language_code, title, subtitle, helper_text, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (question_id, language_code, title, subtitle, helper_text, now, now),
        )


def _upsert_option_label(cursor, option_id: int, language_code: str, label: str):
    label = (label or '').strip()
    if not label:
        return
    existing = cursor.execute(
        'SELECT id FROM quiz_option_translations WHERE option_id = ? AND language_code = ?',
        (option_id, language_code),
    ).fetchone()
    if existing:
        cursor.execute(
            'UPDATE quiz_option_translations SET label = ? WHERE option_id = ? AND language_code = ?',
            (label, option_id, language_code),
        )
    else:
        cursor.execute(
            """
            INSERT INTO quiz_option_translations (option_id, language_code, label, description)
            VALUES (?, ?, ?, NULL)
            """,
            (option_id, language_code, label),
        )


def _parse_layout_json(raw: str | None) -> dict:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        return {}


def _merge_layout_i18n(layout: dict, language_code: str, layout_strings: dict | None) -> dict:
    if not layout_strings or not isinstance(layout_strings, dict):
        return layout
    cleaned = {
        str(element_id): value
        for element_id, value in layout_strings.items()
        if isinstance(value, dict)
    }
    if not cleaned:
        return layout
    merged = dict(layout)
    i18n = dict(merged.get('i18n') or {})
    i18n[language_code] = cleaned
    merged['i18n'] = i18n
    return merged


def import_quiz_language_json(
    quiz_id: int,
    payload: dict,
    language_code: str | None = None,
    language_name: str | None = None,
) -> tuple[dict | None, str | None]:
    meta = payload.get('_language') or {}
    lang_code = (language_code or meta.get('target_language') or '').strip()
    lang_name = (language_name or meta.get('target_language_name') or lang_code).strip()
    if not lang_code:
        return None, 'language_code is required'

    title_block = payload.get('title') or {}
    questions_data = payload.get('questions') or {}
    if not isinstance(questions_data, dict):
        return None, 'questions must be an object'

    now = _utc_now()
    with get_connection() as conn:
        quiz_row = conn.execute('SELECT * FROM quizzes WHERE id = ?', (quiz_id,)).fetchone()
        if not quiz_row:
            return None, 'Quiz not found'

        existing_lang = conn.execute(
            'SELECT id FROM quiz_languages WHERE quiz_id = ? AND language_code = ?',
            (quiz_id, lang_code),
        ).fetchone()
        if not existing_lang:
            conn.execute(
                """
                INSERT INTO quiz_languages (quiz_id, language_code, language_name, is_default, created_at)
                VALUES (?, ?, ?, 0, ?)
                """,
                (quiz_id, lang_code, lang_name, now),
            )

        intro_layout = _parse_layout_json(quiz_row['intro_layout_json'])
        intro_i18n = dict(intro_layout.get('i18n') or {})
        intro_entry = dict(intro_i18n.get(lang_code) or {})
        if title_block.get('heading') is not None:
            intro_entry['heading'] = str(title_block.get('heading') or '')
        if title_block.get('subtitle') is not None:
            intro_entry['subtitle'] = str(title_block.get('subtitle') or '')
        if title_block.get('startButton') is not None:
            intro_entry['startButton'] = str(title_block.get('startButton') or '')
        intro_layout_strings = title_block.get('layout_strings')
        if isinstance(intro_layout_strings, dict) and intro_layout_strings:
            intro_entry['elements'] = {
                str(k): v for k, v in intro_layout_strings.items() if isinstance(v, dict)
            }
        intro_i18n[lang_code] = intro_entry
        intro_layout['i18n'] = intro_i18n
        conn.execute(
            'UPDATE quizzes SET intro_layout_json = ?, updated_at = ? WHERE id = ?',
            (json.dumps(intro_layout), now, quiz_id),
        )

        q_rows = conn.execute(
            'SELECT id, question_key FROM quiz_questions WHERE quiz_id = ?',
            (quiz_id,),
        ).fetchall()
        questions_by_key = {row['question_key']: row['id'] for row in q_rows}

        for question_key, q_payload in questions_data.items():
            if not isinstance(q_payload, dict):
                continue
            key = (q_payload.get('question_key') or question_key or '').strip()
            if not key:
                continue
            question_id = questions_by_key.get(key)
            if not question_id:
                continue

            _upsert_question_translation(conn, question_id, lang_code, q_payload, now)

            opt_rows = conn.execute(
                'SELECT id, option_key FROM quiz_options WHERE question_id = ?',
                (question_id,),
            ).fetchall()
            options_by_key = {row['option_key']: row['id'] for row in opt_rows}
            for opt in q_payload.get('options') or []:
                if not isinstance(opt, dict):
                    continue
                opt_key = (opt.get('option_key') or opt.get('key') or '').strip()
                label = (opt.get('label') or '').strip()
                if not opt_key or not label:
                    continue
                option_id = options_by_key.get(opt_key)
                if option_id:
                    _upsert_option_label(conn, option_id, lang_code, label)

            layout_row = conn.execute(
                'SELECT layout_json FROM quiz_layout_configs WHERE question_id = ? ORDER BY id DESC LIMIT 1',
                (question_id,),
            ).fetchone()
            layout = _parse_layout_json(layout_row['layout_json'] if layout_row else None)
            layout = _merge_layout_i18n(layout, lang_code, q_payload.get('layout_strings'))
            if layout_row:
                conn.execute(
                    'UPDATE quiz_layout_configs SET layout_json = ?, updated_at = ? WHERE question_id = ?',
                    (json.dumps(layout), now, question_id),
                )
            elif layout.get('i18n'):
                conn.execute(
                    """
                    INSERT INTO quiz_layout_configs (question_id, layout_json, created_at, updated_at)
                    VALUES (?, ?, ?, ?)
                    """,
                    (question_id, json.dumps(layout), now, now),
                )

        conn.execute('UPDATE quizzes SET updated_at = ? WHERE id = ?', (now, quiz_id))

    quiz = load_quiz_builder(quiz_id)
    return quiz, None
