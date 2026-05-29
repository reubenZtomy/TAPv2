"""Serve uploaded quiz fonts (public, keyed by quiz UUID)."""

from flask import Blueprint, jsonify, send_file

from quiz_font_service import resolve_font_file

quiz_fonts_bp = Blueprint('quiz_fonts', __name__, url_prefix='/api/quiz-fonts')


@quiz_fonts_bp.route('/<quiz_uuid>/font', methods=['GET'])
def serve_quiz_font(quiz_uuid):
    path, mime = resolve_font_file(quiz_uuid)
    if not path:
        return jsonify({'error': 'Not found'}), 404
    return send_file(path, mimetype=mime)
