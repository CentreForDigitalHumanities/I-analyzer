from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Tag
from .permissions import IsTagOwner
from .serializers import TagSerializer


class TagViewSet(ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated, IsTagOwner]
    queryset = Tag.objects.all()

    def perform_create(self, serializer):
        '''Overwrites ModelViewSet.perform_create
        Auto-assigns the authenticated user on creation'''
        return serializer.save(user=self.request.user)

    def list(self, *args, **kwargs):
        '''Overwrites ModelViewSet.list
        Filters the default queryset by ownership.
        Only applies to list view, the class queryset is unaffected.
        '''
        queryset = self.queryset.filter(user=self.request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
