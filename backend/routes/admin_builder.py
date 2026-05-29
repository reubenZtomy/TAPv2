"""Admin quiz builder: languages, questions, options, layout, publish."""

import json
import os
import uuid
from datetime import datetime

from flask import Blueprint, current_app, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename

from auth_utils import admin_required
from database import get_connection, row_to_dict
from quiz_builder_constants import LAYOUT_TYPES, default_layout_json
from quiz_builder_service import load_quiz_builder, validate_publish
from quiz_font_service import delete_quiz_font, save_quiz_font
from quiz_language_json import import_quiz_language_json
from quiz_layout_presets import get_layout_preset, list_layout_presets

admin_builder_bp = Blueprint('admin_builder', __name__, url_prefix='/api/admin')

ALLOWED_UPLOAD_EXTENSIONS = frozenset({'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'})


def _upload_dir() -> str:
    base = os.path.join(os.path.dirname(__file__), '..', 'uploads', 'quiz_assets')
    os.makedirs(base, exist_ok=True)
    return base


def _utc_now() -> str:
    return datetime.utcnow().isoformat()


def _upsert_question_translations(cursor, question_id: int, translations: dict, now: str):
    for language_code, fields in (translations or {}).items():
        if not language_code or not isinstance(fields, dict):
            continue
        title = (fields.get('title') or '').strip()
        if not title:
            continue
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


def _sanitize_layout_payload(layout: dict | None, layout_type: str) -> dict | None:
    if not layout:
        return layout
    if not (layout_type or '').strip():
        cleaned = dict(layout)
        cleaned.pop('template', None)
        return cleaned
    return layout


def _upsert_layout(cursor, question_id: int, layout: dict | None, layout_type: str, now: str):
    layout = _sanitize_layout_payload(layout, layout_type)
    if layout:
        layout_json = json.dumps(layout)
    elif layout_type:
        layout_json = default_layout_json(layout_type)
    else:
        layout_json = '{}'
    existing = cursor.execute(
        'SELECT id FROM quiz_layout_configs WHERE question_id = ?',
        (question_id,),
    ).fetchone()
    if existing:
        cursor.execute(
            'UPDATE quiz_layout_configs SET layout_json = ?, updated_at = ? WHERE question_id = ?',
            (layout_json, now, question_id),
        )
    else:
        cursor.execute(
            """
            INSERT INTO quiz_layout_configs (question_id, layout_json, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            """,
            (question_id, layout_json, now, now),
        )


@admin_builder_bp.route('/quizzes/<int:quiz_id>/font', methods=['POST'])
@admin_required
def upload_quiz_font(admin_user, quiz_id):
    file = request.files.get('file')
    family_name = request.form.get('family_name') or request.form.get('name') or ''
    payload, err = save_quiz_font(quiz_id, file, family_name)
    if err:
        return jsonify({'error': err}), 400
    quiz = load_quiz_builder(quiz_id)
    return jsonify({'custom_font': payload, 'quiz': quiz})


@admin_builder_bp.route('/quizzes/<int:quiz_id>/font', methods=['DELETE'])
@admin_required
def remove_quiz_font(admin_user, quiz_id):
    err = delete_quiz_font(quiz_id)
    if err:
        return jsonify({'error': err}), 404
    quiz = load_quiz_builder(quiz_id)
    return jsonify({'custom_font': None, 'quiz': quiz})


@admin_builder_bp.route('/uploads', methods=['POST'])
@admin_required
def upload_quiz_asset(admin_user):
    file = request.files.get('file')
    if not file or not file.filename:
        return jsonify({'error': 'No file provided'}), 400
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in ALLOWED_UPLOAD_EXTENSIONS:
        return jsonify({'error': f'Allowed types: {", ".join(sorted(ALLOWED_UPLOAD_EXTENSIONS))}'}), 400
    safe = secure_filename(file.filename)
    name = f'{uuid.uuid4().hex}_{safe}' if safe else f'{uuid.uuid4().hex}.{ext}'
    path = os.path.join(_upload_dir(), name)
    file.save(path)
    return jsonify({'url': f'/api/admin/uploads/{name}', 'filename': name})


@admin_builder_bp.route('/uploads/<path:filename>', methods=['GET'])
def get_quiz_asset(filename):
    directory = _upload_dir()
    full = os.path.join(directory, filename)
    if not os.path.isfile(full):
        return jsonify({'error': 'Not found'}), 404
    return send_from_directory(directory, filename)


@admin_builder_bp.route('/quizzes/<int:quiz_id>/intro-layout', methods=['PUT'])
@admin_required
def update_quiz_intro_layout(admin_user, quiz_id):
    body = request.get_json(force=True, silent=True) or {}
    layout = body.get('intro_layout') or body.get('layout')
    if layout is None:
        return jsonify({'error': 'intro_layout required'}), 400
    now = _utc_now()
    with get_connection() as conn:
        row = conn.execute('SELECT id FROM quizzes WHERE id = ?', (quiz_id,)).fetchone()
        if not row:
            return jsonify({'error': 'Quiz not found'}), 404
        conn.execute(
            'UPDATE quizzes SET intro_layout_json = ?, updated_at = ? WHERE id = ?',
            (json.dumps(layout), now, quiz_id),
        )
    payload = load_quiz_builder(quiz_id)
    return jsonify({'quiz': payload})


@admin_builder_bp.route('/layout-presets', methods=['GET'])
@admin_required
def list_question_layout_presets(admin_user):
    return jsonify({'presets': list_layout_presets()})


@admin_builder_bp.route('/quizzes/<int:quiz_id>/builder', methods=['GET'])
@admin_required
def get_quiz_builder(admin_user, quiz_id):
    payload = load_quiz_builder(quiz_id)
    if not payload:
        return jsonify({'error': 'Quiz not found'}), 404
    return jsonify({'quiz': payload})


@admin_builder_bp.route('/quizzes/<int:quiz_id>/publish', methods=['POST'])
@admin_required
def publish_quiz(admin_user, quiz_id):
    ok, missing, err = validate_publish(quiz_id)
    if not ok:
        return jsonify({'error': err, 'missing_question_keys': missing}), 400
    now = _utc_now()
    with get_connection() as conn:
        row = conn.execute('SELECT id FROM quizzes WHERE id = ?', (quiz_id,)).fetchone()
        if not row:
            return jsonify({'error': 'Quiz not found'}), 404
        conn.execute(
            "UPDATE quizzes SET status = 'active', updated_at = ? WHERE id = ?",
            (now, quiz_id),
        )
    payload = load_quiz_builder(quiz_id)
    return jsonify({'quiz': payload, 'message': 'Quiz published'})


@admin_builder_bp.route('/quizzes/<int:quiz_id>/draft', methods=['POST'])
@admin_required
def save_draft_quiz(admin_user, quiz_id):
    now = _utc_now()
    with get_connection() as conn:
        row = conn.execute('SELECT id FROM quizzes WHERE id = ?', (quiz_id,)).fetchone()
        if not row:
            return jsonify({'error': 'Quiz not found'}), 404
        conn.execute(
            "UPDATE quizzes SET status = 'draft', updated_at = ? WHERE id = ?",
            (now, quiz_id),
        )
    payload = load_quiz_builder(quiz_id)
    return jsonify({'quiz': payload, 'message': 'Draft saved'})


@admin_builder_bp.route('/quizzes/<int:quiz_id>/languages', methods=['POST'])
@admin_required
def add_language(admin_user, quiz_id):
    body = request.get_json(force=True, silent=True) or {}
    language_code = (body.get('language_code') or body.get('language_name') or '').strip()
    language_name = (body.get('language_name') or language_code).strip()
    is_default = bool(body.get('is_default', False))

    if not language_code:
        return jsonify({'error': 'language_code is required'}), 400

    now = _utc_now()
    with get_connection() as conn:
        if not conn.execute('SELECT id FROM quizzes WHERE id = ?', (quiz_id,)).fetchone():
            return jsonify({'error': 'Quiz not found'}), 404
        try:
            if is_default:
                conn.execute(
                    'UPDATE quiz_languages SET is_default = 0 WHERE quiz_id = ?',
                    (quiz_id,),
                )
            conn.execute(
                """
                INSERT INTO quiz_languages (quiz_id, language_code, language_name, is_default, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (quiz_id, language_code, language_name, 1 if is_default else 0, now),
            )
        except Exception as exc:
            if 'UNIQUE' in str(exc):
                return jsonify({'error': 'Language already exists for this quiz'}), 409
            raise
        conn.execute('UPDATE quizzes SET updated_at = ? WHERE id = ?', (now, quiz_id))

    payload = load_quiz_builder(quiz_id)
    return jsonify({'quiz': payload}), 201


@admin_builder_bp.route('/quizzes/<int:quiz_id>/import-language-json', methods=['POST'])
@admin_required
def import_language_json(admin_user, quiz_id):
    body = request.get_json(force=True, silent=True) or {}
    payload = body.get('json') or body.get('payload')
    if not isinstance(payload, dict):
        return jsonify({'error': 'json payload is required'}), 400
    language_code = (body.get('language_code') or '').strip() or None
    language_name = (body.get('language_name') or '').strip() or None
    quiz, err = import_quiz_language_json(quiz_id, payload, language_code, language_name)
    if err:
        return jsonify({'error': err}), 400
    lang_code = language_code or (payload.get('_language') or {}).get('target_language') or ''
    return jsonify({
        'quiz': quiz,
        'language_code': lang_code,
        'message': 'Language successfully added. Please add the language switcher element on your design.',
    })


@admin_builder_bp.route('/quizzes/<int:quiz_id>/languages/<int:language_id>', methods=['DELETE'])
@admin_required
def delete_language(admin_user, quiz_id, language_id):
    with get_connection() as conn:
        row = conn.execute(
            'SELECT * FROM quiz_languages WHERE id = ? AND quiz_id = ?',
            (language_id, quiz_id),
        ).fetchone()
        if not row:
            return jsonify({'error': 'Language not found'}), 404
        conn.execute('DELETE FROM quiz_languages WHERE id = ?', (language_id,))
        if row['is_default']:
            fallback = conn.execute(
                'SELECT id FROM quiz_languages WHERE quiz_id = ? LIMIT 1',
                (quiz_id,),
            ).fetchone()
            if fallback:
                conn.execute(
                    'UPDATE quiz_languages SET is_default = 1 WHERE id = ?',
                    (fallback['id'],),
                )
        conn.execute('UPDATE quizzes SET updated_at = ? WHERE id = ?', (_utc_now(), quiz_id))

    payload = load_quiz_builder(quiz_id)
    return jsonify({'quiz': payload})


@admin_builder_bp.route('/quizzes/<int:quiz_id>/questions', methods=['POST'])
@admin_required
def add_question(admin_user, quiz_id):
    body = request.get_json(force=True, silent=True) or {}
    question_key = (body.get('question_key') or '').strip()
    preset_id = (body.get('preset_id') or '').strip()
    layout_type = (body.get('layout_type') or '').strip()
    layout_payload = body.get('layout')

    if preset_id:
        preset = get_layout_preset(preset_id)
        if not preset:
            return jsonify({'error': 'Unknown preset_id'}), 400
        layout_type = preset['layout_type']
        layout_payload = preset.get('layout')

    if not question_key:
        return jsonify({'error': 'question_key is required'}), 400
    if layout_type and layout_type not in LAYOUT_TYPES:
        return jsonify({'error': f'Invalid layout_type. Use one of: {", ".join(sorted(LAYOUT_TYPES))}'}), 400

    now = _utc_now()
    with get_connection() as conn:
        if not conn.execute('SELECT id FROM quizzes WHERE id = ?', (quiz_id,)).fetchone():
            return jsonify({'error': 'Quiz not found'}), 404

        max_order = conn.execute(
            'SELECT COALESCE(MAX(order_index), -1) FROM quiz_questions WHERE quiz_id = ?',
            (quiz_id,),
        ).fetchone()[0]
        order_index = body.get('order_index', max_order + 1)

        try:
            cur = conn.execute(
                """
                INSERT INTO quiz_questions (
                    quiz_id, question_key, order_index, layout_type, is_required,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    quiz_id,
                    question_key,
                    int(order_index),
                    layout_type,
                    1 if body.get('is_required', True) else 0,
                    now,
                    now,
                ),
            )
            question_id = cur.lastrowid
        except Exception as exc:
            if 'UNIQUE' in str(exc):
                return jsonify({'error': 'question_key already exists on this quiz'}), 409
            raise

        _upsert_question_translations(conn, question_id, body.get('translations'), now)
        if layout_type:
            _upsert_layout(conn, question_id, layout_payload, layout_type, now)

        for opt_index, opt in enumerate(body.get('options') or []):
            _create_option(conn, question_id, opt, opt_index, now)

        conn.execute('UPDATE quizzes SET updated_at = ? WHERE id = ?', (now, quiz_id))

    payload = load_quiz_builder(quiz_id)
    question = next((q for q in payload['questions'] if q['id'] == question_id), None)
    return jsonify({'question': question, 'quiz': payload}), 201


def _create_option(cursor, question_id: int, opt: dict, order_index: int, now: str):
    option_key = (opt.get('option_key') or '').strip()
    if not option_key:
        return
    ocur = cursor.execute(
        """
        INSERT INTO quiz_options (
            question_id, option_key, order_index, image_url, value, metadata_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            question_id,
            option_key,
            opt.get('order_index', order_index),
            opt.get('image_url'),
            opt.get('value'),
            json.dumps(opt.get('metadata')) if opt.get('metadata') else None,
            now,
        ),
    )
    option_id = ocur.lastrowid
    for language_code, label in (opt.get('labels') or {}).items():
        if not label:
            continue
        cursor.execute(
            """
            INSERT INTO quiz_option_translations (option_id, language_code, label, description)
            VALUES (?, ?, ?, NULL)
            """,
            (option_id, language_code, str(label).strip()),
        )


@admin_builder_bp.route('/questions/<int:question_id>', methods=['PUT'])
@admin_required
def update_question(admin_user, question_id):
    body = request.get_json(force=True, silent=True) or {}
    now = _utc_now()

    with get_connection() as conn:
        row = conn.execute('SELECT * FROM quiz_questions WHERE id = ?', (question_id,)).fetchone()
        if not row:
            return jsonify({'error': 'Question not found'}), 404
        quiz_id = row['quiz_id']

        layout_type = body.get('layout_type', row['layout_type'])
        if isinstance(layout_type, str):
            layout_type = layout_type.strip()
        if layout_type and layout_type not in LAYOUT_TYPES:
            return jsonify({'error': 'Invalid layout_type'}), 400

        question_key = body.get('question_key', row['question_key'])
        if isinstance(question_key, str):
            question_key = question_key.strip()

        try:
            conn.execute(
                """
                UPDATE quiz_questions SET
                    question_key = ?, layout_type = ?,
                    is_required = ?, updated_at = ?
                WHERE id = ?
                """,
                (
                    question_key,
                    layout_type,
                    1 if body.get('is_required', row['is_required']) else 0,
                    now,
                    question_id,
                ),
            )
        except Exception as exc:
            if 'UNIQUE' in str(exc):
                return jsonify({'error': 'question_key already exists on this quiz'}), 409
            raise

        if 'translations' in body:
            _upsert_question_translations(conn, question_id, body['translations'], now)
        if 'layout' in body or ('layout_type' in body and layout_type):
            _upsert_layout(conn, question_id, body.get('layout'), layout_type, now)

        conn.execute('UPDATE quizzes SET updated_at = ? WHERE id = ?', (now, quiz_id))

    payload = load_quiz_builder(quiz_id)
    question = next((q for q in payload['questions'] if q['id'] == question_id), None)
    return jsonify({'question': question, 'quiz': payload})


@admin_builder_bp.route('/questions/<int:question_id>', methods=['DELETE'])
@admin_required
def delete_question(admin_user, question_id):
    with get_connection() as conn:
        row = conn.execute('SELECT quiz_id FROM quiz_questions WHERE id = ?', (question_id,)).fetchone()
        if not row:
            return jsonify({'error': 'Question not found'}), 404
        quiz_id = row['quiz_id']
        conn.execute('DELETE FROM quiz_questions WHERE id = ?', (question_id,))
        conn.execute('UPDATE quizzes SET updated_at = ? WHERE id = ?', (_utc_now(), quiz_id))

    payload = load_quiz_builder(quiz_id)
    return jsonify({'quiz': payload})


@admin_builder_bp.route('/quizzes/<int:quiz_id>/questions/reorder', methods=['PUT'])
@admin_required
def reorder_questions(admin_user, quiz_id):
    body = request.get_json(force=True, silent=True) or {}
    order_list = body.get('order') or []
    if not isinstance(order_list, list):
        return jsonify({'error': 'order must be an array of { id, order_index }'}), 400

    now = _utc_now()
    with get_connection() as conn:
        if not conn.execute('SELECT id FROM quizzes WHERE id = ?', (quiz_id,)).fetchone():
            return jsonify({'error': 'Quiz not found'}), 404
        for item in order_list:
            qid = item.get('id')
            oidx = item.get('order_index')
            if qid is None or oidx is None:
                continue
            conn.execute(
                'UPDATE quiz_questions SET order_index = ?, updated_at = ? WHERE id = ? AND quiz_id = ?',
                (int(oidx), now, int(qid), quiz_id),
            )
        conn.execute('UPDATE quizzes SET updated_at = ? WHERE id = ?', (now, quiz_id))

    payload = load_quiz_builder(quiz_id)
    return jsonify({'quiz': payload})


@admin_builder_bp.route('/questions/<int:question_id>/layout', methods=['PUT'])
@admin_required
def update_question_layout(admin_user, question_id):
    body = request.get_json(force=True, silent=True) or {}
    layout_type = (body.get('layout_type') or '').strip()
    now = _utc_now()

    with get_connection() as conn:
        row = conn.execute('SELECT * FROM quiz_questions WHERE id = ?', (question_id,)).fetchone()
        if not row:
            return jsonify({'error': 'Question not found'}), 404
        if layout_type and layout_type not in LAYOUT_TYPES:
            return jsonify({'error': 'Invalid layout_type'}), 400

        row_layout_type = (row['layout_type'] or '').strip()
        if layout_type:
            conn.execute(
                'UPDATE quiz_questions SET layout_type = ?, updated_at = ? WHERE id = ?',
                (layout_type, now, question_id),
            )
            lt = layout_type
        else:
            lt = row_layout_type

        layout_payload = body.get('layout_json') or body.get('layout')
        if layout_payload is not None:
            _upsert_layout(conn, question_id, layout_payload, lt, now)
        quiz_id = row['quiz_id']
        conn.execute('UPDATE quizzes SET updated_at = ? WHERE id = ?', (now, quiz_id))

    payload = load_quiz_builder(quiz_id)
    question = next((q for q in payload['questions'] if q['id'] == question_id), None)
    return jsonify({'question': question, 'quiz': payload})


@admin_builder_bp.route('/questions/<int:question_id>/options', methods=['POST'])
@admin_required
def add_option(admin_user, question_id):
    body = request.get_json(force=True, silent=True) or {}
    now = _utc_now()

    with get_connection() as conn:
        row = conn.execute('SELECT quiz_id FROM quiz_questions WHERE id = ?', (question_id,)).fetchone()
        if not row:
            return jsonify({'error': 'Question not found'}), 404
        quiz_id = row['quiz_id']
        max_order = conn.execute(
            'SELECT COALESCE(MAX(order_index), -1) FROM quiz_options WHERE question_id = ?',
            (question_id,),
        ).fetchone()[0]
        try:
            _create_option(conn, question_id, body, body.get('order_index', max_order + 1), now)
        except Exception as exc:
            if 'UNIQUE' in str(exc):
                return jsonify({'error': 'option_key already exists on this question'}), 409
            raise
        conn.execute('UPDATE quizzes SET updated_at = ? WHERE id = ?', (now, quiz_id))

    payload = load_quiz_builder(quiz_id)
    return jsonify({'quiz': payload}), 201


@admin_builder_bp.route('/options/<int:option_id>', methods=['PUT'])
@admin_required
def update_option(admin_user, option_id):
    body = request.get_json(force=True, silent=True) or {}
    now = _utc_now()

    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT o.*, q.quiz_id FROM quiz_options o
            JOIN quiz_questions q ON q.id = o.question_id
            WHERE o.id = ?
            """,
            (option_id,),
        ).fetchone()
        if not row:
            return jsonify({'error': 'Option not found'}), 404

        conn.execute(
            """
            UPDATE quiz_options SET
                option_key = ?, order_index = ?, image_url = ?, value = ?, metadata_json = ?
            WHERE id = ?
            """,
            (
                body.get('option_key', row['option_key']),
                body.get('order_index', row['order_index']),
                body.get('image_url', row['image_url']),
                body.get('value', row['value']),
                json.dumps(body['metadata']) if body.get('metadata') is not None else row['metadata_json'],
                option_id,
            ),
        )

        if 'labels' in body:
            for language_code, label in body['labels'].items():
                existing = conn.execute(
                    'SELECT id FROM quiz_option_translations WHERE option_id = ? AND language_code = ?',
                    (option_id, language_code),
                ).fetchone()
                if existing:
                    conn.execute(
                        'UPDATE quiz_option_translations SET label = ? WHERE option_id = ? AND language_code = ?',
                        (str(label).strip(), option_id, language_code),
                    )
                else:
                    conn.execute(
                        """
                        INSERT INTO quiz_option_translations (option_id, language_code, label, description)
                        VALUES (?, ?, ?, NULL)
                        """,
                        (option_id, language_code, str(label).strip()),
                    )

        conn.execute('UPDATE quizzes SET updated_at = ? WHERE id = ?', (now, row['quiz_id']))

    payload = load_quiz_builder(row['quiz_id'])
    return jsonify({'quiz': payload})


@admin_builder_bp.route('/options/<int:option_id>', methods=['DELETE'])
@admin_required
def delete_option(admin_user, option_id):
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT o.question_id, q.quiz_id FROM quiz_options o
            JOIN quiz_questions q ON q.id = o.question_id
            WHERE o.id = ?
            """,
            (option_id,),
        ).fetchone()
        if not row:
            return jsonify({'error': 'Option not found'}), 404
        conn.execute('DELETE FROM quiz_options WHERE id = ?', (option_id,))
        conn.execute('UPDATE quizzes SET updated_at = ? WHERE id = ?', (_utc_now(), row['quiz_id']))

    payload = load_quiz_builder(row['quiz_id'])
    return jsonify({'quiz': payload})
