from django.contrib import admin
from django.urls import path
from core.views import IngestInspectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/ingest/', IngestInspectView.as_view(), name='ingest_text'),
]
