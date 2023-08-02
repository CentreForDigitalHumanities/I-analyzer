from django.urls import reverse
from urllib.parse import urlencode

def media_url(corpus, image_path, **kwargs):
    get_media_url = reverse('get-media')
    query = urlencode({
        'corpus': corpus,
        'image_path': image_path,
        **kwargs,
    })

    return get_media_url + '?' + query
