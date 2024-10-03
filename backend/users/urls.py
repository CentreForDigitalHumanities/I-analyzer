from django.urls import include, path, re_path
from dj_rest_auth.registration.views import VerifyEmailView

from .views import KeyInfoView, redirect_confirm, redirect_reset, SamlLogoutView, ThrottledRegisterView

urlpatterns = [
    # registration
    path('registration/', ThrottledRegisterView.as_view(), name='rest_registration'),
    re_path(r'registration/account-confirm-email/(?P<key>.+)/',
            redirect_confirm, name='account_confirm_email'),
    path('registration/key-info/', KeyInfoView.as_view(), name='key-info'),
    path('account-confirm-email/', VerifyEmailView.as_view(),
         name='account_email_verification_sent'),
    # password reset
    path('password-reset/<uidb64>/<token>/',
         redirect_reset, name='password_reset_confirm'),
    # generic routes
    path('registration/', include('dj_rest_auth.registration.urls')),
    path('', include('dj_rest_auth.urls')),
    path('saml2/ls/post', SamlLogoutView.as_view()),
    path('saml2/', include('djangosaml2.urls')),
]
