from django.contrib import admin
from .models import Query

class QueryAdmin(admin.ModelAdmin):
    readonly_fields = ['query_json']
    list_display = ['id', 'corpus', 'completed', 'total_results']
    list_filter = ['corpus', 'completed']

admin.site.register(Query, QueryAdmin)

