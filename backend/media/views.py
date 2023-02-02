from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound, ValidationError
import logging
from rest_framework.permissions import IsAuthenticated
from addcorpus.permissions import corpus_name_from_request, CorpusAccessPermission
from addcorpus.load_corpus import load_corpus
from django.http.response import FileResponse
import os

logger = logging.getLogger()

class GetMediaView(APIView):
    '''
    Return the image/pdf of a document
    '''

    permission_classes = [IsAuthenticated, CorpusAccessPermission]

    def get(self, request, *args, **kwargs):
        corpus_name = corpus_name_from_request(request)

        if not 'image_path' in request.query_params:
            raise ValidationError(detail='No image path provided')

        image_path = request.query_params['image_path']
        corpus = load_corpus(corpus_name)

        if len(request.query_params)>2:
            # there are more arguments, currently used for pdf retrieval only
            try:
                out = corpus.get_media(request.query_params)
            except Exception as e:
                logger.error(e)
                raise ValidationError()
            if not out:
                raise NotFound()

            return FileResponse(open(out, 'rb'), filename='scan.pdf', as_attachment=True, content_type='application/pdf')
        else:
            path = os.path.join(corpus.data_directory, image_path)
            if not os.path.isfile(path):
                raise NotFound()
            else:
                _, filename = os.path.split(image_path)
                return FileResponse(open(path, 'rb'), filename=filename, as_attachment=True, content_type=corpus.scan_image_type)


class MediaMetadataView(APIView):
    '''
    Return metadata on the media for a document
    '''

    permission_classes = [IsAuthenticated, CorpusAccessPermission]

    def post(self, request, *args, **kwargs):
        corpus_name = corpus_name_from_request(request)
        corpus = load_corpus(corpus_name)
        if not 'document' in request.data:
            raise ValidationError(detail='no document specified')
        data = corpus.request_media(request.data['document'], corpus_name)
        logger.info(data)
        if 'media' not in data or len(data['media'])==0:
            raise NotFound(detail='this document has no associated media')
        else:
            return Response(data)
