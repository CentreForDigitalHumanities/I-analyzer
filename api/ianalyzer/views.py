'''
Views.
'''

import logging
logger = logging.getLogger(__name__)
from flask import request, flash, redirect, url_for
import flask_admin as admin
import flask_admin.contrib.sqla as admin_sqla
from flask_login import LoginManager, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash
from wtforms.widgets import PasswordInput

from . import config
from . import forms
from . import models
from . import corpora
from . import security


class ModelView(admin_sqla.ModelView):

    def is_accessible(self):
        return current_user.is_authenticated and current_user.has_role('admin')

    def inaccessible_callback(self, name, **kwargs):
        flash('Could not view page (requires administrator access).')
        return redirect(url_for('admin.index'))


class QueryView(admin_sqla.ModelView):
    can_create = False
    can_edit = False

    column_filters = [
        'user.username'
    ]


class RoleView(ModelView):
    # specifies the fields and order in the create- and edit view
    form_create_rules = (
        'name', 'description', 'corpora', 'users')
    form_edit_rules = (
        'name', 'description', 'corpora', 'users')
    

class CorpusViewAdmin(ModelView):
    # add created corpus to admin role
    def after_model_change(self, form, model, is_created):
        admin = models.Role.query.filter_by(name='admin').first()
        exists=False

        for corpus in admin.corpora:
            if corpus == model:
                exists=True
                break

        if not exists:
            admin.corpora.append(model)
            models.db.session.commit()



class UserView(ModelView):
    # specifies the columns and the order in users view
    column_list = ['username', 'role', 'email',
                   'active', 'authenticated', 'download_limit']

    # specifies the fields and their order in create and edit views
    form_create_rules = (
        'username', 'password', 'role', 'email', 'active', 'authenticated', 'download_limit')
    form_edit_rules = (
        'username', 'password', 'role', 'email', 'active', 'authenticated', 'download_limit')

    form_overrides = dict(
        password=forms.PasswordField,
        queries=None,
    )

    form_widget_args = dict(
        email=dict(type="email"),
        username=dict(autocomplete="off"),
        password=dict(
            autocomplete="new-password",
            placeholder='Enter new password'
        ),
    )

    form_excluded_columns = ('queries',)


class AdminIndexView(admin.AdminIndexView):

    @admin.expose('/')
    def index(self):
        if not current_user.is_authenticated:
            return redirect(url_for('.login'))
        return super(AdminIndexView, self).index()

    @admin.expose('/login', methods=['GET', 'POST'])
    def login(self):
        return redirect('/login')

    @admin.expose('/logout')
    @login_required
    def logout(self):
        security.logout_user(current_user)
        flash('Logged out successfully.')
        return redirect(url_for('.login'))
