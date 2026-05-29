from conftest import admin_headers


def _seed_and_publish_tap(client, quiz_id: int, headers: dict):
    client.post(f'/api/admin/quizzes/{quiz_id}/seed-tap-template', headers=headers)
    res = client.post(f'/api/admin/quizzes/{quiz_id}/publish', headers=headers)
    assert res.status_code == 200


def test_public_quiz_not_found(client):
    res = client.get('/api/public/quizzes/does-not-exist')
    assert res.status_code == 404
    assert res.get_json()['available'] is False


def test_public_quiz_available_when_active(client):
    headers = admin_headers(client)
    created = client.post(
        '/api/admin/quizzes',
        headers=headers,
        json={'name': 'Public TAP Quiz'},
    ).get_json()
    quiz_id = created['quiz']['id']
    _seed_and_publish_tap(client, quiz_id, headers)

    link_res = client.post(
        f'/api/admin/quizzes/{quiz_id}/links',
        headers=headers,
        json={'link_name': 'Main', 'slug': 'public-tap-test', 'status': 'active'},
    )
    assert link_res.status_code == 201

    res = client.get('/api/public/quizzes/public-tap-test')
    assert res.status_code == 200
    data = res.get_json()
    assert data['available'] is True
    assert data['question_order']
    assert 'passion' in data['question_order']
    assert data['content']['questions']['passion']['question']
    assert len(data['questions_layout']) >= 8
    assert data['questions_layout'][0]['layout'] is not None
    assert 'intro_layout' in data


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
