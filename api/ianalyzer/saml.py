from flask import Flask, Blueprint, request,  jsonify, redirect, session, make_response
import logging
logger = logging.getLogger(__name__)

from ianalyzer import config_fallback as config
from .models import User, db
from .security import login_user, get_token, get_original_token_input
from .web import blueprint, add_basic_user, create_success_response
from .saml_auth import SamlAuth, SamlAuthError

saml = SamlAuth()


@blueprint.route('/api/init_solislogin/', methods=['GET'])
def init_solislogin():
    ''' SAML login step 1. The starting point for logging in with SolisId. '''
    return saml.init_login(request, redirect)


@blueprint.route('/saml/process_login_result', methods=['POST'])
def process_login_result():
    ''' SAML login step 2. Will be called by Identity Provider (ITS)'''
    try:
        saml.process_login_result(request, session)
    except SamlAuthError as e:
        logger.error(e)
        redirect_to = 'login?hasError=true'
        return redirect(redirect_to)

    solis_id = saml.get_solis_id(request, session)
    email = saml.get_email_address(request, session)

    user = User.query.filter_by(username=solis_id).first()
    if user is None:
        user = add_basic_user(solis_id, None, email, True)

    session['solislogin_token'] = get_token(solis_id)

    user.is_saml_login = True
    db.session.add(user)
    db.session.commit()

    redirect_to = 'login?solislogin=true'
    return redirect(redirect_to)


@blueprint.route('/api/solislogin', methods=['GET'])
def solislogin():
    ''' SAML login step 3. Called by frontend to retrieve user instance '''
    solis_id = get_original_token_input(session['solislogin_token'], 30)

    user = User.query.filter_by(username=solis_id).first()    

    # if someone attempts to login with 'solislogin=true' in the url user shall be None
    if user is None:
        return jsonify({'success': False})

    login_user(user)
    return create_success_response(user)


@blueprint.route('/api/init_solislogout/', methods=['GET'])
def init_logout():
    '''
    SAML logout step 1. Redirect to ITS to perform logout.
    '''
    return saml.init_logout(request, session, redirect)


@blueprint.route('/saml/process_logout_result', methods=['GET']) #TODO local: SAMLing requires POST
def process_logout_result():
    '''
    SAML logout step 2. This will be called by the Identity Provider (ITS) after a logout request.
    Strictly speaking, this could also be called by the IdP when the user logs out ot elsewhere (i.e. not our application),
    but support for this is currently not implemented.
    '''
    try:
        saml.process_logout_result(request, session) #TODO local: SAMLing doesn't work with this
    except SamlAuthError as e:
        # user is already logged out from I-analyzer, so no further action
        logger.error(e)
    return redirect('')


@blueprint.route('/saml/metadata/', methods=['GET'])
def metadata():
    '''
    Pass the SAML metadata
    '''
    return saml.metadata(request, make_response)
