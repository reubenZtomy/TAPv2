from conftest import admin_headers, student_headers


def test_admin_required_blocks_missing_token(client):
    res = client.get('/api/admin/quizzes')
    assert res.status_code == 401


def test_admin_required_blocks_non_admin(client):
    res = client.get('/api/admin/quizzes', headers=student_headers(client))
    assert res.status_code == 403
    assert res.get_json()['error'] == 'Admin access required'


def test_admin_required_allows_admin(client):
    res = client.get('/api/admin/quizzes', headers=admin_headers(client))
    assert res.status_code == 200
