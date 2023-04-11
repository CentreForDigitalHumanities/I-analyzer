import re

from django.core import mail


def test_password_reset(db, auth_user, auth_client):
    request_res = auth_client.post(
        '/users/password/reset/', {'email': auth_user.email})
    assert request_res.status_code == 200

    # Check if email was sent
    reset_mail = mail.outbox[0]
    assert reset_mail

    reset_url = re.search(r'password-reset\/(.+)\/(.+)\/',
                          reset_mail.body)
    uid = reset_url.group(1)
    token = reset_url.group(2)

    # Confirm the reset
    new_pass = 'new_password'
    reset_body = {
        'uid': uid,
        'token': token,
        'new_password1': new_pass,
        'new_password2': new_pass
    }
    reset_res = auth_client.post(
        '/users/password/reset/confirm/',
        reset_body
    )
    assert reset_res.status_code == 200

    # Login with the new password
    assert auth_client.post(
        '/users/login/', {'username': auth_user.username, 'password': new_pass}
    ).status_code == 200
