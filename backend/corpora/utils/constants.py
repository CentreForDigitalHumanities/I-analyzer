def document_context(context_fields=['debate_id'], sort_field='sequence', sort_direction='asc', context_display_name='debate'):
    return {
        'context_fields': context_fields,
        'sort_field': sort_field,
        'sort_direction': sort_direction,
        'context_display_name': context_display_name
    }
