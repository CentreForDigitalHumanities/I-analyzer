from django.conf import settings
from django.views.decorators.csrf import ensure_csrf_cookie

from revproxy.views import ProxyView
view = ProxyView.as_view(upstream=settings.PROXY_FRONTEND)

@ensure_csrf_cookie
def proxy_frontend(*args, **kwargs):
    """ Wrapper for calls to the SPA ensuring the precense of a CSRF cookie."""
    global view
    return view(*args, **kwargs)
