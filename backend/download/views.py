from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from ianalyzer.exceptions import NotImplemented

class ResultsDownloadView(APIView):
    '''
    Download search results up to 10.000 documents
    '''
    def post(self, request, *args, **kwargs):
        raise NotImplemented

        # TODO: download view

        # error_response = make_response("", 400)
        # error_response.headers['message'] = "Download failed: "
        # if not request.json:
        #     error_response.headers.message += 'missing request body.'
        #     return error_response
        # elif request.mimetype != 'application/json':
        #     error_response.headers.message += 'unsupported mime type.'
        #     return error_response
        # elif not all(key in request.json.keys() for key in ['es_query', 'corpus', 'fields', 'route', 'encoding']):
        #     error_response.headers['message'] += 'missing arguments.'
        #     return error_response
        # elif request.json['size']>1000:
        #     error_response.headers['message'] += 'too many documents requested.'
        #     return error_response
        # else:
        #     error_response = make_response("", 500)
        #     try:
        #         search_results = download.normal_search(request.json['corpus'], request.json['es_query'], request.json['size'])
        #         csv_path = tasks.make_csv(search_results, request.json)
        #         directory, filename = os.path.split(csv_path)
        #         converted_filename = convert_csv.convert_csv(directory, filename, 'search_results', request.json['encoding'])
        #         csv_file = os.path.join(directory, converted_filename)
        #     except Exception as e:
        #         logger.error(e)
        #         error_response.headers['message'] += 'Could not generate csv file'
        #         return error_response

        #     if not os.path.isabs(csv_file):
        #         error_response.headers['message'] += 'csv filepath is not absolute.'
        #         return error_response

        #     if not csv_file:
        #         error_response.headers.message += 'Could not create csv file.'
        #         return error_response

        #     try:
        #         response = make_response(send_file(csv_file, mimetype='text/csv'))
        #         response.headers['filename'] = split(csv_file)[1]
        #         return response
        #     except:
        #         error_response.headers['message'] += 'Could not send file to client'
        #         return error_response


class ResultsDownloadTaskView(APIView):
    '''
    Schedule a task to download search results
    over 10.000 documents
    '''

    def post(self, request, *args, **kwargs):
        raise NotImplemented

        # TODO: download schedule view

        # error_response = make_response("", 400)
        # error_response.headers['message'] = "Download failed: "
        # if not request.json:
        #     error_response.headers.message += 'missing request body.'
        #     return error_response
        # elif request.mimetype != 'application/json':
        #     error_response.headers.message += 'unsupported mime type.'
        #     return error_response
        # elif not all(key in request.json.keys() for key in ['es_query', 'corpus', 'fields', 'route']):
        #     error_response.headers['message'] += 'missing arguments.'
        #     return error_response
        # elif not current_user.email:
        #     error_response.headers['message'] += 'user email not known.'
        #     return error_response

        # # Celery task
        # task_chain = tasks.download_search_results(request.json, current_user)
        # if task_chain:
        #     result = task_chain.apply_async()
        #     return jsonify({'success': True, 'task_ids': [result.id, result.parent.id]})
        # else:
        #     return jsonify({'success': False, 'message': 'Could not create csv file.'})


class FullDataDownloadTaskView(APIView):
    '''
    Schedule a task to download the full data
    for a visualisation.
    '''

    def post(self, request, *args, **kwargs):
        raise NotImplemented

        # TODO: download schedule view

        # if not request.json:
        #     abort(400)

        # for key in ['visualization', 'parameters', 'corpus']:
        #     if not key in request.json:
        #         abort(400)

        # visualization_type = request.json['visualization']
        # known_visualisations = ['date_term_frequency', 'aggregate_term_frequency']

        # if visualization_type not in known_visualisations:
        #     abort(400, 'unknown visualization type "{}"'.format(visualization_type))

        # task_chain = tasks.download_full_data(request.json, current_user)
        # task_chain.apply_async()

        # return jsonify({'success': True, 'task_ids': [task_chain.id]})



class DownloadHistoryView(APIView):
    '''
    Retrieve list of all the user's downloads
    '''

    def get(self, request, *args, **kwargs,):
        raise NotImplemented

        # TODO: download history

        # result = [d.serialize() for d in current_user.downloads]
        # return jsonify(result)


class FileDownloadView(APIView):
    '''
    Retrieve a CSV file saved in your download history
    '''

    def get(self, request, *args, **kwargs):
        raise NotImplemented

        # TODO: file download

        # encoding = request.args.get('encoding', 'utf-8')
        # format = request.args.get('format', None)

        # record = models.Download.query.get(id)
        # directory, filename = os.path.split(record.filename)
        # download_type = record.download_type

        # filename = convert_csv.convert_csv(directory, filename, download_type, encoding, format)

        # return send_from_directory(directory, filename)
