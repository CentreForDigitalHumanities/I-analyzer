import django.contrib.auth.models as django_auth_models
from django.db import models
from addcorpus.models import Corpus

DEFAULT_DOWNLOAD_LIMIT = 10000
PUBLIC_GROUP_NAME = 'basic'

class CustomUser(django_auth_models.AbstractUser):
    saml = models.BooleanField(blank=True, null=True, default=False)
    download_limit = models.IntegerField(
        help_text='Maximum documents that this user can download per query',
        default=DEFAULT_DOWNLOAD_LIMIT)

    def searchable_corpora(self):
        '''
        Queryset of corpora that the user is allowed to search
        '''

        return Corpus.objects.filter(self.searchable_condition())


    def searchable_condition(self) -> models.Q:
        if self.is_superuser:
            return models.Q(active=True)
        else:
            return models.Q(active=True) & models.Q(groups__user=self)


class AnoymousProfile(object):
    enable_search_history = False


class CustomAnonymousUser(django_auth_models.AnonymousUser):
    ''' extend AnonymousUser class with has_access method
        return True for any corpus assigned to the `basic` group
    '''
    profile = AnoymousProfile()

    def searchable_corpora(self):
        return Corpus.objects.filter(self.searchable_condition())

    def searchable_condition(self):
        return models.Q(active=True) & models.Q(groups__name=PUBLIC_GROUP_NAME)


django_auth_models.AnonymousUser = CustomAnonymousUser


class UserProfile(models.Model):
    ''' User information that is not relevant to authentication.
    E.g. settings, preferences, optional personal information.
    '''

    user = models.OneToOneField(
        to=CustomUser,
        on_delete=models.CASCADE,
        related_name='profile',
    )

    enable_search_history = models.BooleanField(
        help_text='Whether to save the search history of this user',
        default=True,
    )

    def __str__(self):
        return f'Profile of {self.user.username}'

