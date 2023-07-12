from django.contrib import admin
from tag.models import Tag, TaggedDocument

# Register your models here.
class TagAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'user']

class TaggedDocumentAdmin(admin.ModelAdmin):
    list_display = ['id', 'corpus', 'doc_id']

admin.site.register(Tag, TagAdmin)
admin.site.register(TaggedDocument, TaggedDocumentAdmin)
