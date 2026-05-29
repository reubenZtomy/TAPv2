"""Saved dashboard table column/filter preferences."""

import json

from flask import Blueprint, jsonify, request

from auth_utils import admin_required
from database import get_connection, row_to_dict

admin_preferences_bp = Blueprint('admin_preferences', __name__, url_prefix='/api/admin')


def _parse_json_field(value, default):
    if value is None:
        return default
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return default


@admin_preferences_bp.route('/table-preferences/<table_name>', methods=['GET'])
@admin_required
def get_table_preferences(admin_user, table_name):
    table_name = (table_name or '').strip()
    if not table_name:
        return jsonify({'error': 'table_name is required'}), 400

    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT * FROM dashboard_table_preferences
            WHERE user_id = ? AND table_name = ?
            """,
            (admin_user['id'], table_name),
        ).fetchone()

    if not row:
        return jsonify({
            'table_name': table_name,
            'columns': None,
            'filters': None,
            'sort': None,
        })

    return jsonify({
        'table_name': table_name,
        'columns': _parse_json_field(row['columns_json'], []),
        'filters': _parse_json_field(row['filters_json'], {}),
        'sort': _parse_json_field(row['sort_json'], {}),
    })


@admin_preferences_bp.route('/table-preferences/<table_name>', methods=['PUT'])
@admin_required
def save_table_preferences(admin_user, table_name):
    table_name = (table_name or '').strip()
    if not table_name:
        return jsonify({'error': 'table_name is required'}), 400

    body = request.get_json(force=True, silent=True) or {}
    columns = body.get('columns')
    filters = body.get('filters')
    sort = body.get('sort')

    if columns is None:
        return jsonify({'error': 'columns is required'}), 400

    columns_json = json.dumps(columns)
    filters_json = json.dumps(filters if filters is not None else {})
    sort_json = json.dumps(sort if sort is not None else {})

    from datetime import datetime

    now = datetime.utcnow().isoformat()

    with get_connection() as conn:
        existing = conn.execute(
            """
            SELECT id FROM dashboard_table_preferences
            WHERE user_id = ? AND table_name = ?
            """,
            (admin_user['id'], table_name),
        ).fetchone()

        if existing:
            conn.execute(
                """
                UPDATE dashboard_table_preferences
                SET columns_json = ?, filters_json = ?, sort_json = ?, updated_at = ?
                WHERE user_id = ? AND table_name = ?
                """,
                (columns_json, filters_json, sort_json, now, admin_user['id'], table_name),
            )
        else:
            conn.execute(
                """
                INSERT INTO dashboard_table_preferences (
                    user_id, table_name, columns_json, filters_json, sort_json,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    admin_user['id'],
                    table_name,
                    columns_json,
                    filters_json,
                    sort_json,
                    now,
                    now,
                ),
            )

        row = conn.execute(
            """
            SELECT * FROM dashboard_table_preferences
            WHERE user_id = ? AND table_name = ?
            """,
            (admin_user['id'], table_name),
        ).fetchone()

    data = row_to_dict(row)
    return jsonify({
        'table_name': table_name,
        'columns': _parse_json_field(data['columns_json'], []),
        'filters': _parse_json_field(data['filters_json'], {}),
        'sort': _parse_json_field(data['sort_json'], {}),
    })
