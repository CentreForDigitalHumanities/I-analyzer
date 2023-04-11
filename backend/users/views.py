from allauth.account.models import EmailConfirmationHMAC
from django.http import HttpResponseRedirect
from rest_framework.exceptions import APIException
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.status import HTTP_404_NOT_FOUND
from rest_framework.views import APIView


def redirect_confirm(request, key):
    '''Redirects email-confirmation to the frontend'''
    return HttpResponseRedirect('/confirm-email/{}/'.format(key))


def redirect_reset(request, uidb64, token):
    '''Redirects password reset to the frontend'''
    return HttpResponseRedirect('/reset-password/{}/{}/'.format(uidb64, token))


class KeyInfoView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        '''Returns username and email for confirm key
        These are used to inform the user of their confirmation action
        Raises if key not valid'''
        try:
            key = request.data.get('key')
            info = EmailConfirmationHMAC.from_key(key)
            if not info:
                return Response('Confirmation key does not exist.',
                                status=HTTP_404_NOT_FOUND)
            return Response({'username': info.email_address.user.username,
                            'email': info.email_address.email})
        except Exception as e:
            raise APIException(e)
