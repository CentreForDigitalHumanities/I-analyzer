from django.urls import include, path, re_path
from .views import redirect_confirm, KeyInfoView
from dj_rest_auth.registration.views import VerifyEmailView


urlpatterns = [
    re_path(r'registration/account-confirm-email/(?P<key>.+)/',
            redirect_confirm, name='account_confirm_email'),
    path('registration/key-info/', KeyInfoView.as_view(), name='key-info'),
    path('account-confirm-email/', VerifyEmailView.as_view(),
         name='account_email_verification_sent'),
    path('', include('dj_rest_auth.urls')),
    path('registration/', include('dj_rest_auth.registration.urls')),

]
