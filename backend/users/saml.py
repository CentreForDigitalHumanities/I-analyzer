from djangosaml2.backends import Saml2Backend

class CustomSaml2Backend(Saml2Backend):
    def get_or_create_user(self, *args, **kwargs):
        user, created = super().get_or_create_user(*args, **kwargs)
        user.saml = True
        return user, created
