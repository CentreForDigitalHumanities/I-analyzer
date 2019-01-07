'''
Route forwarding to login and index
'''

from flask import Blueprint, url_for, redirect
from flask_login import LoginManager, current_user

from . import models

login_manager = LoginManager()
entry = Blueprint('entry', __name__)

@login_manager.user_loader
def load_user(user_id):
    return models.User.query.get(user_id)


@entry.route('/', methods=['GET'])
def init():
    if current_user:
        return redirect(url_for('admin.index'))
    else:
        return redirect(url_for('admin.login'))