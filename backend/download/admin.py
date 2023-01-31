from django.contrib import admin
from download.models import Download

class DownloadAdmin(admin.ModelAdmin):
    readonly_fields = ['parameters']

admin.site.register(Download, DownloadAdmin)
