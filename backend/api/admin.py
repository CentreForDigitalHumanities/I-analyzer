from django.contrib import admin
from .models import Query, Download

class QueryAdmin(admin.ModelAdmin):
    readonly_fields = ['query_json']

admin.site.register(Query, QueryAdmin)

class DownloadAdmin(admin.ModelAdmin):
    readonly_fields = ['parameters']

admin.site.register(Download, DownloadAdmin)
