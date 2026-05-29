"""Admin dashboard summary stats."""

from flask import Blueprint, jsonify

from auth_utils import admin_required
from database import get_connection

admin_dashboard_bp = Blueprint('admin_dashboard', __name__, url_prefix='/api/admin')


@admin_dashboard_bp.route('/dashboard/stats', methods=['GET'])
@admin_required
def dashboard_stats(admin_user):
    with get_connection() as conn:
        total_quizzes = conn.execute('SELECT COUNT(*) FROM quizzes').fetchone()[0]
        active_quizzes = conn.execute(
            "SELECT COUNT(*) FROM quizzes WHERE status = 'active'"
        ).fetchone()[0]
        total_submissions = conn.execute('SELECT COUNT(*) FROM quiz_submissions').fetchone()[0]
        today_submissions = conn.execute(
            """
            SELECT COUNT(*) FROM quiz_submissions
            WHERE date(started_at) = date('now')
            """
        ).fetchone()[0]

        top_personality = conn.execute(
            """
            SELECT result_personality_id, COUNT(*) AS cnt
            FROM quiz_submissions
            WHERE result_personality_id IS NOT NULL AND result_personality_id != ''
            GROUP BY result_personality_id
            ORDER BY cnt DESC
            LIMIT 1
            """
        ).fetchone()

        top_language = conn.execute(
            """
            SELECT language_code, COUNT(*) AS cnt
            FROM quiz_submissions
            WHERE language_code IS NOT NULL AND language_code != ''
            GROUP BY language_code
            ORDER BY cnt DESC
            LIMIT 1
            """
        ).fetchone()

    return jsonify({
        'total_quizzes': total_quizzes,
        'active_quizzes': active_quizzes,
        'total_submissions': total_submissions,
        'today_submissions': today_submissions,
        'top_personality': {
            'id': top_personality[0] if top_personality else None,
            'count': top_personality[1] if top_personality else 0,
        },
        'top_language': {
            'code': top_language[0] if top_language else None,
            'count': top_language[1] if top_language else 0,
        },
    })
