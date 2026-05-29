from conftest import admin_headers


def _setup_quiz(client, headers):
    created = client.post(
        '/api/admin/quizzes',
        headers=headers,
        json={'name': 'Language Import Quiz'},
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
            'question_key': 'passion',
            'translations': {'English': {'title': 'Choose your path'}},
            'options': [
                {'option_key': 'business', 'labels': {'English': 'BUSINESS'}},
                {'option_key': 'engineering', 'labels': {'English': 'ENGINEERING'}},
            ],
        },
    )
    return quiz_id


def test_import_language_json_legacy_english_txt_format(client):
    """Import matches English.txt shape: title, ui, questions with key/label options."""
    headers = admin_headers(client)
    quiz_id = _setup_quiz(client, headers)

    payload = {
        'title': {
            'heading': '澳洲留學\n測驗',
            'subtitle': '你最適合哪裡？',
            'startButton': '點擊開始',
        },
        'ui': {
            'back': '返回',
            'confirm': '確認',
        },
        'questions': {
            'passion': {
                'question': '選擇你的澳洲知識修煉之路！',
                'options': [
                    {'key': 'business', 'label': '商科'},
                    {'key': 'engineering', 'label': '工程'},
                ],
            }
        },
    }

    res = client.post(
        f'/api/admin/quizzes/{quiz_id}/import-language-json',
        headers=headers,
        json={'json': payload, 'language_code': 'Chinese', 'language_name': 'Chinese'},
    )
    assert res.status_code == 200
    body = res.get_json()
    assert body['language_code'] == 'Chinese'
    quiz = body['quiz']
    assert any(lang['language_code'] == 'Chinese' for lang in quiz['languages'])
    question = next(q for q in quiz['questions'] if q['question_key'] == 'passion')
    assert question['translations']['Chinese']['title'] == '選擇你的澳洲知識修煉之路！'
    assert question['options'][0]['labels']['Chinese'] == '商科'


def test_import_language_json_with_metadata_wrapper(client):
    headers = admin_headers(client)
    quiz_id = _setup_quiz(client, headers)

    payload = {
        '_language': {
            'target_language': 'Spanish',
            'target_language_name': 'Spanish',
        },
        'title': {
            'heading': 'Hola',
            'subtitle': 'Bienvenido',
            'startButton': 'Empezar',
        },
        'ui': {'back': 'Atrás'},
        'questions': {
            'passion': {
                'question': 'Hola mundo',
                'options': [
                    {'key': 'business', 'label': 'Sí'},
                    {'key': 'engineering', 'label': 'No'},
                ],
            }
        },
    }

    res = client.post(
        f'/api/admin/quizzes/{quiz_id}/import-language-json',
        headers=headers,
        json={'json': payload},
    )
    assert res.status_code == 200
    body = res.get_json()
    assert body['language_code'] == 'Spanish'
    question = next(q for q in body['quiz']['questions'] if q['question_key'] == 'passion')
    assert question['translations']['Spanish']['title'] == 'Hola mundo'
