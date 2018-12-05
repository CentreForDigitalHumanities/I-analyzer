from urllib.parse import urlparse, urlencode

from onelogin.saml2.auth import OneLogin_Saml2_Auth
from onelogin.saml2.utils import OneLogin_Saml2_Utils

from . import models


'''
Custom SAML class based on the one in the dhlab-saml repo (https://github.com/UUDigitalHumanitieslab/dhlab-saml)
'''
class DhlabFlaskSaml:
    settings_folder = None
    errors = None


    def init_app(self, app):
        '''
        Initialize Flask app with DhlabFlaskSaml instance

        Keyword arguments:
            app -- The Flask app
        '''
        self.settings_folder = app.config['SAML_PATH']


    def init_saml_auth(self, req):
        '''
        Initialize OneLogin's Auth class.
        '''
        auth = OneLogin_Saml2_Auth(req, custom_base_path=self.settings_folder)
        return auth


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
        self.errors = errors
        self.errors.append(last_error_reason)


    def init_login(self, request, redirect):
        '''
        Initialize a login procedure by redirecting the user to the identity provider (i.e. ITS)
        
        Keyword arguments:
            request       -- The Flask request object
            redirect      -- The Flask redirect method
        '''
        # PROD        
        # req = self.prepare_flask_request(request)
        # auth = self.init_saml_auth(req)        
        # return redirect(auth.login())

        # TEST
        return redirect(request.host_url + 'saml/process_login_result')


    def process_login_result(self, session, fail_safe):
        '''
        Process the request that the Identity Provider sends after the login procedure.
        This, in SAML terms, is the implementation of an 'assertionConsumerService' or 'acs'.

        Keyword arguments:
            session   -- The Flask session object
            fail_safe -- The partial (i.e. relative to website's root) url that the application should be 
                         redirected to if errors occur (e.g. 'saml/errors'). Do not include a slash at the start.
        '''

        # TEST       
        uuShortID = ['F103825']
        session['samlUserdata'] = { "uuShortID": uuShortID }

        # PROD code
        # req = self.prepare_flask_request(request)
        # auth = self.init_saml_auth(req)
        # auth.process_response()
        
        # errors = []
        # errors = auth.get_errors()

        # if len(errors) == 0:
        #     session['samlUserdata'] = auth.get_attributes()
        #     session['samlNameId'] = auth.get_nameid()
        #     session['samlSessionIndex'] = auth.get_session_index()
        #     self_url = OneLogin_Saml2_Utils.get_self_url(req)
        # else:
        #     self.process_errors(errors, auth.get_last_error_reason())
        #     return redirect(fail_safe)

    
    def init_logout(self, request, session, redirect):
        '''
        Initialize a logout procedure
        
        Keyword arguments:
            request  -- The Flask request object
            session  -- The Flask session object
            redirect -- The Flask redirect method
        '''
        req = self.prepare_flask_request(request)
        auth = self.init_saml_auth(req)        
        name_id = None
        session_index = None

        if 'samlNameId' in session:
            name_id = session['samlNameId']
        if 'samlSessionIndex' in session:
            session_index = session['samlSessionIndex']

        return redirect(auth.logout(name_id=name_id, session_index=session_index))


    def process_logout_result(self, request, session, redirect, fail_safe):
        '''
        Send a logout request to the Identity Provider.
        This, in SAML terms, is the implementation of an 'singleLogoutService' or 'sls'
        
        Keyword arguments:
            request   -- The Flask request object
            session   -- The Flask session object
            redirect  -- The Flask redirect method 
            fail_safe -- The partial (i.e. relative to website's root) url that the application should be 
                         redirected to if errors occur (e.g. 'saml/errors'). Do not include a slash at the start.
        '''
        req = self.prepare_flask_request(request)
        auth = self.init_saml_auth(req)
        errors = []

        dscb = lambda: session.clear()
        url = auth.process_slo(delete_session_cb=dscb)
        errors = auth.get_errors()
        if len(errors) == 0:
            if url is not None:            
                return redirect(url)
        else:
            self.process_errors(errors, auth.get_last_error_reason())
            
        return redirect(fail_safe)


    def metadata(self, request, make_response):
        '''
        Get the XML that contains the ServiceProvider's metadata 
        
        Keyword arguments:
            request       -- The Flask request object
            make_response -- The Flask make_response method
        '''
        req = self.prepare_flask_request(request)
        auth = self.init_saml_auth(req)
        settings = auth.get_settings()
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
        req = self.prepare_flask_request(request)
        auth = self.init_saml_auth(req)
        return auth.is_authenticated()


    def get_solis_id(self, request, session):
        '''
        Returns the user's Solis-ID (if user is still logged in)
        '''
        # TEST
        return session['samlUserdata']['uuShortID'][0]
        # PROD
        # if self.logged_in(request) and session['samlUserdata']['uuShortID']:
        #     return session['samlUserdata']['uuShortID'][0]


    def get_account_type(self, request, session):
        '''
        Returns the user's account type
        '''
        if self.logged_in(request) and session['samlUserdata']['uuType']:
            return session['samlUserdata']['uuType'][0]


    def get_errors(self):
        '''
        Get any errors that occured during the SAML procedure.
        '''
        return self.errors
