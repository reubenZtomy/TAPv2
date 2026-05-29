from conftest import admin_headers


def test_add_question_success(client):
    created = client.post(
        '/api/admin/quizzes',
        headers=admin_headers(client),
        json={'name': 'Builder Test Quiz'},
    ).get_json()
    quiz_id = created['quiz']['id']

    res = client.post(
        f'/api/admin/quizzes/{quiz_id}/questions',
        headers=admin_headers(client),
        json={
            'question_key': 'passion',
            'layout_type': 'swipe_carousel',
            'translations': {'English': {'title': 'Pick your passion'}},
        },
    )
    assert res.status_code == 201
    assert res.get_json()['quiz']['questions'][0]['question_key'] == 'passion'


def test_add_question_without_layout_type(client):
    created = client.post(
        '/api/admin/quizzes',
        headers=admin_headers(client),
        json={'name': 'Unset Layout Quiz'},
    ).get_json()
    quiz_id = created['quiz']['id']

    res = client.post(
        f'/api/admin/quizzes/{quiz_id}/questions',
        headers=admin_headers(client),
        json={
            'question_key': 'new_screen',
            'translations': {'English': {'title': 'New screen'}},
        },
    )
    assert res.status_code == 201
    assert res.get_json()['question']['layout_type'] == ''


def test_add_duplicate_question_key_fails(client):
    created = client.post(
        '/api/admin/quizzes',
        headers=admin_headers(client),
        json={'name': 'Dup Key Quiz'},
    ).get_json()
    quiz_id = created['quiz']['id']
    headers = admin_headers(client)
    client.post(
        f'/api/admin/quizzes/{quiz_id}/questions',
        headers=headers,
        json={'question_key': 'partner', 'layout_type': 'character_choice', 'translations': {'English': {'title': 'A'}}},
    )
    res = client.post(
        f'/api/admin/quizzes/{quiz_id}/questions',
        headers=headers,
        json={'question_key': 'partner', 'layout_type': 'single_select', 'translations': {'English': {'title': 'B'}}},
    )
    assert res.status_code == 409


def test_invalid_layout_type_fails(client):
    created = client.post(
        '/api/admin/quizzes',
        headers=admin_headers(client),
        json={'name': 'Bad Layout Quiz'},
    ).get_json()
    quiz_id = created['quiz']['id']
    res = client.post(
        f'/api/admin/quizzes/{quiz_id}/questions',
        headers=admin_headers(client),
        json={'question_key': 'fun', 'layout_type': 'not_a_real_layout', 'translations': {'English': {'title': 'X'}}},
    )
    assert res.status_code == 400


def test_add_language_to_quiz(client):
    created = client.post(
        '/api/admin/quizzes',
        headers=admin_headers(client),
        json={'name': 'Lang Quiz'},
    ).get_json()
    quiz_id = created['quiz']['id']
    res = client.post(
        f'/api/admin/quizzes/{quiz_id}/languages',
        headers=admin_headers(client),
        json={'language_code': 'Chinese', 'language_name': 'Chinese'},
    )
    assert res.status_code == 201
    codes = [l['language_code'] for l in res.get_json()['quiz']['languages']]
    assert 'Chinese' in codes


def test_publish_requires_tap_keys(client):
    created = client.post(
        '/api/admin/quizzes',
        headers=admin_headers(client),
        json={'name': 'Publish Fail Quiz', 'result_engine_type': 'tap_personality'},
    ).get_json()
    quiz_id = created['quiz']['id']
    res = client.post(f'/api/admin/quizzes/{quiz_id}/publish', headers=admin_headers(client))
    assert res.status_code == 400
    assert 'missing_question_keys' in res.get_json() or res.get_json().get('error')


def test_seed_tap_template_and_publish(client):
    created = client.post(
        '/api/admin/quizzes',
        headers=admin_headers(client),
        json={'name': 'TAP Seed Quiz', 'result_engine_type': 'tap_personality'},
    ).get_json()
    quiz_id = created['quiz']['id']
    headers = admin_headers(client)

    seed = client.post(f'/api/admin/quizzes/{quiz_id}/seed-tap-template', headers=headers)
    assert seed.status_code == 200
    assert seed.get_json()['questions_created'] == 8

    pub = client.post(f'/api/admin/quizzes/{quiz_id}/publish', headers=headers)
    assert pub.status_code == 200
    assert pub.get_json()['quiz']['status'] == 'active'
