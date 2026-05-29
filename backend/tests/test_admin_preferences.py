from conftest import admin_headers


def test_save_and_load_table_preferences(client):
    headers = admin_headers(client)
    payload = {
        'columns': ['name', 'status', 'updated_at'],
        'filters': {'status': 'active'},
        'sort': {'field': 'name', 'order': 'asc'},
    }
    save = client.put(
        '/api/admin/table-preferences/quizzes',
        headers=headers,
        json=payload,
    )
    assert save.status_code == 200
    assert save.get_json()['columns'] == payload['columns']

    load = client.get(
        '/api/admin/table-preferences/quizzes',
        headers=headers,
    )
    assert load.status_code == 200
    data = load.get_json()
    assert data['columns'] == payload['columns']
    assert data['filters'] == payload['filters']
    assert data['sort'] == payload['sort']
