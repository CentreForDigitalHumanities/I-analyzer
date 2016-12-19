from . import sqla
from wtforms import fields, validators, form
from werkzeug.security import check_password_hash

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
