from django.urls import path, include
from user.urls import urlpatterns as user_urls
from orders.urls import urlpatterns as orders_urls
from category.urls import urlpatterns as category_urls

class APIRouter:
    urlpatterns = [
        path("user/", include(user_urls)),
        path("orders/", include(orders_urls)),
        path("category/", include(category_urls))
    ]
