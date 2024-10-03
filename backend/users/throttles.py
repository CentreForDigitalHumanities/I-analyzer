from rest_framework.throttling import ScopedRateThrottle

class UserRateThrottle(ScopedRateThrottle):
    def get_ident(self, request):
        return 'globaluserident'
