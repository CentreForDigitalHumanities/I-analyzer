'''
Module contains WTForms to be presented to the user.
'''

import logging
logger = logging.getLogger(__name__)
from wtforms import TextField
from wtforms.widgets import PasswordInput
from werkzeug.security import check_password_hash, generate_password_hash

from ianalyzer import models
from api import security

class PasswordField(TextField):

    widget = PasswordInput(hide_value=True)

    def process_data(self, value):
        '''
        Called during form construction using kwargs or obj.
        '''
        self.data = ''  # prevent double hashing
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