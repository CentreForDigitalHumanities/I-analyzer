from django.contrib import admin
from .models import CustomUser, UserProfile
from django.contrib.auth.admin import UserAdmin


class InlineUserProfileAdmin(admin.StackedInline):
    model = UserProfile


class CustomUserAdmin(UserAdmin):
    inlines = [InlineUserProfileAdmin]
    fieldsets = UserAdmin.fieldsets + (
        ('Extra fields', {
            'fields': ('download_limit',)
        }),
    )


admin.site.register(CustomUser, CustomUserAdmin)
