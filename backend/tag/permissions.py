from rest_framework.permissions import BasePermission
from rest_framework.exceptions import NotFound
from tag.models import Tag


class IsTagOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user.is_superuser or (obj.user == request.user)

class CanSearchTags(BasePermission):
    def has_permission(self, request, view):
        tag_ids = request.data.get('tags', [])

        for id in tag_ids:
            self._verify_tag_exists(id)

        return all(
            self._has_tag_permission(request, view, id)
            for id in tag_ids
        )

    def _verify_tag_exists(self, tag_id):
        if not Tag.objects.filter(id=tag_id).exists():
            raise NotFound(f'Tag {tag_id} does not exist')

    def _has_tag_permission(self, request, view, tag_id):
        tag = Tag.objects.get(id=tag_id)
        return IsTagOwner().has_object_permission(request, view, tag)
