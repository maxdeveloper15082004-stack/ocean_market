from django.contrib import admin
from django.urls import path
from app_ocean_market import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", views.home, name="home"),
    path("about-us/", views.about_us, name="about_us"),
    path("address/", views.address, name="address"),
    path("wishlist/", views.wishlist, name="wishlist"),
    # Auth
    path("register/", views.register, name="register"),
    path("signup/", views.register, name="signup"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    # API
    path("api/save-address/", views.save_address_api, name="save_address"),
]
