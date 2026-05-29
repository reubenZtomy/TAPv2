"""Admin CRUD for quiz public links."""

from flask import Blueprint, jsonify, request

from auth_utils import admin_required
from quiz_public_service import (
    create_quiz_link,
    delete_quiz_link,
    load_quiz_links,
    slugify,
    update_quiz_link,
)

admin_links_bp = Blueprint('admin_links', __name__, url_prefix='/api/admin')


@admin_links_bp.route('/quizzes/<int:quiz_id>/links', methods=['GET'])
@admin_required
def list_links(admin_user, quiz_id):
    return jsonify({'links': load_quiz_links(quiz_id)})


@admin_links_bp.route('/quizzes/<int:quiz_id>/links', methods=['POST'])
@admin_required
def create_link(admin_user, quiz_id):
    body = request.get_json(force=True, silent=True) or {}
    link, err = create_quiz_link(quiz_id, body, admin_user['id'])
    if err:
        status = 409 if 'Slug' in err else 400
        return jsonify({'error': err}), status
    return jsonify({'link': link}), 201


@admin_links_bp.route('/links/<int:link_id>', methods=['PUT'])
@admin_required
def update_link(admin_user, link_id):
    body = request.get_json(force=True, silent=True) or {}
    link, err = update_quiz_link(link_id, body)
    if err:
        return jsonify({'error': err}), 404 if err == 'Link not found' else 400
    return jsonify({'link': link})


@admin_links_bp.route('/links/<int:link_id>', methods=['DELETE'])
@admin_required
def remove_link(admin_user, link_id):
    if not delete_quiz_link(link_id):
        return jsonify({'error': 'Link not found'}), 404
    return jsonify({'ok': True})


@admin_links_bp.route('/quizzes/<int:quiz_id>/links/suggest-slug', methods=['GET'])
@admin_required
def suggest_slug(admin_user, quiz_id):
    name = request.args.get('name', '')
    return jsonify({'slug': slugify(name)})
