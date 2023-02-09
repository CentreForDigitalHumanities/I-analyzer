from dj_rest_auth.serializers import UserDetailsSerializer
from rest_framework import serializers


class CustomUserDetailsSerializer(UserDetailsSerializer):
    corpora = serializers.SerializerMethodField()
    is_admin = serializers.BooleanField(source='is_superuser')

    class Meta(UserDetailsSerializer.Meta):
        fields = ('id', 'username', 'email', 'saml',
                  'download_limit', 'corpora', 'is_admin')

    def get_corpora(self, obj):
        return obj.accessible_corpora
