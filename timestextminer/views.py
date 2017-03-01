from flask import request, flash, redirect, url_for
import flask_admin as admin
import flask_admin.contrib.sqla as admin_sqla
from flask_login import LoginManager, login_required, login_user, logout_user, current_user
from werkzeug.security import generate_password_hash

from . import forms
from . import sqla
from .corpora import corpora


class ModelView(admin_sqla.ModelView):
    
    def is_accessible(self):
        return current_user.is_authenticated and current_user.has_role('admin')
        
    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for('admin.index'))



class UserView(ModelView):
    
    @admin.expose('/create', methods=['GET', 'POST'])
    def create_view(self):
        rf = forms.RegistrationForm(request.form)
        if admin.helpers.validate_form_on_submit(rf):
            user = sqla.User()
            rf.populate_obj(user)
            user.password = generate_password_hash(rf.password.data)

            sqla.db.session.add(user)
            sqla.db.session.commit()
            
            flash('Successfully added user {}'.format(user.username))
            return redirect(url_for('users.index_view'))

        return self.render('admin/form.html', title='Register', form=rf)



class CorpusView(admin.BaseView):
    
    def __init__(self, corpus, **kwargs):
        self.corpus = corpus
        return super(CorpusView, self).__init__(**kwargs)
    
    def is_accessible(self):
        return current_user.is_authenticated and current_user.has_role(self.corpus)
        
    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for('admin.index'))

    @admin.expose('/', methods=['GET', 'POST'])
    @login_required
    def index(self):
        corpus = corpora.get(self.corpus)
        
        return self.render('app.html', 
            corpus=self.corpus,
            fields=[
                field 
                for field in corpus.fields
                    if not field.hidden
            ],
            autocomplete=[
                field.name + ':'
                for field in corpus.fields
                    if not field.hidden
            ]
        )



class AdminIndexView(admin.AdminIndexView):

    @admin.expose('/')
    def index(self):
        if not current_user.is_authenticated:
            return redirect(url_for('.login'))
        return super(AdminIndexView, self).index()



    @admin.expose('/login', methods=['GET', 'POST'])
    def login(self):

        lf = forms.LoginForm(request.form)
        
        if admin.helpers.validate_form_on_submit(lf):
            user = lf.user
            
            user.authenticated = True
            sqla.db.session.add(user)
            sqla.db.session.commit()
            login_user(user)
            
            return redirect(url_for('times.index'))
        
        return self.render('admin/form.html', title='Login', form=lf)



    @admin.expose('/logout')
    @login_required
    def logout(self):
        user = current_user
        user.authenticated = True
        sqla.db.session.add(user)
        sqla.db.session.commit()
        logout_user()
        flash('Logged out successfully.')
        return redirect(url_for('blueprint.init'))
