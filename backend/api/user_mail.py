import logging

from flask import current_app, render_template
from flask_mail import Message

from . import mail

logger = logging.getLogger(__name__)
logging.basicConfig(format='%(message)s')

def send_user_mail(email, username, subject_line, email_title, message, prompt, link_url, link_text, login=False):
    '''
    Send an email with a confirmation token to a new user
    Returns a boolean specifying whether the email was sent succesfully
    '''
    msg = Message(subject=subject_line,
                  sender=current_app.config['MAIL_FROM_ADRESS'], recipients=[email])
    msg.html = render_template('user_mail.html',
                               email_title=email_title,
                               username=username,
                               message=message,
                               prompt=prompt,
                               link_url=link_url,
                               link_text=link_text,
                               url_i_analyzer=current_app.config['BASE_URL'],
                               logo_link=current_app.config['LOGO_LINK'],
                               login=login)
    try:
        mail.send(msg)
        return True
    except Exception as e:
        logger.error("An error occured sending an email to {}:".format(email))
        logger.error(e)
        return False