from django.core.exceptions import ValidationError
from django.db.models.signals import m2m_changed, pre_delete
from django.dispatch import receiver

from .models import DOCS_PER_TAG_LIMIT, Tag


def tag_exceeds_maximum(tag: Tag, n_added: int):
    return (tag.tagged_docs.count() + n_added) > DOCS_PER_TAG_LIMIT


@receiver(m2m_changed, sender=Tag.tagged_docs.through)
def tagged_documents_changed(action, reverse, instance, pk_set, **kwargs):
    '''Signal for detecting maximum number of tagged documents

    Raises ValidationError if maximum number of tagged docs for a tag
    would be exceeded.
    If attempting to add multiple Tags to a TaggedDocument, the full
    operation is rejected. In realistic scenarios this will not happen,
    since the application is interested in tagging per single tag,
    so this is acceptable.

    See: https://docs.djangoproject.com/en/4.2/ref/signals/#m2m-changed for
    parameters.

    Responds to the 'pre_add' action: attempting to add tagged_docs.
    Other actions are ignored.

    reverse = True: attempting to add TaggedDocument(s) to a Tag
    reverse = False: attempting to add Tag(s) to a TaggedDocument
    '''

    if action != 'pre_add':
        return

    n_added = len(pk_set)

    # attempting to add TaggedDocument(s) to Tag
    if reverse:
        if tag_exceeds_maximum(instance, n_added):
            raise ValidationError(
                'Maximum number of tagged documents reached '
                f'for tag {instance.name}'
            )

    # non-reverse: attempting to add Tag(s) to TaggedDocument
    if not reverse:
        tag_instances = (Tag.objects.get(pk=pk) for pk in pk_set)
        for tag in tag_instances:
            if tag_exceeds_maximum(tag, 1):
                raise ValidationError(
                    'Maximum number of tagged documents reached '
                    f'for tag {tag.name}'
                )

@receiver(pre_delete, sender=Tag)
def pre_delete_tag(instance, **kwargs):
    '''
    On deleting Tag, checks all its TaggedDocuments.
    If there is only one Tag remaining, delete the TaggedDocument
    '''
    tagged_docs = instance.tagged_docs.all()
    for doc in tagged_docs:
        if doc.tags.count() == 1:
            doc.delete()

