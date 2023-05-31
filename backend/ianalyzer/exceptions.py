from rest_framework.exceptions import APIException
from rest_framework import status

class NotImplemented(APIException):
    status_code = status.HTTP_501_NOT_IMPLEMENTED
    default_detail = 'Method not yet implemented'
    default_code = 'not_implemented'
