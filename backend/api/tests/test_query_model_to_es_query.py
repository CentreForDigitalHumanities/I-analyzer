import pytest
from api.query_model_to_es_query import query_model_to_es_query

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
        'terms filter',
        {'queryText':None,'filters':[{'fieldName':'chamber','description':'Search only in debates from the selected chamber(s)','useAsFilter':True,'defaultData':{'filterType':'MultipleChoiceFilter','optionCount':2,'selected':[]},'currentData':{'filterType':'MultipleChoiceFilter','selected':['Eerste%20Kamer']}}]},
        {'query':{'bool':{'must':{'match_all':{}},'filter':[{'terms':{'chamber':['Eerste Kamer']}}]}}},
    ), (
        'sort by field',
        {'queryText':None,'filters':[],'sortBy':'date','sortAscending':True},
        {'query':{'bool':{'must':{'match_all':{}},'filter':[]}},'sort':[{'date':'asc'}]},
    ), (
        'highlight',
        {'queryText':'test','filters':[],'sortAscending':True,'highlight':10},
        {'query':{'bool':{'must':{'simple_query_string':{'query':'test','lenient':True,'default_operator':'or'}},'filter':[]}},'highlight':{'fragment_size':10,'pre_tags':['<span class=\'highlight\'>'],'post_tags':['</span>'],'order':'score','fields':[{'id':{}},{'title':{}},{'content':{}}]}}
    )
]

def get_name(case): return case[0]

@pytest.mark.parametrize('name,query_model,es_query', cases, ids=map(get_name, cases))
def test_query_model_to_es_query(name, query_model, es_query):
    result = query_model_to_es_query(query_model)
    assert result == es_query
