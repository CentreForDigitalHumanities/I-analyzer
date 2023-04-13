from djangosaml2.backends import Saml2Backend

class CustomSaml2Backend(Saml2Backend):
    def get_or_create_user(
        self,
        user_lookup_key: str,
        user_lookup_value,
        create_unknown_user: bool,
        idp_entityid: str,
        attributes: dict,
        attribute_mapping: dict,
        request,
    ):

        user, created = super().get_or_create_user(
            user_lookup_key,
            user_lookup_value,
            create_unknown_user,
            idp_entityid,
            attributes,
            attribute_mapping,
            request)

        user.saml = True

        return user, created
