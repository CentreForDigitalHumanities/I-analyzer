from django.contrib import admin
from es import models

class IndexAdmin(admin.ModelAdmin):
    readonly_fields = ['name', 'server', 'available', 'aliases', 'settings',  'mappings', 'creation_date']
    list_display = ['name', 'server', 'available']
    search_fields = ['name']
    list_filter = ['server', 'available']

admin.site.register(models.Index, IndexAdmin)
