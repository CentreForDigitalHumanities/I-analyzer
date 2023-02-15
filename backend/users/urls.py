from django.urls import include, path

urlpatterns = [
    path('', include('dj_rest_auth.urls')),
]
