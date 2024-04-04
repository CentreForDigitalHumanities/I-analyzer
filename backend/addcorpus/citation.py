import os
from django.template import Template, Context
from datetime import date

from django.conf import settings

from addcorpus.models import CorpusConfiguration, CorpusDocumentationPage
from addcorpus.python_corpora.load_corpus import corpus_dir


def render_citation(corpus_name):
    raw = citation_template(corpus_name)
    return render_citation_context(raw)


def citation_template(corpus_name):
    pages = CorpusDocumentationPage.objects.filter(
        corpus_configuration__corpus__name=corpus_name,
        type=CorpusDocumentationPage.PageType.CITATION
    )

    if pages.exists():
        page = pages.first()
        return page.content


def render_citation_context(raw_template):
    template = Template(raw_template)
    today = date.today()
    context = Context({
        'frontend_url': settings.BASE_URL,
        'date': {
            'year': today.year,
            'month': today.strftime('%B'),
            'day': today.day
        }
    })
    return template.render(context)
