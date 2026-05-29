from conftest import admin_headers


def test_list_layout_presets(client):
    res = client.get('/api/admin/layout-presets', headers=admin_headers(client))
    assert res.status_code == 200
    presets = res.get_json()['presets']
    assert len(presets) >= 1
    assert 'id' in presets[0]
    assert 'layout_type' in presets[0]


def test_add_question_with_preset_id(client):
    created = client.post(
        '/api/admin/quizzes',
        headers=admin_headers(client),
        json={'name': 'Preset Quiz'},
    ).get_json()
    quiz_id = created['quiz']['id']
    headers = admin_headers(client)

    presets = client.get('/api/admin/layout-presets', headers=headers).get_json()['presets']
    preset_id = presets[0]['id']

    res = client.post(
        f'/api/admin/quizzes/{quiz_id}/questions',
        headers=headers,
        json={
            'question_key': 'custom_step',
            'preset_id': preset_id,
            'translations': {'English': {'title': 'Custom step'}},
        },
    )
    assert res.status_code == 201
    q = res.get_json()['quiz']['questions'][0]
    assert q['question_key'] == 'custom_step'
    assert q['layout_type'] == presets[0]['layout_type']
    assert q.get('layout') is not None


def test_add_question_unknown_preset_fails(client):
    created = client.post(
        '/api/admin/quizzes',
        headers=admin_headers(client),
        json={'name': 'Bad Preset Quiz'},
    ).get_json()
    quiz_id = created['quiz']['id']
    res = client.post(
        f'/api/admin/quizzes/{quiz_id}/questions',
        headers=admin_headers(client),
        json={'question_key': 'x', 'preset_id': 'not-a-real-preset'},
    )
    assert res.status_code == 400
