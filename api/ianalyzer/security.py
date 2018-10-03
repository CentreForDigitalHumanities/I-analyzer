from . import models
from werkzeug.security import check_password_hash
from flask_login import login_user as flask_login_user
from flask_login import logout_user as flask_logout_user
from itsdangerous import URLSafeTimedSerializer
from flask import current_app
from ianalyzer import config_fallback as config


def validate_user(username, password):
    """Validates the user and returns it if the username and password are valid."""
    user = models.User.query.filter_by(username=username).first()

    if user is None:
        # User doesn't exist, or no password has been given or set
        return None

    # Guest user is allowed to have no password
    if user.password is None and any(True for role in user.roles if role.name == "guest"):
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


# lastname to username, trim spaces and check if name already exists, in that case, add number and check again
def generate_username(lastname):
    username=lastname.strip().replace(" ", "")
    user = models.User.query.filter_by(username=username).first()

    if user is None: # username does not exist, can be used rightaway 
        return username

    else:
        for x in range(1,99):
            username_extended=username+str(x)
            #print(username_extended)
            user = models.User.query.filter_by(username=username_extended).first() 
            if user is None: 
                break   
        return username_extended
    
# check if emailadres already exists for registration
def email_unique(email):
    user = models.User.query.filter_by(email=email).first()
    if user is None: # email does not exist, can be used for registration
        return True
    else:
        return False

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