from django.http import Http404, HttpResponse
from django.contrib.staticfiles import finders
from django.views.decorators.csrf import ensure_csrf_cookie
import mimetypes

@ensure_csrf_cookie
def index(request):
    """ Thin wrapper for the static index.html that adds the CSRF cookie."""
    return HttpResponse(content=open(finders.find('index.html')))
