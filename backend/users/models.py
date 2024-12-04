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

    def can_search(self, corpus: Corpus) -> bool:
        '''
        Whether the user is allowed to search the corpus
        '''

        if not corpus.active:
            return False

        # superusers do not need explicit group membership
        if self.is_superuser:
            return True

        return self.groups.filter(corpora=corpus).exists()

    def searchable_corpora(self):
        '''
        Queryset of corpora that the user is allowed to search
        '''

        if self.is_superuser:
            return Corpus.objects.filter(active=True)

        return Corpus.objects.filter(active=True, groups__user=self).distinct()


class AnoymousProfile(object):
    enable_search_history = False


class CustomAnonymousUser(django_auth_models.AnonymousUser):
    ''' extend AnonymousUser class with has_access method
        return True for any corpus assigned to the `basic` group
    '''
    profile = AnoymousProfile()

    def can_search(self, corpus: Corpus):
        if not corpus.active:
            return False

        Group = django_auth_models.Group
        return Group.objects.filter(name=PUBLIC_GROUP_NAME, corpora=corpus).exists()

    def searchable_corpora(self):
        return Corpus.objects.filter(active=True, groups__name=PUBLIC_GROUP_NAME)


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

