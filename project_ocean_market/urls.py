from django.contrib import admin
from django.urls import path
from app_ocean_market import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", views.home, name="home"),
    path("about-us/", views.about_us, name="about_us"),
    path("login/", views.login_view, name="login"),
    path("signup/", views.signup_view, name="signup"),
    path("api/send-otp/", views.send_otp_api, name="send_otp"),
    path("api/verify-otp/", views.verify_otp_api, name="verify_otp"),
    path("api/login/", views.login_api, name="login_api"),
    path("logout/", views.logout_view, name="logout"),
]
