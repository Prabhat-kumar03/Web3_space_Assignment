from .views import (
    PostListCreateAPIView,
    PostDetailAPIView,
)
from django.urls import path

urlpatterns =[
    path('posts/', PostListCreateAPIView.as_view(), name='post-list-create'),
    path('posts/<int:pk>', PostDetailAPIView.as_view(), name='post-detail'),
]