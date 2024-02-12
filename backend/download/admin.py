from django.contrib import admin
from download.models import Download

class StatusFilter(admin.SimpleListFilter):
    title = 'status'
    parameter_name = 'status'

    def lookups(self, request, model_admin):
        return [
            ('working', 'working'),
            ('done', 'done'),
            ('error', 'error')
        ]

    def queryset(self, request, queryset):
        if self.value() == 'done':
            return queryset.filter(
                completed__isnull=False,
                filename__endswith='.csv'
            )
        if self.value() == 'working':
            return queryset.filter(
                completed__isnull=True,
            )
        if self.value() == 'error':
            return queryset.filter(
                completed__isnull=False,
                filename__isnull=True,
            )


class DownloadAdmin(admin.ModelAdmin):
    readonly_fields = ['parameters', 'status']
    list_display = ['id', 'download_type', 'corpus', 'started', 'status']
    list_filter = [StatusFilter, 'started']

admin.site.register(Download, DownloadAdmin)
