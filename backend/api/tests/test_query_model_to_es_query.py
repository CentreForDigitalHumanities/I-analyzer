import pytest
from api.query_model_to_es_query import query_model_to_es_query
from api.es_query_to_query_model import es_query_to_query_model
from copy import deepcopy

cases = [
    (
        'blank search',
        {'queryText': None, 'filters': [], 'sortAscending': True},
        {'query': {'bool': {'must': {'match_all': {}}, 'filter': []}}}
    ), (
        'query text, no filters',
        {'queryText':'test','filters':[],'sortAscending':True},
        {'query':{'bool':{'must':{'simple_query_string':{'query':'test','lenient':True,'default_operator':'or'}},'filter':[]}}}
    ), (
        'search fields',
        {'queryText':'test','filters':[],'sortAscending':True,'fields':['content']},
        {'query':{'bool':{'must':{'simple_query_string':{'query':'test','lenient':True,'default_operator':'or','fields':['content']}},'filter':[]}}}
    ), (
        'date filter',
        {'queryText':None,'filters':[{'fieldName':'date','description':'Search only within this time range.','useAsFilter':True,'defaultData':{'filterType':'DateFilter','min':'1815-01-01','max':'2022-12-31'},'currentData':{'filterType':'DateFilter','min':'1900-01-01','max':'2000-12-31'}}]},
        {'query':{'bool':{'must':{'match_all':{}},'filter':[{'range':{'date':{'gte':'1900-01-01','lte':'2000-12-31','format':'yyyy-MM-dd'}}}]}}},
    ), (
        'range filter',
        {'queryText':None,'filters':[{'fieldName':'year','description':'Restrict the years from which search results will be returned.','useAsFilter':True,'defaultData':{'filterType':'RangeFilter','min':1957,'max':2008},'currentData':{'filterType':'RangeFilter','min':1967,'max':1989}}],'sortAscending':True},
        {'query':{'bool':{'must':{'match_all':{}},'filter':[{'range':{'year':{'gte':1967,'lte':1989}}}]}}}
    ), (
        'terms filter',
        {'queryText':None,'filters':[{'fieldName':'chamber','description':'Search only in debates from the selected chamber(s)','useAsFilter':True,'defaultData':{'filterType':'MultipleChoiceFilter','optionCount':2,'selected':[]},'currentData':{'filterType':'MultipleChoiceFilter','selected':['Eerste%20Kamer']}}]},
        {'query':{'bool':{'must':{'match_all':{}},'filter':[{'terms':{'chamber':['Eerste Kamer']}}]}}},
    ), (
        'boolean filter',
        {'queryText':None,'filters':[{'fieldName':'has_content','description':'Accept only articles that have available text content.','useAsFilter':True,'defaultData':{'filterType':'BooleanFilter','checked':False},'currentData':{'filterType':'BooleanFilter','checked':True}}],'sortBy':'date','sortAscending':True},
        {'query':{'bool':{'must':{'match_all':{}},'filter':[{'term':{'has_content':True}}]}},'sort':[{'date':'asc'}]}
    ),(
        'sort by field',
        {'queryText':None,'filters':[],'sortBy':'date','sortAscending':True},
        {'query':{'bool':{'must':{'match_all':{}},'filter':[]}},'sort':[{'date':'asc'}]},
    ), (
        'highlight',
        {'queryText':'test','filters':[],'sortAscending':True,'highlight':10},
        {'query':{'bool':{'must':{'simple_query_string':{'query':'test','lenient':True,'default_operator':'or'}},'filter':[]}},'highlight':{'fragment_size':10}}
    )
]

def get_name(case): return case[0]

@pytest.mark.parametrize('name,query_model,es_query', cases, ids=map(get_name, cases))
def test_query_model_to_es_query(name, query_model, es_query):
    result = query_model_to_es_query(query_model)
    assert result == es_query

@pytest.mark.parametrize('name,query_model,es_query', cases, ids=map(get_name, cases))
def test_es_query_to_query_model(name, query_model, es_query):
    result = es_query_to_query_model(es_query)

    # clean up the model to remove some data that is irrelevant for querying
    # and thus not represented in es_query
    # it's not relevant for the search history either, so we don't need it

    model_copy = deepcopy(query_model)
    if 'sortBy' not in model_copy and 'sortAscending' in model_copy:
        del model_copy['sortAscending']
    for filter in model_copy['filters']:
        filter['description'] = ''
        del filter['defaultData']

    assert result == model_copy
