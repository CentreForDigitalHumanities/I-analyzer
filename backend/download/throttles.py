from rest_framework.exceptions import Throttled
from rest_framework.throttling import ScopedRateThrottle


class DownloadThrottle(ScopedRateThrottle):
    def get_ident(self, request):
        return 'globaluserident'

    def throttle_failure(self):
        raise Throttled(detail={
            "error": "Too many attempts. Please try again later."
        })


class DownloadThrottleMixin():
    """
    Mixin to apply throttling to views that require it.
    """
    throttle_scope = 'download'
    throttle_classes = [DownloadThrottle]
