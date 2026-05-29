from conftest import admin_headers


def _setup_published_quiz(client, headers: dict, quiz_name: str = 'Public Quiz') -> int:
    created = client.post(
        '/api/admin/quizzes',
        headers=headers,
        json={'name': quiz_name},
    ).get_json()
    quiz_id = created['quiz']['id']
    client.post(
        f'/api/admin/quizzes/{quiz_id}/languages',
        headers=headers,
        json={'language_code': 'English', 'language_name': 'English', 'is_default': True},
    )
    client.post(
        f'/api/admin/quizzes/{quiz_id}/questions',
        headers=headers,
        json={
            'question_key': 'intro_question',
            'layout_type': 'single_select',
            'translations': {'English': {'title': 'Your first question'}},
        },
    )
    pub = client.post(f'/api/admin/quizzes/{quiz_id}/publish', headers=headers)
    assert pub.status_code == 200
    return quiz_id


def test_public_quiz_not_found(client):
    res = client.get('/api/public/quizzes/does-not-exist')
    assert res.status_code == 404
    assert res.get_json()['available'] is False


def test_public_quiz_available_when_active(client):
    headers = admin_headers(client)
    quiz_id = _setup_published_quiz(client, headers, 'Public TAP Quiz')

    link_res = client.post(
        f'/api/admin/quizzes/{quiz_id}/links',
        headers=headers,
        json={'link_name': 'Main', 'slug': 'public-quiz-test', 'status': 'active'},
    )
    assert link_res.status_code == 201

    res = client.get('/api/public/quizzes/public-quiz-test')
    assert res.status_code == 200
    data = res.get_json()
    assert data['available'] is True
    assert data['question_order'] == ['intro_question']
    assert 'intro_layout' in data
    assert len(data['questions_layout']) >= 1


def test_public_quiz_unavailable_when_quiz_draft(client):
    headers = admin_headers(client)
    created = client.post(
        '/api/admin/quizzes',
        headers=headers,
        json={'name': 'Draft Quiz'},
    ).get_json()
    quiz_id = created['quiz']['id']
    client.post(
        f'/api/admin/quizzes/{quiz_id}/links',
        headers=headers,
        json={'link_name': 'Draft Link', 'slug': 'draft-only', 'status': 'active'},
    )
    res = client.get('/api/public/quizzes/draft-only')
    assert res.status_code == 404
    assert res.get_json()['reason'] == 'quiz_inactive'
