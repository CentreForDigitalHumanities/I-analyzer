'''
Module contains WTForms to be presented to the user.

Model creation and editing forms are not defined here, but taken from the
flask_admin module.

TODO: Note that not all forms are WTForms; in particular, the search form is
implemented ad-hoc in the Jinja2 template. 
'''

import logging; logger = logging.getLogger(__name__)
from . import sqla
from wtforms import fields, validators, form, TextField
from wtforms.widgets import PasswordInput
from werkzeug.security import check_password_hash, generate_password_hash


class PasswordField(TextField):
    
    widget = PasswordInput(hide_value=True)
    
    def process_data(self, value):
        '''
        Called during form construction using kwargs or obj.
        '''
        self.data = '' # prevent double hashing
        self.original_password_hash = value



    def process_formdata(self, values):
        '''
        Called during form construction using POSTed form data.
        '''
        try:
            value = values[0]
        except IndexError:
            value = ''

        if value:
            self.data = generate_password_hash(value)
        else:
            self.data = self.original_password_hash



class RegistrationForm(form.Form):
    username = fields.StringField(validators=[validators.required()])
    password = fields.PasswordField(validators=[validators.required()])

    def validate(self):
        rv = super().validate()
        if not rv:
            return False

        if sqla.User.query.filter_by(username=self.username.data).count() > 0:
            self.username.errors.append('Username already exists')
            return False

        return True



class LoginForm(form.Form):
    username = fields.StringField('Username', validators=[validators.required()])
    password = fields.PasswordField('Password', validators=[validators.required()])

    def validate(self):
        rv = super().validate()
        if not rv:
            return False

        user = sqla.User.query.filter_by(username=self.username.data).first()
        
        if user is None:
            self.username.errors.append('Unknown username')
            return False

        if not check_password_hash(user.password, self.password.data):
            self.password.errors.append('Invalid password')
            return False

        self.user = user
        return True
