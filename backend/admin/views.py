'''
Views.
'''

import logging
logger = logging.getLogger(__name__)
from flask import current_app, request, flash, redirect, url_for
import flask_admin as admin
import flask_admin.contrib.sqla as admin_sqla
from flask_login import LoginManager, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash
from wtforms.widgets import PasswordInput
from wtforms import ValidationError, TextField
from wtforms.validators import Required, AnyOf

from ianalyzer import models
from api import security
import corpora
from . import forms



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

class CorpusView(ModelView):
    can_create = False
    can_edit = True
    
    form_widget_args = dict(
        name=dict(readonly=True),
        description=dict(readonly=True)
    )

class RoleView(ModelView):
    # specifies the fields and order in the create- and edit view
    form_create_rules = (
        'name', 'description', 'corpora', 'users')
    form_edit_rules = (
        'name', 'description', 'corpora', 'users')
    
    def on_form_prefill(self, form, id):
        ''' Ensure the existence of roles with certain names '''
        if (form.data['name'] == 'basic' or form.data['name'] == 'admin' or form.data['name'] == 'uu'):
            form.name.render_kw = { 'readonly': True }


class UserView(ModelView):
    # specifies the columns and the order in users view
    column_list = ['username', 'role', 'email',
                   'active', 'authenticated', 'download_limit', 'saml']

    # specifies the fields and their order in create and edit views
    form_create_rules = (
        'username', 'password', 'role', 'email', 'active', 'authenticated', 'download_limit', 'saml')
    form_edit_rules = (
        'username', 'password', 'role', 'email', 'active', 'authenticated', 'download_limit', 'saml')

    form_overrides = dict(
        password=forms.PasswordField,
        queries=None,
    )

    form_args = dict(
        username=dict(validators=[Required()]),
        password=dict(validators=[Required()]),
        email=dict(validators=[Required()])
    )

    form_widget_args = dict(
        email=dict(type="email"),
        username=dict(autocomplete="off"),
        password=dict(
            autocomplete="new-password",
            placeholder='Enter new password'
        ),
    )

    form_excluded_columns = ('queries')


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
