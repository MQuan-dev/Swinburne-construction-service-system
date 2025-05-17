from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import (OrderViewSet, CreateRequestView , CoinHistoryView ,ContractMoneyHistoryView ,FeedbackListAdminView , CompletedOrdersView,
                     IncomeView, OrderCountView , ContractMoneyListView , OurQuotationUpdateView , OurQuotationListView , AdminOrderListView, OutcomeView, RemainView)


# Router chính cho orders00
router = DefaultRouter()
router.register(r'orders-list', OrderViewSet, basename='order-list')

# Nested router cho contracts dưới orders
contract_router = routers.NestedSimpleRouter(router, r'orders-list', lookup='order')
contract_router.register(r'contracts', OrderViewSet, basename='order-contracts')

urlpatterns = [
    path('create-order/', CreateRequestView.as_view(), name='create-order'),
    path('coin-history/', CoinHistoryView.as_view(), name='coin-history'),
    path('contract-money-history/', ContractMoneyHistoryView.as_view(), name='contract-money-history'),
    path('view-feedbacks/', FeedbackListAdminView.as_view(), name='feedback-list-admin'),
    path('completed-orders/', CompletedOrdersView.as_view(), name='completed-orders'),
    path('contract-money/', ContractMoneyListView.as_view(), name='contract-money-list'),
    path('our-quotation/<int:pk>/', OurQuotationUpdateView.as_view(), name="our-quotation-update"),
    path('our-quotation/', OurQuotationListView.as_view(), name="our-quotation-list"),
    path('', include(router.urls)),          # Bao gồm router chính cho orders
    path('', include(contract_router.urls)), # Bao gồm router nested cho contracts
    # Đây là phần thêm
    path('admin-orders/', AdminOrderListView.as_view(), name='admin-orders'),
    path('income/', IncomeView.as_view(), name='income'),
    path('order-count/', OrderCountView.as_view(), name='order-count'),
    # Đây là phần thêm
    path('outcome/', OutcomeView.as_view(), name='outcome'),
    path('remain/', RemainView.as_view(), name='remain'),
]
