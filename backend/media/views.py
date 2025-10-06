import logging
import os

from addcorpus.python_corpora.load_corpus import load_corpus_definition
from addcorpus.permissions import (CanSearchCorpus,
                                   corpus_name_from_request)
from api.utils import check_json_keys, find_media_file
from django.http.response import FileResponse
from rest_framework.exceptions import APIException, NotFound, ParseError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger()


class GetMediaView(APIView):
    '''
    Return the image/pdf of a document
    '''

    permission_classes = [CanSearchCorpus]

    def get(self, request, *args, **kwargs):
        corpus_name = corpus_name_from_request(request)

        if 'image_path' not in request.query_params:
            raise ParseError(detail='No image path provided')

        image_path = request.query_params['image_path']
        corpus = load_corpus_definition(corpus_name)

        if len(request.query_params) > 2:
            # there are more arguments, currently used for pdf retrieval only
            try:
                out = corpus.get_media(request.query_params)
            except Exception as e:
                logger.error(e)
                raise APIException()
            if not out:
                raise NotFound()

            return FileResponse(out, filename='scan.pdf',
                                as_attachment=True,
                                content_type='application/pdf')
        else:
            mimetype = getattr(corpus, 'scan_image_type')
            path = find_media_file(corpus.data_directory, image_path, mimetype)
            if not path:
                raise NotFound()
            else:
                _, filename = os.path.split(image_path)
                return FileResponse(open(path, 'rb'),
                                    filename=filename,
                                    as_attachment=True,
                                    content_type=corpus.scan_image_type)


class MediaMetadataView(APIView):
    '''
    Return metadata on the media for a document
    '''

    permission_classes = [CanSearchCorpus]

    def post(self, request, *args, **kwargs):
        corpus_name = corpus_name_from_request(request)
        corpus = load_corpus_definition(corpus_name)
        check_json_keys(request, ['document'])
        data = corpus.request_media(request.data['document'], corpus_name)
        logger.info(data)
        if not data or 'media' not in data or len(data['media']) == 0:
            raise NotFound(detail='this document has no associated media')
        else:
            return Response(data)
