from django.contrib import admin
from es import models

class IndexAdmin(admin.ModelAdmin):
    readonly_fields = ['name', 'server', 'available']
    list_display = ['name', 'server', 'available']
    search_fields = ['name']
    list_filter = ['server', 'available']

admin.site.register(models.Index, IndexAdmin)
