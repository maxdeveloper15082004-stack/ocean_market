from django.contrib import admin
from django.urls import path
from app_ocean_market import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", views.home, name="home"),
    path("about-us/", views.about_us, name="about_us"),
    path("login/", views.login_view, name="login"),
]
