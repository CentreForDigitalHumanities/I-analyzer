from django.contrib import admin

from indexing import models


class CreateIndexAdmin(admin.StackedInline):
    model = models.CreateIndexTask
    extra = 0


class PopulateIndexAdmin(admin.StackedInline):
    model = models.PopulateIndexTask
    extra = 0


class UpdateIndexAdmin(admin.StackedInline):
    model = models.UpdateIndexTask
    extra = 0


class UpdateSettingsAdmin(admin.StackedInline):
    model = models.UpdateSettingsTask
    extra = 0


class RemoveAliasAdmin(admin.StackedInline):
    model = models.RemoveAliasTask
    extra = 0


class AddAliasAdmin(admin.StackedInline):
    model = models.AddAliasTask
    extra = 0


class DeleteIndexAdmin(admin.StackedInline):
    model = models.DeleteIndexTask
    extra = 0



class IndexJobAdmin(admin.ModelAdmin):
    list_display = ['created', 'corpus', 'status']
    readonly_fields = ['status']
    list_filter = ['corpus']
    inlines = [
        CreateIndexAdmin,
        PopulateIndexAdmin,
        UpdateIndexAdmin,
        UpdateSettingsAdmin,
        RemoveAliasAdmin,
        AddAliasAdmin,
        DeleteIndexAdmin,
    ]

admin.site.register(models.IndexJob, IndexJobAdmin)
