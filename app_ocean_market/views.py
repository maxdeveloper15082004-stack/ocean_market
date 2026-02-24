from django.shortcuts import render


def home(request):
    return render(request, "home.html")


def about_us(request):
    return render(request, "about us.html")


def login_view(request):
    return render(request, "login.html")
