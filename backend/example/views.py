from rest_framework.decorators import api_view
from rest_framework.response import Response

# This a very basic View that servers as an example.
# Note that, when utilizing models and a database, etc, you would not have
# views like this, but rather Viewsets. See the Django Rest Framework (DRF) documentation.

@api_view()
def hooray(request):
    response = [{ 'message': 'https://media.giphy.com/media/yoJC2GnSClbPOkV0eA/source.gif' }]
    return Response(response)
