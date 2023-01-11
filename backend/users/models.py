from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings


class CustomUser(AbstractUser):
    saml = models.BooleanField(blank=True, null=True, default=False)
    download_limit = models.IntegerField(
        default=settings.DEFAULT_DOWNLOAD_LIMIT)

    # TODO fields from old backend
    # role_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=True)
    # role = db.relationship('Role',
    #                        primaryjoin=(role_id == Role.id),
    #                        backref=db.backref('users', lazy='dynamic'), lazy='joined',
    #                        )
    # authenticated = db.Column(db.Boolean)
    # active = db.Column(db.Boolean)
    # queries = db.relationship('Query',
    #                           backref=db.backref('user', lazy='joined'), lazy='dynamic')
    # downloads = db.relationship('Download', back_populates='user')
