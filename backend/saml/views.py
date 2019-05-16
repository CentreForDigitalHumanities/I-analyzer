""" 
This module regulates authentication via SAML.
It defines its own blueprint, saml, but also uses the api blueprint.
This to ensure that some methods will send a CSRF tokens.
The 'saml' route is CSRF exempt.
"""

from flask import Flask, Blueprint, request,  jsonify, redirect, session, make_response
from flask_login import current_user
import logging
logger = logging.getLogger(__name__)

from ianalyzer.models import User, db
from api.security import login_user, get_token, get_original_token_input, logout_user
from api import api
from api.views import create_success_response
from .saml_auth import SamlAuth, SamlAuthError
from . import saml

saml_auth = SamlAuth()

@api.route('/init_solislogin/', methods=['GET'])
def init_solislogin():
    ''' SAML login step 1. The starting point for logging in with SolisId. '''
    return saml_auth.init_login(request, redirect)


@api.route('/solislogin', methods=['GET'])
def solislogin():
    ''' SAML login step 3. Called by frontend to retrieve user instance '''
    solis_id = get_original_token_input(session['solislogin_token'], 30)

    user = User.query.filter_by(username=solis_id).first()    

    # if someone attempts to login with 'solislogin=true' in the url user shall be None
    if user is None:
        return jsonify({'success': False})

    login_user(user)
    return create_success_response(user)

@api.route('/init_solislogout/', methods=['GET'])
def init_logout():
    '''
    SAML logout step 1. Redirect to ITS to perform logout.
    '''
    return saml_auth.init_logout(request, session, redirect)


@saml.route('/process_login_result', methods=['POST'])
def process_login_result():
    ''' SAML login step 2. Will be called by Identity Provider (ITS)'''
    try:
        saml_auth.process_login_result(request, session)
    except SamlAuthError as e:
        logger.error(e)
        redirect_to = 'login?hasError=true'
        return redirect(redirect_to)

    solis_id = saml_auth.get_solis_id(request, session)
    email = saml_auth.get_email_address(request, session)

    user = User.query.filter_by(username=solis_id).first()
    if user is None:
        user = add_uu_user(solis_id, None, email, True)

    session['solislogin_token'] = get_token(solis_id)

    redirect_to = 'login?solislogin=true'
    return redirect(redirect_to)


@saml.route('/process_logout_result', methods=['GET']) #TODO local: SAMLing requires POST
def process_logout_result():
    '''
    SAML logout step 2. This will be called by the Identity Provider (ITS) after a logout request.
    Strictly speaking, this could also be called by the IdP when the user logs out ot elsewhere (i.e. not our application),
    but support for this is currently not implemented.
    '''
    try:
        saml_auth.process_logout_result(request, session) #TODO local: SAMLing doesn't work with this
        if current_user.is_authenticated:
            logout_user(current_user)
    except SamlAuthError as e:
        # user is already logged out from I-analyzer, so no further action
        logger.error(e)
    return redirect('')


@saml.route('/metadata/', methods=['GET'])
def metadata():
    '''
    Pass the SAML metadata
    '''
    return saml_auth.metadata(request, make_response)


def add_uu_user(username, password, email, is_active):
    ''' Add a user with the role 'uu' to the database
    Solis-id users get this role by default
    '''  
    uu_role = models.Role.query.filter_by(name='uu').first()  
    pw_hash = None
    if (password):
        pw_hash = generate_password_hash(password)    
    new_user = models.User(
        username=username,
        email=email,
        active=is_active,
        password=pw_hash,
        role_id=uu_role.id,
    )
    models.db.session.add(new_user)
    models.db.session.commit()
    return new_user