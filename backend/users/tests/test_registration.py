from django.core import mail
import re
from allauth.account.models import EmailAddress


def test_register_verification(client, db, django_user_model):
    creds = {
        'username': 'ThomasCromwell',
        'password1': 'annaregina',
        'password2': 'annaregina',
        'email': 'thomas@wolfhall.com'
    }
    response = client.post('/users/registration/', creds)
    assert response

    # Check if user was registered
    db_user = django_user_model.objects.get(
        username=creds['username'])
    assert db_user

    # Check if registration mail was sent
    box = mail.outbox
    assert len(box) == 1
    verify_mail = box[0]
    assert verify_mail.to[0] == creds['email']

    key = re.search(r'account-confirm-email\/(.+)\/',
                    verify_mail.body).group(1)
    assert key

    # Check key information
    key_info = client.post('/users/registration/key-info/', {'key': key})
    assert key_info.status_code == 200
    assert key_info.data.get('username') == creds.get('username')

    # Check verification
    verify_response = client.post(
        '/users/registration/verify-email/', {'key': key})
    assert verify_response.status_code == 200

    # Check if email address was verified
    allauth_email = EmailAddress.objects.get(user=db_user)
    assert allauth_email.email == creds.get('email')
    assert allauth_email.verified is True
    assert allauth_email.primary is True
