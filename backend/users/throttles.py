from rest_framework.exceptions import Throttled
from rest_framework.throttling import ScopedRateThrottle


class PasswordResetRateThrottle(ScopedRateThrottle):
    def get_ident(self, request):
        return 'globaluserident'

    def throttle_failure(self):
        raise Throttled(detail={
            "error": "Too many attempts. Please try again later."
        })


class RegistrationRateThrottle(ScopedRateThrottle):
    def get_ident(self, request):
        return 'globaluserident'
