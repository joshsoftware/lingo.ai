import os

from django.contrib import admin
from django.utils.html import format_html

from .models import Bot, BotEvent


# Create an inline for BotEvent to show on the Bot admin page
class BotEventInline(admin.TabularInline):
    model = BotEvent
    extra = 0
    readonly_fields = ("created_at", "event_type", "event_sub_type", "old_state", "new_state", "metadata")
    can_delete = False
    max_num = 0  # Don't allow adding new events through admin
    ordering = ("created_at",)  # Show most recent events first

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Bot)
class BotAdmin(admin.ModelAdmin):
    actions = None
    list_display = ("object_id", "name", "project", "state", "created_at", "updated_at", "view_logs_link")
    list_filter = ("state", "project")
    search_fields = ("object_id",)
    readonly_fields = ("object_id", "created_at", "updated_at", "state", "view_logs_link")
    inlines = [BotEventInline]  # Add the inline to the admin

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return True

    def view_logs_link(self, obj):
        pod_name = obj.k8s_pod_name()
        link_formatting_str = os.getenv("CLOUD_LOGS_LINK_FORMATTING_STR")
        if not link_formatting_str:
            return None
        try:
            url = link_formatting_str.format(pod_name=pod_name)
            return format_html('<a href="{}" target="_blank">View Logs</a>', url)
        except Exception:
            return None

    view_logs_link.short_description = "Cloud Logs"

    # Optional: if you want to organize the fields in the detail view
    fieldsets = (
        ("Basic Information", {"fields": ("object_id", "name", "project")}),
        ("Meeting Details", {"fields": ("meeting_url", "meeting_uuid")}),
        ("Status", {"fields": ("state", "view_logs_link")}),
        ("Settings", {"fields": ("settings",)}),
        ("Metadata", {"fields": ("created_at", "updated_at", "version")}),
    )
