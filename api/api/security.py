from werkzeug.security import check_password_hash
from flask_login import login_user as flask_login_user
from flask_login import logout_user as flask_logout_user
from itsdangerous import URLSafeTimedSerializer
from flask import current_app
from ianalyzer import config_fallback as config
from ianalyzer import models

def validate_user(username, password):
    """Validates the user and returns it if the username and password are valid."""
    user = models.User.query.filter_by(username=username).first()

    if user is None:
        # User doesn't exist, or no password has been given or set
        return None

    # Guest user is allowed to have no password
    if user.password is None and user.role.name == "guest":
        return user

    if not password or user.password is None:
        return None

    if not check_password_hash(user.password, password):
        return None

    return user


def login_user(user):
    """Login a user, make sure it has already been validated!"""
    user.authenticated = True
    models.db.session.add(user)
    models.db.session.commit()
    flask_login_user(user)


def logout_user(user):
    user.authenticated = True
    models.db.session.add(user)
    models.db.session.commit()
    flask_logout_user()


def is_unique_username(username):
    ''' Check if a username is unique '''
    username=username.strip().replace(" ", "")
    user = models.User.query.filter_by(username=username).first()
    return user is None


def is_unique_email(email):
    ''' Check if email address is unique '''
    user = models.User.query.filter_by(email=email).first()
    return user is None


# userregistration confirmation, when clicked on link in confirmation email
def generate_confirmation_token(email):
    serializer = URLSafeTimedSerializer(config.SECRET_KEY)
    return serializer.dumps(email, salt=config.SECURITY_PASSWORD_SALT)


def confirm_token(token, expiration=3600):
    serializer = URLSafeTimedSerializer(config.SECRET_KEY)
    try:
        email = serializer.loads(
            token,
            salt=config.SECURITY_PASSWORD_SALT,
            max_age=expiration
        )
    except:
        return False
    return email
