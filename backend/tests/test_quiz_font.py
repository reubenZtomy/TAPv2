import io

from conftest import admin_headers


def _create_quiz(client):
    res = client.post(
        '/api/admin/quizzes',
        headers=admin_headers(client),
        json={'name': 'Font Test Quiz'},
    )
    return res.get_json()['quiz']


def test_upload_and_serve_quiz_font(client):
    quiz = _create_quiz(client)
    quiz_id = quiz['id']
    quiz_uuid = quiz['quiz_uuid']
    headers = admin_headers(client)

    font_bytes = b'\x00\x01\x02\x03'
    res = client.post(
        f'/api/admin/quizzes/{quiz_id}/font',
        headers=headers,
        data={'file': (io.BytesIO(font_bytes), 'MyFont.ttf'), 'family_name': 'My Quiz Font'},
        content_type='multipart/form-data',
    )
    assert res.status_code == 200
    body = res.get_json()
    assert body['custom_font']['family'] == 'My Quiz Font'
    assert body['custom_font']['url'] == f'/api/quiz-fonts/{quiz_uuid}/font'

    serve = client.get(f'/api/quiz-fonts/{quiz_uuid}/font')
    assert serve.status_code == 200
    assert serve.data == font_bytes


def test_replace_quiz_font_deletes_old_file(client):
    quiz = _create_quiz(client)
    quiz_id = quiz['id']
    headers = admin_headers(client)

    first = client.post(
        f'/api/admin/quizzes/{quiz_id}/font',
        headers=headers,
        data={'file': (io.BytesIO(b'first'), 'a.ttf'), 'family_name': 'Font A'},
        content_type='multipart/form-data',
    )
    assert first.status_code == 200

    second = client.post(
        f'/api/admin/quizzes/{quiz_id}/font',
        headers=headers,
        data={'file': (io.BytesIO(b'second'), 'b.woff2'), 'family_name': 'Font B'},
        content_type='multipart/form-data',
    )
    assert second.status_code == 200
    assert second.get_json()['custom_font']['family'] == 'Font B'
    assert second.get_json()['custom_font']['filename'] == 'font.woff2'


def test_delete_quiz_font(client):
    quiz = _create_quiz(client)
    quiz_id = quiz['id']
    quiz_uuid = quiz['quiz_uuid']
    headers = admin_headers(client)

    client.post(
        f'/api/admin/quizzes/{quiz_id}/font',
        headers=headers,
        data={'file': (io.BytesIO(b'x'), 'x.otf'), 'family_name': 'Gone'},
        content_type='multipart/form-data',
    )

    deleted = client.delete(f'/api/admin/quizzes/{quiz_id}/font', headers=headers)
    assert deleted.status_code == 200
    assert deleted.get_json()['custom_font'] is None

    serve = client.get(f'/api/quiz-fonts/{quiz_uuid}/font')
    assert serve.status_code == 404
