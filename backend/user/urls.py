from django.urls import path

from user.views import UserView, RegisterConstructorAPIView, RegisterCustomerAPIView ,VerifyEmailView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import ( CustomTokenObtainPairView, RegisterOperatorAPIView, OperatorListView, OperatorDeleteView, PendingConstructorsListAPIView,
                    ApproveConstructorAPIView, ViewProfileView, ChangePasswordView, ResetPasswordView , AddCoinView )
from .views import list_users_by_role, view_profile, UpdateProfileAPIView
urlpatterns = [
    path('', UserView.as_view(), name='user'),
    # Đây là phần thêm bân đầu là path('login', TokenObtainPairView.as_view(), name='login'),
    path('login', CustomTokenObtainPairView.as_view(), name='login'),
    # Đây là phần thêm
    path('refresh', TokenRefreshView.as_view(), name='refresh'),
    path('register-customer', RegisterCustomerAPIView.as_view(), name='register-customer'),
    # path('register-contractor', RegisterConstructorAPIView.as_view(), name='register-contractor'),
    path('register-constructor', RegisterConstructorAPIView.as_view(), name='register-contractor'),
    path('verify-email/<str:verification_uuid>/', VerifyEmailView.as_view(), name='verify-email'),
    # Đây là phần thêm
    path('register-operator', RegisterOperatorAPIView.as_view(), name='register-operator'),
    path('operators', OperatorListView.as_view(), name='operator-list'),
    path('operators/<int:operator_id>/delete', OperatorDeleteView.as_view(), name='operator-delete'),
    # Đây là phần thêm
    path('pending-constructors', PendingConstructorsListAPIView.as_view(), name='pending-constructors'),
    path('approve-constructor/<int:constructor_id>/', ApproveConstructorAPIView.as_view(), name='approve-constructor'),
    # Đây là phần thêm
    path('profile/', ViewProfileView.as_view(), name='view-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    # Đây là phần thêm
    path("users/<int:user_id>/profile/", view_profile, name="view_profile"),
    path("users/<str:role>/", list_users_by_role, name="list_users_by_role"),
    # Đây là phần thêm
    path('profile/update/', UpdateProfileAPIView.as_view(), name='update-profile'),
    path('add-coin/<int:user_id>/', AddCoinView.as_view(), name="add-coin"),
]