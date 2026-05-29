"""Admin quiz CRUD and status management."""

from datetime import datetime

from flask import Blueprint, jsonify, request

from auth_utils import admin_required
from database import get_connection, new_uuid, row_to_dict

admin_quizzes_bp = Blueprint('admin_quizzes', __name__, url_prefix='/api/admin')

VALID_STATUSES = {'draft', 'active', 'inactive', 'archived'}
VALID_SORT_FIELDS = {'name', 'status', 'created_at', 'updated_at'}


def _utc_now() -> str:
    return datetime.utcnow().isoformat()


def _quiz_row_to_api(row) -> dict:
    data = row_to_dict(row)
    if data is None:
        return {}
    data['allow_language_selection'] = bool(data.get('allow_language_selection'))
    return data


@admin_quizzes_bp.route('/quizzes', methods=['POST'])
@admin_required
def create_quiz(admin_user):
    body = request.get_json(force=True, silent=True) or {}
    name = (body.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'Quiz name is required'}), 400

    description = (body.get('description') or '').strip() or None
    status = (body.get('status') or 'draft').strip()
    if status not in VALID_STATUSES:
        return jsonify({'error': f'Invalid status. Use one of: {", ".join(sorted(VALID_STATUSES))}'}), 400

    default_language = (body.get('default_language') or 'English').strip()
    allow_language_selection = 1 if body.get('allow_language_selection', True) else 0
    result_engine_type = (body.get('result_engine_type') or 'tap_personality').strip()
    now = _utc_now()

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO quizzes (
                quiz_uuid, name, description, status, created_by,
                default_language, allow_language_selection, result_engine_type,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                new_uuid(),
                name,
                description,
                status,
                admin_user['id'],
                default_language,
                allow_language_selection,
                result_engine_type,
                now,
                now,
            ),
        )
        quiz_id = cursor.lastrowid
        row = conn.execute('SELECT * FROM quizzes WHERE id = ?', (quiz_id,)).fetchone()

    return jsonify({'quiz': _quiz_row_to_api(row)}), 201


@admin_quizzes_bp.route('/quizzes', methods=['GET'])
@admin_required
def list_quizzes(admin_user):
    page = max(1, int(request.args.get('page', 1)))
    page_size = min(100, max(1, int(request.args.get('page_size', 20))))
    status = (request.args.get('status') or '').strip()
    search = (request.args.get('search') or '').strip()
    sort = (request.args.get('sort') or 'updated_at').strip()
    order = (request.args.get('order') or 'desc').strip().lower()

    if sort not in VALID_SORT_FIELDS:
        sort = 'updated_at'
    if order not in ('asc', 'desc'):
        order = 'desc'

    clauses = []
    params: list = []

    if status:
        clauses.append('status = ?')
        params.append(status)
    if search:
        clauses.append('(name LIKE ? OR description LIKE ?)')
        params.extend([f'%{search}%', f'%{search}%'])

    where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ''
    order_sql = f'ORDER BY {sort} {order.upper()}'
    offset = (page - 1) * page_size

    with get_connection() as conn:
        total = conn.execute(
            f'SELECT COUNT(*) FROM quizzes {where_sql}',
            params,
        ).fetchone()[0]
        rows = conn.execute(
            f"""
            SELECT q.*,
                   (SELECT COUNT(*) FROM quiz_submissions s WHERE s.quiz_id = q.id) AS submission_count
            FROM quizzes q
            {where_sql}
            {order_sql}
            LIMIT ? OFFSET ?
            """,
            [*params, page_size, offset],
        ).fetchall()

    quizzes = []
    for row in rows:
        item = _quiz_row_to_api(row)
        item['submission_count'] = row['submission_count']
        quizzes.append(item)

    return jsonify({
        'quizzes': quizzes,
        'pagination': {
            'page': page,
            'page_size': page_size,
            'total': total,
            'total_pages': max(1, (total + page_size - 1) // page_size),
        },
    })


@admin_quizzes_bp.route('/quizzes/<int:quiz_id>', methods=['GET'])
@admin_required
def get_quiz(admin_user, quiz_id):
    with get_connection() as conn:
        row = conn.execute('SELECT * FROM quizzes WHERE id = ?', (quiz_id,)).fetchone()
        if not row:
            return jsonify({'error': 'Quiz not found'}), 404
        languages = conn.execute(
            'SELECT * FROM quiz_languages WHERE quiz_id = ? ORDER BY is_default DESC, language_name',
            (quiz_id,),
        ).fetchall()

    quiz = _quiz_row_to_api(row)
    quiz['languages'] = [
        {**row_to_dict(lang), 'is_default': bool(lang['is_default'])} for lang in languages
    ]
    return jsonify({'quiz': quiz})


@admin_quizzes_bp.route('/quizzes/<int:quiz_id>', methods=['PUT'])
@admin_required
def update_quiz(admin_user, quiz_id):
    body = request.get_json(force=True, silent=True) or {}

    with get_connection() as conn:
        existing = conn.execute('SELECT * FROM quizzes WHERE id = ?', (quiz_id,)).fetchone()
        if not existing:
            return jsonify({'error': 'Quiz not found'}), 404

        name = body.get('name', existing['name'])
        if isinstance(name, str):
            name = name.strip()
        if not name:
            return jsonify({'error': 'Quiz name is required'}), 400

        description = body.get('description', existing['description'])
        if description is not None and isinstance(description, str):
            description = description.strip() or None

        status = body.get('status', existing['status'])
        if status not in VALID_STATUSES:
            return jsonify({'error': f'Invalid status. Use one of: {", ".join(sorted(VALID_STATUSES))}'}), 400

        default_language = body.get('default_language', existing['default_language'])
        allow_language_selection = (
            1 if body.get('allow_language_selection', existing['allow_language_selection']) else 0
        )
        result_engine_type = body.get('result_engine_type', existing['result_engine_type'])
        now = _utc_now()

        conn.execute(
            """
            UPDATE quizzes SET
                name = ?, description = ?, status = ?,
                default_language = ?, allow_language_selection = ?,
                result_engine_type = ?, updated_at = ?
            WHERE id = ?
            """,
            (
                name,
                description,
                status,
                default_language,
                allow_language_selection,
                result_engine_type,
                now,
                quiz_id,
            ),
        )
        row = conn.execute('SELECT * FROM quizzes WHERE id = ?', (quiz_id,)).fetchone()

    return jsonify({'quiz': _quiz_row_to_api(row)})


@admin_quizzes_bp.route('/quizzes/<int:quiz_id>/status', methods=['PATCH'])
@admin_required
def update_quiz_status(admin_user, quiz_id):
    body = request.get_json(force=True, silent=True) or {}
    status = (body.get('status') or '').strip()
    if status not in VALID_STATUSES:
        return jsonify({'error': f'Invalid status. Use one of: {", ".join(sorted(VALID_STATUSES))}'}), 400

    with get_connection() as conn:
        existing = conn.execute('SELECT id FROM quizzes WHERE id = ?', (quiz_id,)).fetchone()
        if not existing:
            return jsonify({'error': 'Quiz not found'}), 404
        conn.execute(
            'UPDATE quizzes SET status = ?, updated_at = ? WHERE id = ?',
            (status, _utc_now(), quiz_id),
        )
        row = conn.execute('SELECT * FROM quizzes WHERE id = ?', (quiz_id,)).fetchone()

    return jsonify({'quiz': _quiz_row_to_api(row)})


@admin_quizzes_bp.route('/quizzes/<int:quiz_id>', methods=['DELETE'])
@admin_required
def delete_quiz(admin_user, quiz_id):
    with get_connection() as conn:
        row = conn.execute(
            'SELECT id, quiz_uuid FROM quizzes WHERE id = ?',
            (quiz_id,),
        ).fetchone()
        if not row:
            return jsonify({'error': 'Quiz not found'}), 404
        if row['quiz_uuid'] == 'tap-system-default':
            return jsonify({'error': 'The default system quiz cannot be deleted.'}), 403
        conn.execute('DELETE FROM quiz_submissions WHERE quiz_id = ?', (quiz_id,))
        conn.execute('DELETE FROM quizzes WHERE id = ?', (quiz_id,))
    return jsonify({'ok': True})


@admin_quizzes_bp.route('/quizzes/<int:quiz_id>/archive', methods=['PATCH'])
@admin_required
def archive_quiz(admin_user, quiz_id):
    with get_connection() as conn:
        existing = conn.execute('SELECT id FROM quizzes WHERE id = ?', (quiz_id,)).fetchone()
        if not existing:
            return jsonify({'error': 'Quiz not found'}), 404
        conn.execute(
            "UPDATE quizzes SET status = 'archived', updated_at = ? WHERE id = ?",
            (_utc_now(), quiz_id),
        )
        row = conn.execute('SELECT * FROM quizzes WHERE id = ?', (quiz_id,)).fetchone()

    return jsonify({'quiz': _quiz_row_to_api(row)})
