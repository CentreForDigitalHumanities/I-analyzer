from django.contrib import admin
from .models import Corpus

class CorpusAdmin(admin.ModelAdmin):
    readonly_fields = ['name', 'description']

admin.site.register(Corpus, CorpusAdmin)
