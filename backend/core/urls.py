from django.urls import path
from . import views

urlpatterns = [
    path('auth/login', views.auth_login, name='auth-login'),
    path('lahan/', views.lahan_list, name='lahan-list-slash'),
    path('lahan', views.lahan_list, name='lahan-list'),
    path('lahan/<str:lahan_id>/input', views.input_lahan, name='input-lahan'),
    path('lahan/<str:lahan_id>/history', views.lahan_history, name='lahan-history'),
    path('pipeline/infer', views.pipeline_infer, name='pipeline-infer'),
    path('audit-logs', views.audit_logs_list, name='audit-logs-list'),
    path('pipeline/config', views.pipeline_config, name='pipeline-config'),
    path('tindakan/confirm', views.tindakan_confirm, name='tindakan-confirm'),
    path('broadcast/alert', views.broadcast_alert, name='broadcast-alert'),
]
