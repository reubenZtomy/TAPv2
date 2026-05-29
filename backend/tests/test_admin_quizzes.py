from conftest import admin_headers, student_headers


def test_create_quiz_success(client):
    res = client.post(
        '/api/admin/quizzes',
        headers=admin_headers(client),
        json={'name': 'New Adventure Quiz', 'description': 'Test quiz'},
    )
    assert res.status_code == 201
    data = res.get_json()
    assert data['quiz']['name'] == 'New Adventure Quiz'
    assert data['quiz']['status'] == 'draft'
    assert data['quiz']['quiz_uuid']


def test_create_quiz_requires_name(client):
    res = client.post(
        '/api/admin/quizzes',
        headers=admin_headers(client),
        json={'description': 'No name'},
    )
    assert res.status_code == 400


def test_update_quiz_success(client):
    created = client.post(
        '/api/admin/quizzes',
        headers=admin_headers(client),
        json={'name': 'Original Name'},
    ).get_json()
    quiz_id = created['quiz']['id']

    res = client.put(
        f'/api/admin/quizzes/{quiz_id}',
        headers=admin_headers(client),
        json={'name': 'Updated Name', 'status': 'active'},
    )
    assert res.status_code == 200
    assert res.get_json()['quiz']['name'] == 'Updated Name'
    assert res.get_json()['quiz']['status'] == 'active'


def test_archive_quiz_sets_status_archived(client):
    created = client.post(
        '/api/admin/quizzes',
        headers=admin_headers(client),
        json={'name': 'To Archive'},
    ).get_json()
    quiz_id = created['quiz']['id']

    res = client.patch(
        f'/api/admin/quizzes/{quiz_id}/archive',
        headers=admin_headers(client),
    )
    assert res.status_code == 200
    assert res.get_json()['quiz']['status'] == 'archived'


def test_list_quizzes_filters_by_status(client):
    client.post(
        '/api/admin/quizzes',
        headers=admin_headers(client),
        json={'name': 'Draft Quiz', 'status': 'draft'},
    )
    client.post(
        '/api/admin/quizzes',
        headers=admin_headers(client),
        json={'name': 'Active Quiz', 'status': 'active'},
    )

    res = client.get(
        '/api/admin/quizzes?status=active',
        headers=admin_headers(client),
    )
    assert res.status_code == 200
    names = [q['name'] for q in res.get_json()['quizzes']]
    assert 'Active Quiz' in names
    assert 'Draft Quiz' not in names


def test_list_quizzes_search_by_name(client):
    client.post(
        '/api/admin/quizzes',
        headers=admin_headers(client),
        json={'name': 'Unique Kangaroo Quiz'},
    )
    res = client.get(
        '/api/admin/quizzes?search=Kangaroo',
        headers=admin_headers(client),
    )
    assert res.status_code == 200
    assert any('Kangaroo' in q['name'] for q in res.get_json()['quizzes'])


def test_update_quiz_status_toggle(client):
    created = client.post(
        '/api/admin/quizzes',
        headers=admin_headers(client),
        json={'name': 'Toggle Quiz', 'status': 'draft'},
    ).get_json()
    quiz_id = created['quiz']['id']

    res = client.patch(
        f'/api/admin/quizzes/{quiz_id}/status',
        headers=admin_headers(client),
        json={'status': 'inactive'},
    )
    assert res.status_code == 200
    assert res.get_json()['quiz']['status'] == 'inactive'


def test_student_cannot_create_quiz(client):
    res = client.post(
        '/api/admin/quizzes',
        headers=student_headers(client),
        json={'name': 'Blocked'},
    )
    assert res.status_code == 403
