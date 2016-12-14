from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(127), unique=True)
    password = db.Column(db.String(256))
    email = db.Column(db.String(255), nullable=True)
    active = db.Column(db.Boolean)
    authenticated = db.Column(db.Boolean)
    download_limit = db.Column(db.Integer)
    privileges = db.Column(db.Integer)

    def __init__(self, username, password, email=None, active=True, authenticated=False, download_limit=10000, privileges=0):
        self.username = username
        self.password = password
        self.email = email
        self.active = active
        self.authenticated = authenticated
        self.download_limit = download_limit
        self.privileges = self.privileges
        

    def __repr__(self):
        return "<User #{}>".format( self.id )



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
