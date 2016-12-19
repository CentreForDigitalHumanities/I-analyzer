'''
Present the data to the user through a web interface.
'''

import logging; logger = logging.getLogger(__name__)

from . import config
from . import search
from . import output
from . import factories
from . import sqla
from .corpora import corpora

from datetime import datetime, timedelta

from wtforms import fields, validators, form
from flask import Flask, Blueprint, Response, request, abort, current_app, \
    render_template, url_for, stream_with_context, jsonify, redirect, flash

import flask_admin as admin
import flask_admin.contrib.sqla as admin_sqla
from flask_login import LoginManager, login_required, login_user, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash



class ModelView(admin_sqla.ModelView):
    can_create = False # TODO: Modify the creation form so that it is the same as the registration form
    
    def is_accessible(self):
        return current_user.is_authenticated and current_user.privilege('admin')
        
    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for('admin.login'))



class RegisterView(admin.BaseView):
    def is_accessible(self):
        return current_user.is_authenticated and current_user.privilege('admin')
        
    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for('admin.login'))

    @admin.expose('/', methods=['GET', 'POST'])
    def index(self):
        rf = RegistrationForm(request.form)
        if admin.helpers.validate_form_on_submit(rf):
            user = sqla.User()
            rf.populate_obj(user)
            user.password = generate_password_hash(rf.password.data)

            sqla.db.session.add(user)
            sqla.db.session.commit()
            
            flash('Successfully added user {}'.format(user.username))
            return redirect(url_for('.index'))

        return self.render('admin/form.html', title='Register', form=rf)



class AdminIndexView(admin.AdminIndexView):

    @admin.expose('/')
    def index(self):
        if not current_user.is_authenticated:
            return redirect(url_for('.login'))
        return super(AdminIndexView, self).index()

    @admin.expose('/login', methods=['GET', 'POST'])
    def login(self):

        lf = LoginForm(request.form)
        
        if admin.helpers.validate_form_on_submit(lf):
            user = lf.user
            
            user.authenticated = True
            sqla.db.session.add(user)
            sqla.db.session.commit()
            login_user(user)
            
            return redirect(url_for('blueprint.front', corpusname='times'))
        
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



blueprint = Blueprint('blueprint', __name__)
admin_instance = admin.Admin(name='textmining', index_view=AdminIndexView(), endpoint='admin')
admin_instance.add_view(RegisterView(name='Register', endpoint='register'))
admin_instance.add_view(ModelView(sqla.User, sqla.db.session, name='Users', endpoint='users'))
login_manager = LoginManager()



###############################################################################

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


###############################################################################


@login_manager.user_loader
def load_user(user_id):
    return sqla.User.query.get(user_id)



@blueprint.route('/', methods=['GET'])
def init():
    if current_user and current_user.is_authenticated:
        return redirect(url_for('blueprint.front', corpusname='times'))
    else:
        return redirect(url_for('admin.login'))



def collect_params(corpus):
    '''
    Collect relevant parameters from POST request data and return them as a
    dictionary.
    
    TODO: Can we do this in WTForms?
    '''
    
    query_string = request.form.get('query')

    # Collect names of fields that are activated.
    fields = [
        field.name for field in corpus.fields
        if ('field:' + field.name) in request.form
    ]
    if not fields:
        raise RuntimeError('No recognised fields were selected.')

    # Collect active filters from form data; each filter's arguments get
    # prefixed by filter:<fieldname>
    filters = []

    for field in (f for f in corpus.fields if f.filter_):
        prefix = 'filter:' + field.name
        
        enabled = request.form.get(prefix+'?')
        narg = request.form.get(prefix)
        kwargs = {
            key[(len(prefix)+1):] : value
            for key,value in request.form.items()
            if key.startswith(prefix + ':')
        }
        
        if enabled and (narg or kwargs):
            filters.append(
                field.filter_.es(narg, **kwargs)
            )

    return {
        'fields' : fields,
        'query_string' : query_string,
        'filters' : filters,
    }



@blueprint.route('/<corpusname>', methods=['GET'])
@login_required
def front(corpusname):
    
    corpus = corpora.get(corpusname)
    if not corpus:
        abort(404)
    
    return render_template('app.html', corpus=corpusname,
        fields=[
            field for field in corpus.fields
            if not field.hidden
        ],
        autocomplete=[
            field.name + ':' for field in corpus.fields
            if not field.hidden and not field.mapping
        ]
    )


@blueprint.route('/<corpusname>/stream.csv', methods=['POST'])
@login_required
def search_csv(corpusname):
    '''
    Stream all results of a search to a CSV file.
    '''
    
    #TODO: save query and expected size to db

    corpus = corpora.get(corpusname)
    if not corpus:
        abort(404)

    parameters = collect_params(corpus)
    query = search.make_query(**parameters)
    

    # Perform the search and obtain output
    logging.info('Requested CSV for query: {}'.format(query))
    docs = search.execute_iterate(corpus, query)

    # Stream results
    result = output.as_csv_stream(docs, select=parameters['fields'])
    stream = stream_with_context(result)
    response = Response(stream, mimetype='text/csv')
    response.headers['Content-Disposition'] = (
        'attachment; filename={}-{}.csv'.format(
            corpusname, datetime.now().strftime('%Y%m%d-%H%M')
        )
    )
    return response



@blueprint.route('/<corpusname>/search.json', methods=['POST'])
@login_required
def search_json(corpusname):
    '''
    Return the first `n` results of a search as a JSON file that also includes
    statistics about the search. To act as example search.
    '''

    corpus = corpora.get(corpusname)
    if not corpus:
        abort(404)

    parameters = collect_params(corpus)
    query = search.make_query(**parameters)
    
    logging.info('Requested example JSON for query: {}'.format(query))

    # Perform the search
    result = search.execute(corpus, query)
    
    hits = result.get('hits', {})

    docs = ( dict(doc.get('_source'), id=doc.get('_id')) for doc in hits.get('hits', {}) )

    return jsonify({
        'total': hits.get('total', 0),
        'table': output.as_list(docs, select=parameters['fields'])
    })
