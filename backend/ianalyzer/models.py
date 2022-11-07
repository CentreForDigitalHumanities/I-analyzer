'''
Module contains the models for user management and query logging in SQL.
'''
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json


MAX_LENGTH_NAME = 126
MAX_LENGTH_PASSWORD = 254
MAX_LENGTH_EMAIL = 254
DOWNLOAD_LIMIT = 10000
MAX_LENGTH_DESCRIPTION = 254
MAX_LENGTH_CORPUS_NAME = 254
MAX_LENGTH_FILENAME = 254

db = SQLAlchemy()


'''
   connects corpus id to role id
'''
corpora_roles = db.Table(
    'corpora_roles',
    db.Column('role_id', db.Integer(), db.ForeignKey('role.id')),
    db.Column('corpus_id', db.Integer(), db.ForeignKey('corpus.id'))
)


class Role(db.Model):
    '''
    Determines user privileges.
    '''

    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(MAX_LENGTH_NAME), unique=True)
    description = db.Column(db.String(MAX_LENGTH_DESCRIPTION))

    corpora = db.relationship('Corpus',
                              secondary=corpora_roles,
                              backref=db.backref('assigned_to', lazy='dynamic'), lazy='joined'
                              )
    '''
    Which corpora belong to a user role.
    '''

    def __init__(self, name="", description=""):
        self.name = name
        self.description = description

    def __hash__(self):
        return hash(self.name)

    def __repr__(self):
        return self.name


class User(db.Model):

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(MAX_LENGTH_NAME), unique=True)
    password = db.Column(db.String(MAX_LENGTH_PASSWORD))
    email = db.Column(db.String(MAX_LENGTH_EMAIL), nullable=True)
    saml = db.Column(db.Boolean, nullable=True, default=False)

    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=True)
    '''
    To assign a role id to a user
    '''

    active = db.Column(db.Boolean)
    '''
    Whether the user's account is active (validated, approved).
    '''

    authenticated = db.Column(db.Boolean)
    '''
    Whether the user has provided the correct credentials.
    '''

    download_limit = db.Column(db.Integer, default=DOWNLOAD_LIMIT)
    '''
    How high the download limit for the user is.
    '''

    role = db.relationship('Role',
                           primaryjoin=(role_id == Role.id),
                           backref=db.backref('users', lazy='dynamic'), lazy='joined',
                           )
    '''
    Which privileges the user has.
    '''

    queries = db.relationship('Query',
                              backref=db.backref('user', lazy='joined'), lazy='dynamic')
    '''
    Which queries the user has performed.
    '''

    def __init__(self, username=None, password=None, email=None, active=True, authenticated=False, download_limit=DOWNLOAD_LIMIT, role_id=None, saml=False):
        self.username = username
        self.password = password
        self.email = email
        self.active = active
        self.authenticated = authenticated
        self.download_limit = download_limit
        self.role_id=role_id
        self.saml=saml

    def __repr__(self):
        return self.username

    @property
    def is_authenticated(self):
        '''
        This property should return True if the user is authenticated, i.e.
        they have provided valid credentials.
        '''

        return self.authenticated

    @property
    def is_active(self):
        '''
        This property should return True if this is an active user - in
        addition to being authenticated, they also have activated their
        account, not been suspended, or any condition your application has for
        rejecting an account. Inactive accounts may not log in.
        '''

        return self.active

    @property
    def is_anonymous(self):
        '''
        This property should return True if this is an anonymous user.
        '''
        return False

    def get_id(self):
        '''
        This method must return a unicode that uniquely identifies this user,
        and can be used to load the user from the user_loader callback.
        '''

        return str(self.id)

    def has_access(self, corpus_name):
        for c in self.role.corpora:
            if c.name == corpus_name:
                return True
        return False

    def has_role(self, role):
        return self.role.name == role




class Query(db.Model):
    '''
    '''

    id = db.Column(db.Integer, primary_key=True)

    query_json = db.Column('query', db.Text)
    '''
    JSON string representing this query.
    '''

    corpus_name = db.Column(db.String(MAX_LENGTH_CORPUS_NAME))
    '''
    Name of the corpus for which the query was performed.
    '''

    started = db.Column(db.DateTime)
    '''
    Time the first document was sent.
    '''

    completed = db.Column(db.DateTime, nullable=True)
    '''
    Time the last document was sent, if not aborted.
    '''

    aborted = db.Column(db.Boolean)
    '''
    Whether the download was prematurely ended.
    '''

    userID = db.Column(db.Integer, db.ForeignKey('user.id'))
    '''
    User that performed this query.
    '''

    transferred = db.Column(db.BigInteger)
    '''
    Number of transferred (e.g. actually downloaded) documents. Note that this
    does not say anything about the size of those documents.
    '''

    total_results = db.Column(db.BigInteger, nullable=True, default=None)
    '''
    Number of total results available for a given query.
    '''



    def __init__(self, query, corpus_name, user):
        self.corpus_name = corpus_name
        self.query_json = query
        self.user = user
        self.started = datetime.now()
        self.completed = None
        self.aborted = False
        self.transferred = 0

    def __repr__(self):
        return '<Query #{}>'.format(self.id)


class Corpus(db.Model):
    '''
    The corpora that are attached to a role
    '''

    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(MAX_LENGTH_NAME), unique=True)
    description = db.Column(db.String(MAX_LENGTH_DESCRIPTION))

    def __init__(self, name="", description=""):
        self.name = name
        self.description = description

    def __hash__(self):
        return hash(self.name)

    def __repr__(self):
        return self.name


class Visualization(db.Model):
    '''
    Cached results for a visualisation
    '''

    id = db.Column(db.Integer(), primary_key=True)
    corpus_name = db.Column(db.String(MAX_LENGTH_NAME), unique=True)
    visualization_type = db.Column(db.String(MAX_LENGTH_NAME))
    parameters = db.Column(db.Text())
    started = db.Column(db.DateTime)
    completed = db.Column(db.DateTime)
    result = db.Column(db.JSON())

    def __init__(self, visualization_type, corpus_name, parameters):
        self.visualization_type = visualization_type
        self.corpus_name = corpus_name
        self.parameters = parameters
        self.started = datetime.now()
        self.completed = None
        self.result = None

    def __repr__(self):
        return f'Visualisation #{self.id}: {self.visualization_type} of {self.corpus_name} corpus made at {self.started}'

    @property
    def is_done(self):
        return self.completed != None

class Download(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    started = db.Column(db.DateTime())
    completed = db.Column(db.DateTime())
    download_type = db.Column(db.String(MAX_LENGTH_NAME))
    corpus_name = db.Column(db.String(MAX_LENGTH_CORPUS_NAME))
    user_id = db.Column(db.Integer(), db.ForeignKey('user.id'))
    parameters = db.Column(db.Text())
    filename = db.Column(db.String(MAX_LENGTH_FILENAME))

    def __init__(self, download_type, corpus_name, parameters, user):
        self.download_type = download_type
        self.corpus_name = corpus_name
        self.parameters = parameters
        self.user = user
        self.started = datetime.now()

    def __repr__(self):
        return f'Download #{self.id}: {self.download_type} of {self.corpus_name} corpus made at {self.started}'

    @property
    def is_done(self):
        return self.completed != None

    @property
    def status(self):
        if self.is_done and self.filename:
            return 'done'
        elif self.is_done:
            return 'error'
        else:
            return 'working'
