from urllib.parse import urlparse, urlencode

from onelogin.saml2.auth import OneLogin_Saml2_Auth
from onelogin.saml2.utils import OneLogin_Saml2_Utils

import logging
logger = logging.getLogger(__name__)

'''
Custom exception that will be thrown by the DhlabFlaskSaml class if an error occurs
'''
class SamlAuthError(RuntimeError):
    errors = None
    last_error_reason = None

    def __init__(self, errors, last_error_reason):
        message = '{0}: {1}'.format(errors, last_error_reason)
        super().__init__(message)

        self.last_error_reason = last_error_reason
        self.errors = errors


'''
Custom SAML class based on the 'dhlab_flask_saml' example in the dhlab-saml repo (https://github.com/UUDigitalHumanitieslab/dhlab-saml)
'''
class SamlAuth:
    settings_folder = None
    saml_auth = None
    solis_id_key = None
    mail_key = None

    def init_app(self, app):
        '''
        Initialize Flask app with DhlabFlaskSaml instance

        Keyword arguments:
            app -- The Flask app
        '''
        self.settings_folder = app.config['SAML_FOLDER']
        self.solis_id_key = app.config['SAML_SOLISID_KEY']
        self.mail_key = app.config['SAML_MAIL_KEY']


    def init_saml_auth(self, req):
        '''
        Initialize OneLogin's Auth class.
        '''
        self.saml_auth = OneLogin_Saml2_Auth(req, custom_base_path=self.settings_folder)


    def prepare_flask_request(self, request):
        '''
        Preprocess the Flask request
        '''
        # If server is behind proxys or balancers use the HTTP_X_FORWARDED fields
        url_data = urlparse(request.url)
        return {
            "https": 'on' if request.scheme == 'https' else 'off',
            "http_host": request.host,
            "server_port": url_data.port,
            "script_name": request.path,
            "get_data": request.args.copy(),
            "post_data": request.form.copy(),
            "query_string": request.query_string
        }


    def process_errors(self, errors, last_error_reason):
        '''
        Process errors encounter during SAML procedure.

        Keyword arguments:
            errors            -- Array of strings
            last_error_reason -- The reason for the last error. Note that extra info is accessed through:
                                 'auth.get_last_error_reason()' (where auth is an instance of OneLogin_Saml2_Auth)
        '''
        raise SamlAuthError(errors, last_error_reason)


    def init_login(self, request, redirect):
        '''
        Initialize a login procedure by redirecting the user to the identity provider (i.e. ITS)

        Keyword arguments:
            request       -- The Flask request object
            redirect      -- The Flask redirect method
        '''
        req = self.prepare_flask_request(request)
        self.init_saml_auth(req)
        return redirect(self.saml_auth.login())


    def process_login_result(self, request, session):
        '''
        Process the request that the Identity Provider sends after the login procedure.
        This, in SAML terms, is the implementation of an 'assertionConsumerService' or 'acs'.

        Keyword arguments:
            request   -- The Flask request object
            session   -- The Flask session object
        '''
        req = self.prepare_flask_request(request)
        self.init_saml_auth(req)
        self.saml_auth.process_response()

        errors = []
        errors = self.saml_auth.get_errors()

        if len(errors) == 0:
            session['samlUserdata'] = self.saml_auth.get_attributes()
            session['samlNameId'] = self.saml_auth.get_nameid()
            session['samlSessionIndex'] = self.saml_auth.get_session_index()
            self_url = OneLogin_Saml2_Utils.get_self_url(req)
        else:
            self.process_errors(errors, self.saml_auth.get_last_error_reason())


    def init_logout(self, request, session, redirect):
        '''
        Initialize a logout procedure

        Keyword arguments:
            request  -- The Flask request object
            session  -- The Flask session object
            redirect -- The Flask redirect method
        '''
        req = self.prepare_flask_request(request)
        self.init_saml_auth(req)
        name_id = None
        session_index = None

        if 'samlNameId' in session:
            name_id = session['samlNameId']
        if 'samlSessionIndex' in session:
            session_index = session['samlSessionIndex']
        return_url = '{}/saml/logout'.format(request.host_url)
        return redirect(self.saml_auth.logout(name_id=name_id, session_index=session_index, return_to=return_url))


    def process_logout_result(self, request, session):
        '''
        Process logout results from the Identity Provider.
        This, in SAML terms, is the implementation of an 'singleLogoutService' or 'sls'

        Keyword arguments:
            request   -- The Flask request object
            session   -- The Flask session object
        '''
        req = self.prepare_flask_request(request)
        self.init_saml_auth(req)
        errors = []
        logger.info(req)
        dscb = lambda: session.clear()
        url = self.saml_auth.process_slo(delete_session_cb=dscb)
        logger.info(url)
        errors = self.saml_auth.get_errors()
        if len(errors) > 0:
            logger.info(errors)
            self.process_errors(errors, self.saml_auth.get_last_error_reason())


    def metadata(self, request, make_response):
        '''
        Get the XML that contains the ServiceProvider's metadata

        Keyword arguments:
            request       -- The Flask request object
            make_response -- The Flask make_response method
        '''
        req = self.prepare_flask_request(request)
        self.init_saml_auth(req)
        settings = self.saml_auth.get_settings()
        metadata = settings.get_sp_metadata()
        errors = settings.validate_metadata(metadata)

        if len(errors) == 0:
            resp = make_response(metadata, 200)
            resp.headers['Content-Type'] = 'text/xml'
        else:
            resp = make_response(', '.join(errors), 500)
        return resp


    def logged_in(self, request):
        '''
        Check if the user is still logged in.
        '''
        if (self.saml_auth is None):
            req = self.prepare_flask_request(request)
            self.init_saml_auth(req)

        return self.saml_auth.is_authenticated()


    def get_solis_id(self, request, session):
        '''
        Returns the user's Solis-ID (if user is still logged in)
        '''
        return self.get_attribute(request, session, self.solis_id_key)


    def get_email_address(self, request, session):
        '''
        Returns the user's email address (if user is still logged in)
        '''
        return self.get_attribute(request, session, self.mail_key)


    def get_attribute(self, request, session, key):
        '''
        Returns the specified attribute (i.e. data received from IdP)
        '''
        if self.logged_in(request) and key in session['samlUserdata']:
            return session['samlUserdata'][key][0]
