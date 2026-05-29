"""Public quiz access by link slug (no auth)."""

from flask import Blueprint, jsonify

from quiz_public_service import resolve_public_quiz

public_quiz_bp = Blueprint('public_quiz', __name__, url_prefix='/api/public')


@public_quiz_bp.route('/quizzes/<slug>', methods=['GET'])
def get_public_quiz(slug):
    payload = resolve_public_quiz(slug)
    if not payload.get('available'):
        return jsonify(payload), 404
    return jsonify(payload)
