from . import models
from werkzeug.security import check_password_hash
from flask_login import login_user as flask_login_user
from flask_login import logout_user as flask_logout_user


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
