'''
Present the data to the user through a web interface.
'''
from distutils.log import error
import logging

from amqp import error_for_code
logger = logging.getLogger(__name__)
import json
import base64
import math
import functools
import os

from os.path import split, join, isfile, getsize
import sys
import tempfile
from datetime import datetime, timedelta
from celery import chain
from werkzeug.security import generate_password_hash
from flask import Flask, Blueprint, Response, request, abort, current_app, \
    render_template, url_for, jsonify, redirect, flash, send_file, stream_with_context, send_from_directory, session, make_response
import flask_admin as admin
from flask_login import LoginManager, login_required, login_user, \
    logout_user, current_user
from flask_mail import Message

from ianalyzer import models, celery_app
from es import download, search
from addcorpus.load_corpus import corpus_dir, load_all_corpora, load_corpus
import wordmodels.visualisations as wordmodel_visualisations


from api.user_mail import send_user_mail
from . import security
from . import analyze
from . import tasks
from . import api
from . import convert_csv


@api.route('/ensure_csrf', methods=['GET'])
def ensure_csrf():
    return jsonify({'success': True})


# endpoint for registration new user via signup form
@api.route('/register', methods=['POST'])
def api_register():
    if not request.json:
        abort(400)

    # Validate user's input
    username = request.json['username']
    email = request.json['email']
    is_valid_username = security.is_unique_username(username)
    is_valid_email = security.is_unique_non_solis_email(email)

    if not is_valid_username or not is_valid_email:
        return jsonify({
            'success': False,
            'is_valid_username': is_valid_username,
            'is_valid_email': is_valid_email
        })
    token = security.get_token(username)
    # try sending the email
    if not send_user_mail(
        email=email,
        username=username,
        subject_line="Thank you for signing up at I-analyzer",
        email_title="User registration",
        message="Thank you for creating an I-analyzer account.",
        prompt="Please click the link below to confirm " + \
        "your email address and finish your registration.",
        link_url=current_app.config['BASE_URL']+'/api/registration_confirmation/'+token,
        link_text="Confirm registration",
        login=True
    ):
        return jsonify({
            'success': False,
            'is_valid_username': True,
            'is_valid_email': True
        })

    # if email was succesfully sent, add user to db
    add_basic_user(username, request.json['password'], email, False)

    return jsonify({'success': True})

# endpoint for the confirmation of user if link in email is clicked.
@api.route('/registration_confirmation/<token>', methods=['GET'])
def api_register_confirmation(token):

    expiration = 60*60*72  # method does not return email after this limit
    username = security.get_original_token_input(token, expiration)

    if not username:
        flash('The confirmation link is invalid or has expired.', 'danger')
        abort(403)

    user = models.User.query.filter_by(username=username).first_or_404()
    user.active = True
    models.db.session.commit()

    return redirect(current_app.config['BASE_URL']+'/login?isActivated=true')

@api.route('/request_reset', methods=['POST'])
def api_request_reset():
    if not request.json:
        abort(400)
    email = request.json['email']
    users = models.User.query.filter_by(email=email).all()
    message = 'No registered user for this e-mail address.'
    if not users:
        return jsonify({
            'success': False,
            'message': message
        })
    user = next((user for user in users if user.saml==False), None)
    if not user:
        return jsonify({
            'success': False,
            'message': message + " Log in via your Solis-ID or make a new account."})
    token = security.get_token(user.username)
    if not send_user_mail(
        email=email,
        username=user.username,
        subject_line="Your password can be reset",
        email_title="Password reset",
        message="You requested a password reset.",
        prompt="Please click the link below to enter " + \
        "and confirm your new password.",
        link_url=current_app.config['BASE_URL']+'/reset-password/'+token,
        link_text="Reset password"
        ):
        return jsonify({'success': False, 'message': 'Email could not be sent.'})
    return jsonify({'success': True, 'message': 'An email was sent to your address.'})


@api.route('/reset_password', methods=['POST'])
def api_reset_password():
    if not request.json or not all(x in request.json for x in ['password', 'token']):
        return jsonify({'success': False, 'message': 'Errors during request'})
    expiration = 60*60  # method does not return username after an hour
    username = security.get_original_token_input(request.json['token'], expiration)
    if not username:
        return jsonify({'success': False, 'message': 'Your token is not valid or has expired.'})
    user = models.User.query.filter_by(username=username).first_or_404()
    if not user:
        return jsonify({'success': False, 'message': 'User doesn\'t exist.'})
    user = models.User.query.filter_by(username=username).first_or_404()
    security.login_user(user)
    password = request.json['password']
    user.password = generate_password_hash(password)
    models.db.session.commit()
    return jsonify({'success': True, 'username': username})

@api.route('/corpusdocument/<corpus>/<document_name>', methods=['GET'])
@login_required
def api_corpus_document(corpus, document_name):
    '''
    Return a document for a corpus.
    '''
    return send_from_directory(corpus_dir(corpus), 'documents/{}'.format(document_name))


@api.route('/login', methods=['POST'])
def api_login():
    if not request.json:
        abort(400)
    username = request.json['username']
    password = request.json['password']
    user = security.validate_user(username, password)

    if user is None:
        response = jsonify({'success': False})
    else:
        security.login_user(user)
        response = create_success_response(user)

    return response


def add_basic_user(username, password, email, is_active):
    ''' Add a user with the role 'basic' to the database '''

    basic_role = models.Role.query.filter_by(name='basic').first()
    pw_hash = None
    if (password):
        pw_hash = generate_password_hash(password)
    new_user = models.User(
        username=username,
        email=email,
        active=is_active,
        password=pw_hash,
        role_id=basic_role.id,
    )
    models.db.session.add(new_user)
    models.db.session.commit()
    return new_user


def create_success_response(user):
    corpora = [{
        'name': corpus.name,
        'description': corpus.description
    } for corpus in user.role.corpora]
    role = {
        'name': user.role.name,
        'description': user.role.description,
        'corpora': corpora
    }
    response = jsonify({
        'success': True,
        'id': user.id,
        'username': user.username,
        'role': role,
        'downloadLimit': user.download_limit
    })

    return response

@api.route('/log', methods=['POST'])
@login_required
def api_log():
    if not request.json:
        abort(400)
    msg_type = request.json['type']
    msg = request.json['msg']

    if msg_type == 'info':
        current_app.logger.info(msg)
    else:
        current_app.logger.error(msg)

    return jsonify({'success': True})


@api.route('/logout', methods=['POST'])
def api_logout():
    if current_user.is_authenticated:
        logout_user()
    return jsonify({'success': True})


@api.route('/check_session', methods=['POST'])
def api_check_session():
    """
    Check that the specified user is still logged on.
    """
    if not request.json:
        abort(400)
    username = request.json['username']

    if not current_user.is_authenticated or current_user.username != username:
        abort(401)
    else:
        return jsonify({'success': True})

