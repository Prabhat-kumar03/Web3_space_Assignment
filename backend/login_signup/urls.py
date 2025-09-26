from .views import (
    SignUpUser,
    LoginUser,
)
from django.urls import path

urlpatterns = [
     path('signup', SignUpUser.as_view(), name='signup'),
     path('login', LoginUser.as_view(), name='login'),

    # Mapping APIs
    
]