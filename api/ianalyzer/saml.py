from flask import Flask, Blueprint, request,  jsonify, redirect, session, make_response
from ianalyzer import config_fallback as config

from .models import User
from .security import login_user
from .web import blueprint, add_basic_user, create_success_response
from .dhlab_flask_saml import DhlabFlaskSaml

saml = DhlabFlaskSaml()


@blueprint.route('/api/init_solislogin', methods=['GET'])
def init_solislogin():
    ''' SAML login step 1. The starting point for logging in with SolisId. '''
    return saml.init_login(request, redirect)


@blueprint.route('/saml/process_login_result', methods=['POST']) 
def process_login_result():
    ''' SAML login step 2. Will be called by Identity Provider (ITS)'''    
    saml.process_login_result(request, session)
    solis_id = saml.get_solis_id(request, session)
    email = saml.get_email_address(request, session)

    user = User.query.filter_by(username=solis_id).first()
    if user is None:
        user = add_basic_user(solis_id, None, email, True)

    user.is_saml_login = True
    user.save()

    redirect_to = 'login?solisId={0}'.format(solis_id)
    return redirect(redirect_to)


@blueprint.route('/api/solislogin', methods=['GET'])
def solislogin():
    ''' SAML login step 3. Called by frontend to retrieve user instance '''
    solis_id = request.args.get('solisId')
    user = User.query.filter_by(username=solis_id, is_saml_login=True).first()
    
    # if someone attempts to login with solisid in url user shall be None
    if user is None:
        return jsonify({'success': False})

    login_user(user)
    return create_success_response(user)


@blueprint.route('/api/init_solislogout', methods=['GET'])
def init_logout():
    ''' 
    SAML logout step 1. Redirect to ITS to perform logout. 
    '''
    return saml.init_logout(request, session, redirect)    


@blueprint.route('/saml/process_logout_result', methods=['GET', 'POST']) #TODO local: SAMLing requires POST
def process_logout_result():
    ''' 
    SAML logout step 2. This will be called by the Identity Provider (ITS) after a logout request. 
    Strictly speaking, this could also be called by the IdP when the user logs out ot elsewhere (i.e. not our application),
    but support for this is currently not implemented.
    '''
    # all necessary actions performed in SAML logout step 1, simply go home.
    saml.process_logout_result(request, session) #TODO local: SAMLing doesn't work with this
    return redirect('')


@blueprint.route('/saml/metadata/', methods=['GET'])
def metadata():
    '''
    Pass the SAML metadata
    '''
    return saml.metadata(request, make_response)
