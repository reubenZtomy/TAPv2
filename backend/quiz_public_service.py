"""Public quiz resolution and QuizContent-shaped payloads for the mobile app."""

import json
import re
from datetime import datetime

from database import get_connection, new_uuid, row_to_dict
from quiz_builder_service import load_quiz_builder
from quiz_font_service import custom_font_payload

DEFAULT_UI = {
    'back': 'Back',
    'confirm': 'Confirm',
    'passionReset': 'I changed my mind!',
    'partnerEmptySelection': 'Pick a Character!',
    'partnerInstruction': 'Select Character then Confirm',
    'answerInstruction': 'Select Answer then Confirm',
    'imageInstruction': 'Select Image then Confirm',
    'graduationInstruction': 'Select an option to confirm',
    'passionSwipeStart': 'Swipe to the right for more options',
    'passionSwipeMiddle': 'Swipe left or right',
    'passionSwipeEnd': 'Swipe to the right',
    'adventureSwipeStart': 'Swipe right for more options or press confirm',
    'adventureSwipeMiddle': 'Swipe left or right',
    'adventureSwipeEnd': 'Swipe left',
    'resultsMain': 'Gathering results...',
    'resultsSubtitle': 'I wonder where you will go?',
    'resultsButton': 'Click to find out!',
}


def slugify(name: str) -> str:
    s = re.sub(r'[^a-z0-9]+', '-', name.lower().strip())
    return s.strip('-')[:80] or 'quiz'


def build_quiz_content(quiz: dict, language_code: str) -> dict:
    intro = quiz.get('intro_layout') or {}
    intro_i18n = intro.get('i18n') or {}
    lang_intro = intro_i18n.get(language_code) if isinstance(intro_i18n, dict) else {}
    if not isinstance(lang_intro, dict):
        lang_intro = {}
    heading = (lang_intro.get('heading') or intro.get('heading') or '').strip()
    subtitle = (lang_intro.get('subtitle') or intro.get('subtitle') or '').strip()
    start_button = (lang_intro.get('startButton') or intro.get('startButton') or '').strip()
    title_block = {
        'heading': heading.replace('\\n', '\n') if heading else '',
        'subtitle': subtitle,
        'startButton': start_button,
    }
    questions_out: dict = {}
    for q in sorted(quiz.get('questions') or [], key=lambda x: x.get('order_index', 0)):
        key = q['question_key']
        translations = q.get('translations') or {}
        trans = translations.get(language_code)
        if not trans and translations:
            trans = next(iter(translations.values()))
        trans = trans or {}
        options = []
        for opt in q.get('options') or []:
            labels = opt.get('labels') or {}
            label = labels.get(language_code) or labels.get(next(iter(labels), ''), '') if labels else ''
            if not label:
                label = opt.get('option_key', '')
            options.append({'key': opt['option_key'], 'label': label})
        questions_out[key] = {
            'question': trans.get('title') or key,
            'options': options,
        }
        if trans.get('subtitle'):
            questions_out[key]['subtitle'] = trans['subtitle']
    return {
        'title': title_block,
        'ui': DEFAULT_UI,
        'questions': questions_out,
    }


def _parse_json(raw) -> dict | list | None:
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def _link_unavailable_reason(link_row, quiz_row) -> str | None:
    if not link_row:
        return 'not_found'
    if link_row['status'] != 'active':
        return 'link_inactive'
    if quiz_row['status'] != 'active':
        return 'quiz_inactive'
    now = datetime.utcnow()
    if link_row['starts_at']:
        try:
            if datetime.fromisoformat(link_row['starts_at'].replace('Z', '')) > now:
                return 'not_started'
        except ValueError:
            pass
    if link_row['ends_at']:
        try:
            if datetime.fromisoformat(link_row['ends_at'].replace('Z', '')) < now:
                return 'expired'
        except ValueError:
            pass
    return None


def resolve_public_quiz(slug: str) -> dict:
    slug = (slug or '').strip().lower()
    if not slug:
        return {'available': False, 'reason': 'not_found'}

    with get_connection() as conn:
        link_row = conn.execute(
            'SELECT * FROM quiz_links WHERE lower(slug) = ?',
            (slug,),
        ).fetchone()
        if not link_row:
            return {'available': False, 'reason': 'not_found', 'slug': slug}

        quiz_row = conn.execute(
            'SELECT * FROM quizzes WHERE id = ?',
            (link_row['quiz_id'],),
        ).fetchone()
        reason = _link_unavailable_reason(link_row, quiz_row)
        unavailable_cfg = _parse_json(link_row['unavailable_screen_config_json']) or {}

        if reason:
            return {
                'available': False,
                'reason': reason,
                'slug': slug,
                'quiz_name': quiz_row['name'] if quiz_row else None,
                'unavailable': unavailable_cfg,
            }

    quiz = load_quiz_builder(link_row['quiz_id'])
    if not quiz:
        return {'available': False, 'reason': 'not_found', 'slug': slug}

    languages = [lang['language_code'] for lang in quiz.get('languages') or []]
    default_language = link_row['default_language'] or quiz.get('default_language') or (languages[0] if languages else 'English')
    allowed = _parse_json(link_row['allowed_languages_json'])
    if isinstance(allowed, list) and allowed:
        languages = [code for code in languages if code in allowed]

    contents = {code: build_quiz_content(quiz, code) for code in languages}
    sorted_questions = sorted(quiz['questions'], key=lambda x: x['order_index'])
    question_order = [q['question_key'] for q in sorted_questions]
    questions_layout = [
        {
            'id': q['id'],
            'question_key': q['question_key'],
            'layout_type': q['layout_type'],
            'layout': q.get('layout') or {},
            'options': [
                {
                    'option_key': opt.get('option_key') or '',
                    'labels': opt.get('labels') or {},
                }
                for opt in (q.get('options') or [])
            ],
        }
        for q in sorted_questions
    ]
    custom_results = []
    raw_custom = quiz.get('custom_results_json')
    if raw_custom:
        try:
            parsed = json.loads(raw_custom)
            if isinstance(parsed, list):
                custom_results = parsed
        except json.JSONDecodeError:
            custom_results = []

    return {
        'available': True,
        'slug': slug,
        'quiz': {
            'id': quiz['id'],
            'name': quiz['name'],
            'result_engine_type': quiz.get('result_engine_type'),
        },
        'link': {
            'id': link_row['id'],
            'link_name': link_row['link_name'],
            'language_mode': link_row['language_mode'],
            'default_language': default_language,
            'allowed_languages': languages,
        },
        'languages': languages,
        'default_language': default_language,
        'allow_language_selection': link_row['language_mode'] != 'fixed' and len(languages) > 1,
        'content': contents.get(default_language) or (next(iter(contents.values())) if contents else None),
        'contents': contents,
        'intro_layout': quiz.get('intro_layout'),
        'custom_font': custom_font_payload(quiz),
        'question_order': question_order,
        'questions_layout': questions_layout,
        'custom_results': custom_results,
    }


def load_quiz_links(quiz_id: int) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            'SELECT * FROM quiz_links WHERE quiz_id = ? ORDER BY created_at DESC',
            (quiz_id,),
        ).fetchall()
    return [row_to_dict(r) for r in rows]


def create_quiz_link(quiz_id: int, body: dict, user_id: int) -> tuple[dict | None, str | None]:
    link_name = (body.get('link_name') or '').strip()
    if not link_name:
        return None, 'link_name is required'

    slug = (body.get('slug') or slugify(link_name)).strip().lower()
    status = (body.get('status') or 'active').strip()
    language_mode = (body.get('language_mode') or 'allow_selection').strip()
    default_language = body.get('default_language')
    allowed = body.get('allowed_languages')
    now = datetime.utcnow().isoformat()

    with get_connection() as conn:
        if not conn.execute('SELECT id FROM quizzes WHERE id = ?', (quiz_id,)).fetchone():
            return None, 'Quiz not found'

        try:
            conn.execute(
                """
                INSERT INTO quiz_links (
                    link_uuid, quiz_id, link_name, slug, status, language_mode,
                    default_language, allowed_languages_json, unavailable_screen_config_json,
                    starts_at, ends_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    new_uuid(),
                    quiz_id,
                    link_name,
                    slug,
                    status,
                    language_mode,
                    default_language,
                    json.dumps(allowed) if allowed is not None else None,
                    json.dumps(body.get('unavailable_screen') or {}),
                    body.get('starts_at'),
                    body.get('ends_at'),
                    now,
                    now,
                ),
            )
            link_id = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
            row = conn.execute('SELECT * FROM quiz_links WHERE id = ?', (link_id,)).fetchone()
        except Exception as exc:
            if 'UNIQUE' in str(exc):
                return None, 'Slug already in use'
            raise

    return row_to_dict(row), None


def update_quiz_link(link_id: int, body: dict) -> tuple[dict | None, str | None]:
    now = datetime.utcnow().isoformat()
    with get_connection() as conn:
        row = conn.execute('SELECT * FROM quiz_links WHERE id = ?', (link_id,)).fetchone()
        if not row:
            return None, 'Link not found'

        fields = []
        values = []
        for key, col in [
            ('link_name', 'link_name'),
            ('slug', 'slug'),
            ('status', 'status'),
            ('language_mode', 'language_mode'),
            ('default_language', 'default_language'),
            ('starts_at', 'starts_at'),
            ('ends_at', 'ends_at'),
        ]:
            if key in body:
                fields.append(f'{col} = ?')
                values.append(body[key])
        if 'allowed_languages' in body:
            fields.append('allowed_languages_json = ?')
            values.append(json.dumps(body['allowed_languages']))
        if 'unavailable_screen' in body:
            fields.append('unavailable_screen_config_json = ?')
            values.append(json.dumps(body['unavailable_screen']))
        if fields:
            fields.append('updated_at = ?')
            values.append(now)
            values.append(link_id)
            conn.execute(f"UPDATE quiz_links SET {', '.join(fields)} WHERE id = ?", values)

        updated = conn.execute('SELECT * FROM quiz_links WHERE id = ?', (link_id,)).fetchone()
    return row_to_dict(updated), None


def delete_quiz_link(link_id: int) -> bool:
    with get_connection() as conn:
        cur = conn.execute('DELETE FROM quiz_links WHERE id = ?', (link_id,))
        return cur.rowcount > 0
