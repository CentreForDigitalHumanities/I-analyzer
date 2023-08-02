from rest_framework.exceptions import ParseError

def check_json_keys(request, keys):
    '''
    Check that each key in keys is present in request.data
    '''

    for key in keys:
        if key not in request.data:
            raise ParseError(detail=f'Key "{key}" not specified')
