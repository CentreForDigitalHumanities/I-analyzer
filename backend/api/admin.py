from django.contrib import admin
from .models import Query

class QueryAdmin(admin.ModelAdmin):
    readonly_fields = ['query_json']

admin.site.register(Query, QueryAdmin)

