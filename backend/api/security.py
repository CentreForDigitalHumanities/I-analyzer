from werkzeug.security import check_password_hash
from flask_login import login_user as flask_login_user
from flask_login import logout_user as flask_logout_user
from itsdangerous import URLSafeTimedSerializer, BadSignature, BadTimeSignature
from flask import current_app
from ianalyzer import models

def validate_user(username, password):
    """Validates the user and returns it if the username and password are valid."""
    user = models.User.query.filter_by(username=username).first()

    if user is None:
        # User doesn't exist, or no password has been given or set
        return None

    if not password or user.password is None:
        return None

    if not check_password_hash(user.password, password):
        return None

    return user


def login_user(user):
    """Login a user, make sure it has already been validated!"""
    user.authenticated = True
    models.db.session.commit()
    flask_login_user(user)


def is_unique_username(username):
    ''' Check if a username is unique '''
    username=username.strip().replace(" ", "")
    user = models.User.query.filter_by(username=username).first()
    return user is None


def is_unique_non_solis_email(email):
    ''' Check if email address is unique '''
    user = models.User.query.filter_by(email=email).first()
    if user and user.saml==True:
        # if the user has registered via saml before, permit making an account
        return True
    else:
        return user is None


def get_token(input):
    '''
    Generate a safe token based on your input.
    Note that on the basis of the token you can retrieve the original input (see below) 
    '''
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return serializer.dumps(input, salt=current_app.config['SECURITY_PASSWORD_SALT'])


def get_original_token_input(token, expiration=3600):
    '''
    Retrieve the original input from the token.
    Will return False if the token has expired.
    '''
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        original_input = serializer.loads(
            token,
            salt=current_app.config['SECURITY_PASSWORD_SALT'],
            max_age=expiration
        )
    except (BadSignature, BadTimeSignature):
        return False
    return original_input
