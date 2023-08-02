from dj_rest_auth.serializers import UserDetailsSerializer
from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers
from django.db import transaction


class CustomUserDetailsSerializer(UserDetailsSerializer):
    is_admin = serializers.BooleanField(source='is_staff')

    class Meta(UserDetailsSerializer.Meta):
        fields = ('id', 'username', 'email', 'saml',
                  'download_limit', 'is_admin')


class CustomRegistrationSerializer(RegisterSerializer):
    saml = serializers.BooleanField(default=False)

    @transaction.atomic
    def save(self, request):
        user = super().save(request)
        user.saml = self.data.get('saml', False)
        user.save()
        return user
