from django.core import mail


def test_register(client, db, django_user_model):
    creds = {
        'username': 'ThomasCromwell',
        'password1': 'annaregina',
        'password2': 'annaregina',
        'email': 'thomas@wolfhall.com'
    }
    response = client.post('/users/registration/', creds)
    assert response

    db_user = django_user_model.objects.get(
        username=creds['username'])
    assert db_user

    box = mail.outbox
    assert len(box) == 1
    assert box[0].to[0] == creds['email']


def test_verify(client):
    assert True
