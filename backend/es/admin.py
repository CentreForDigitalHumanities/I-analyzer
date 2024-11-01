from django.contrib import admin
from es import models

class IndexAdmin(admin.ModelAdmin):
    readonly_fields = ['aliases', 'settings',  'mappings', 'creation_date']
    list_display = ['name', 'server', 'available']
    search_fields = ['name']
    list_filter = ['server', 'available']

    def has_add_permission(self, request):
        # disable creating indices manually
        return False

    def has_change_permission(self, request, obj=None):
        # disable editing index data
        return False

    def has_delete_permission(self, request, obj=None):
        # only unavailable indices can be deleted
        if obj and obj.available:
            return False
        return super().has_delete_permission(request, obj)


admin.site.register(models.Index, IndexAdmin)
