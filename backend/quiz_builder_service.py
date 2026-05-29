"""Load and validate quiz builder data."""

import json
import os
from datetime import datetime

from database import get_connection, row_to_dict
from quiz_builder_constants import DEFAULT_LAYOUT_JSON, default_layout_json
from quiz_font_service import custom_font_payload


def _utc_now() -> str:
    return datetime.utcnow().isoformat()


def _parse_layout_json(raw: str | None) -> dict:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        return {}


def _load_question_details(conn, question_id: int) -> dict | None:
    row = conn.execute('SELECT * FROM quiz_questions WHERE id = ?', (question_id,)).fetchone()
    if not row:
        return None
    q = row_to_dict(row)
    q['is_required'] = bool(q.get('is_required'))
    q['layout_type'] = (q.get('layout_type') or '').strip()

    trans_rows = conn.execute(
        'SELECT * FROM quiz_question_translations WHERE question_id = ?',
        (question_id,),
    ).fetchall()
    q['translations'] = {
        t['language_code']: {
            'title': t['title'],
            'subtitle': t['subtitle'],
            'helper_text': t['helper_text'],
        }
        for t in trans_rows
    }

    opt_rows = conn.execute(
        'SELECT * FROM quiz_options WHERE question_id = ? ORDER BY order_index',
        (question_id,),
    ).fetchall()
    options = []
    for opt in opt_rows:
        o = row_to_dict(opt)
        meta_raw = o.pop('metadata_json', None)
        o['metadata'] = _parse_layout_json(meta_raw) if meta_raw else {}
        label_rows = conn.execute(
            'SELECT * FROM quiz_option_translations WHERE option_id = ?',
            (opt['id'],),
        ).fetchall()
        o['labels'] = {lr['language_code']: lr['label'] for lr in label_rows}
        options.append(o)
    q['options'] = options

    layout_row = conn.execute(
        'SELECT layout_json FROM quiz_layout_configs WHERE question_id = ? ORDER BY id DESC LIMIT 1',
        (question_id,),
    ).fetchone()
    q['layout'] = _parse_layout_json(layout_row['layout_json'] if layout_row else None)
    if not q['layout'] and q.get('layout_type'):
        q['layout'] = _parse_layout_json(default_layout_json(q['layout_type']))
    if not q.get('layout_type'):
        q['layout'].pop('template', None)

    return q


def load_quiz_builder(quiz_id: int) -> dict | None:
    with get_connection() as conn:
        quiz_row = conn.execute('SELECT * FROM quizzes WHERE id = ?', (quiz_id,)).fetchone()
        if not quiz_row:
            return None

        quiz = row_to_dict(quiz_row)
        quiz['allow_language_selection'] = bool(quiz.get('allow_language_selection'))
        quiz['intro_layout'] = _parse_layout_json(quiz.get('intro_layout_json'))
        if not quiz['intro_layout']:
            quiz['intro_layout'] = {'elements': []}
        quiz['custom_font'] = custom_font_payload(quiz)

        languages = conn.execute(
            'SELECT * FROM quiz_languages WHERE quiz_id = ? ORDER BY is_default DESC, language_name',
            (quiz_id,),
        ).fetchall()
        quiz['languages'] = [
            {**row_to_dict(lang), 'is_default': bool(lang['is_default'])} for lang in languages
        ]

        q_rows = conn.execute(
            'SELECT id FROM quiz_questions WHERE quiz_id = ? ORDER BY order_index',
            (quiz_id,),
        ).fetchall()
        quiz['questions'] = [_load_question_details(conn, r['id']) for r in q_rows]

        quiz['publish_validation'] = {
            'can_publish': True,
            'missing_question_keys': [],
        }

    return quiz


def validate_publish(quiz_id: int) -> tuple[bool, list[str], str | None]:
    with get_connection() as conn:
        quiz = conn.execute('SELECT * FROM quizzes WHERE id = ?', (quiz_id,)).fetchone()
        if not quiz:
            return False, [], 'Quiz not found'

        lang_count = conn.execute(
            'SELECT COUNT(*) FROM quiz_languages WHERE quiz_id = ?',
            (quiz_id,),
        ).fetchone()[0]
        if lang_count == 0:
            return False, [], 'Add at least one language before publishing'

        q_count = conn.execute(
            'SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = ?',
            (quiz_id,),
        ).fetchone()[0]
        if q_count == 0:
            return False, [], 'Add at least one question before publishing'

    return True, [], None


def seed_tap_template_from_file(quiz_id: int, questions_dir: str) -> tuple[int, str | None]:
    """Import English.txt structure into quiz questions (for new quizzes)."""
    from quiz_builder_constants import TAP_QUESTION_LAYOUTS, TAP_QUESTION_ORDER

    file_path = os.path.join(questions_dir, 'English.txt')
    if not os.path.isfile(file_path):
        return 0, 'English.txt not found'

    with open(file_path, 'r', encoding='utf-8') as f:
        content = json.load(f)

    questions_data = content.get('questions') or {}
    now = _utc_now()

    with get_connection() as conn:
        quiz = conn.execute('SELECT id FROM quizzes WHERE id = ?', (quiz_id,)).fetchone()
        if not quiz:
            return 0, 'Quiz not found'

        existing = conn.execute(
            'SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = ?',
            (quiz_id,),
        ).fetchone()[0]
        if existing > 0:
            return 0, 'Quiz already has questions. Clear them first or create a new quiz.'

        lang = conn.execute(
            "SELECT language_code FROM quiz_languages WHERE quiz_id = ? AND language_code = 'English'",
            (quiz_id,),
        ).fetchone()
        if not lang:
            conn.execute(
                """
                INSERT INTO quiz_languages (quiz_id, language_code, language_name, is_default)
                VALUES (?, 'English', 'English', 1)
                """,
                (quiz_id,),
            )

        created = 0
        for order_index, key in enumerate(TAP_QUESTION_ORDER):
            qdata = questions_data.get(key)
            if not qdata:
                continue
            layout_type = TAP_QUESTION_LAYOUTS.get(key, 'single_select')
            cur = conn.execute(
                """
                INSERT INTO quiz_questions (
                    quiz_id, question_key, order_index, layout_type, is_required, created_at, updated_at
                ) VALUES (?, ?, ?, ?, 1, ?, ?)
                """,
                (quiz_id, key, order_index, layout_type, now, now),
            )
            question_id = cur.lastrowid

            conn.execute(
                """
                INSERT INTO quiz_question_translations (
                    question_id, language_code, title, subtitle, helper_text, created_at, updated_at
                ) VALUES (?, 'English', ?, NULL, NULL, ?, ?)
                """,
                (question_id, qdata.get('question', key), now, now),
            )

            layout_payload = DEFAULT_LAYOUT_JSON.get(layout_type, {'template': layout_type})
            conn.execute(
                """
                INSERT INTO quiz_layout_configs (question_id, layout_json, created_at, updated_at)
                VALUES (?, ?, ?, ?)
                """,
                (question_id, json.dumps(layout_payload), now, now),
            )

            for opt_index, opt in enumerate(qdata.get('options') or []):
                ocur = conn.execute(
                    """
                    INSERT INTO quiz_options (
                        question_id, option_key, order_index, image_url, value, metadata_json, created_at
                    ) VALUES (?, ?, ?, NULL, NULL, NULL, ?)
                    """,
                    (question_id, opt['key'], opt_index, now),
                )
                option_id = ocur.lastrowid
                conn.execute(
                    """
                    INSERT INTO quiz_option_translations (option_id, language_code, label, description)
                    VALUES (?, 'English', ?, NULL)
                    """,
                    (option_id, opt.get('label', opt['key'])),
                )
            created += 1

        conn.execute('UPDATE quizzes SET updated_at = ? WHERE id = ?', (now, quiz_id))

    return created, None
