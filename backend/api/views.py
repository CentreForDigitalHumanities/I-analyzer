from rest_framework import viewsets
from api.serializers import QuerySerializer

class QueryViewset(viewsets.ModelViewSet):
    '''
    Access search history
    '''

    serializer_class = QuerySerializer

    def get_queryset(self):
        return self.request.user.queries.all()

    #TODO: set create/update actions
    # if not request.json:
    #     abort(400)

    # query_json = request.json['query']
    # if 'filters' in query_json:
    #     query_model = json.loads(query_json)
    #     for search_filter in query_model['filters']:
    #         # no need to save defaults in database
    #         if 'defaultData' in search_filter:
    #             del search_filter['defaultData']
    #         if 'options' in search_filter['currentData']:
    #             # options can be lengthy, just save user settings
    #             del search_filter['currentData']['options']
    #     query_json = json.dumps(query_model)
    # corpus_name = request.json['corpus_name']

    # if 'id' in request.json:
    #     query = models.Query.query.filter_by(id=request.json['id']).first()
    # else:
    #     query = models.Query(
    #         query=query_json, corpus_name=corpus_name, user=current_user)

    # query.total_results = request.json['total_results']['value']
    # date_format = "%Y-%m-%dT%H:%M:%S.%fZ"
    # query.started = datetime.now() if ('markStarted' in request.json and request.json['markStarted'] == True) \
    #     else (datetime.strptime(request.json['started'], date_format) if 'started' in request.json else None)
    # query.completed = datetime.now() if ('markCompleted' in request.json and request.json['markCompleted'] == True)  \
    #     else (datetime.strptime(request.json['completed'], date_format) if 'completed' in request.json else None)

    # query.aborted = request.json['aborted']
    # query.transferred = request.json['transferred']

    # models.db.session.add(query)
    # models.db.session.commit()

    # return jsonify({
    #     'id': query.id,
    #     'query': query.query_json,
    #     'corpus_name': query.corpus_name,
    #     'started': query.started,
    #     'completed': query.completed,
    #     'aborted': query.aborted,
    #     'transferred': query.transferred,
    #     'userID': query.userID
    # })


