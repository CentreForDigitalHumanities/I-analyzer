'''
Module contains the models for user management and query logging in SQL.
'''

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

roles_users = db.Table(
    'roles_users',
    db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
    db.Column('role_id', db.Integer(), db.ForeignKey('role.id'))
)

class User(db.Model):

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(127), unique=True)
    password = db.Column(db.String(256))
    email = db.Column(db.String(255), nullable=True)
    active = db.Column(db.Boolean)
    authenticated = db.Column(db.Boolean)
    download_limit = db.Column(db.Integer)
    roles = db.relationship('Role',
        secondary=roles_users,
        backref=db.backref('users', lazy='dynamic'), lazy='joined'
    )
    queries = db.relationship('Query',
        backref=db.backref('user', lazy='joined'), lazy='dynamic')


    def __init__(self, username=None, password=None, email=None, active=True, authenticated=False, download_limit=10000):
        self.username = username
        self.password = password
        self.email = email
        self.active = active
        self.authenticated = authenticated
        self.download_limit = download_limit
        

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


    def has_role(self, role):
        return bool([r for r in self.roles if r.name == role])



class Role(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))

    def __init__(self, name, description=""):
        self.name = name
        self.description = description

    def __hash__(self):
        return hash(self.name)

    def __repr__(self):
        return self.name



class Query(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    query = db.Column(db.Text)
    corpus = db.Column(db.String(255))
    started = db.Column(db.DateTime)
    completed = db.Column(db.DateTime)
    aborted = db.Column(db.Boolean)
    completed = db.Column(db.DateTime, nullable=True)
    userID = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    def __init__(self, query, corpus, user):
        self.corpus = corpus
        self.query = query
        self.user = user
        self.started = datetime.now()
        self.completed = None
        self.aborted = False

    def __repr__(self):
        return '<Query #{}>'.format( self.id )
