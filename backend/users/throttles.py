from rest_framework.throttling import ScopedRateThrottle

class RegistrationRateThrottle(ScopedRateThrottle):
    def get_ident(self, request):
        return 'globaluserident'
