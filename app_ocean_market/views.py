from django.shortcuts import render, redirect
from django.contrib import messages
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
from .models import Customer, Address
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

def home(request):
    return render(request, "home.html")

def about_us(request):
    return render(request, "about us.html")

def wishlist(request):
    return render(request, "wishlist.html")

def address(request):
    customer_id = request.session.get("customer_id")
    address_obj = None
    if customer_id:
        try:
            address_obj = Address.objects.get(customer_id=customer_id)
        except Address.DoesNotExist:
            pass
    return render(request, "your address.html", {"address": address_obj})

def register(request):
    if request.session.get("customer_id"):
        return redirect("home")

    if request.method == "POST":
        name = request.POST.get("name")
        phone = request.POST.get("phone")
        email = request.POST.get("email")
        password = request.POST.get("password")

        if Customer.objects.filter(phone=phone).exists():
            messages.error(request, "Phone number already registered.")
            return redirect("register")

        if Customer.objects.filter(email=email).exists():
            messages.error(request, "Email already registered.")
            return redirect("register")

        if Customer.objects.filter(name=name).exists():
            messages.error(request, "Name is already taken.")
            return redirect("register")

        # Save customer immediately
        customer = Customer(
            name=name,
            phone=phone,
            email=email,
            password=make_password(password),
        )
        customer.save()

        messages.success(request, "Account created. Please log in.")
        return redirect("login")

    return render(request, "register.html")


def login_view(request):
    if request.session.get("customer_id"):
        next_url = request.GET.get("next", "/")
        if next_url.startswith("/"):
            return redirect(next_url)
        return redirect("home")

    if request.method == "POST":
        email = request.POST.get("email")
        password = request.POST.get("password")

        # Handle "next" parameter from the login form action URL
        next_url = request.GET.get("next", "/")

        try:
            customer = Customer.objects.get(email=email)
        except Customer.DoesNotExist:
            messages.error(request, "Invalid email or password.")
            return redirect(f"/login/?next={next_url}")

        if check_password(password, customer.password):
            # login success
            request.session["customer_id"] = customer.id
            request.session["customer_email"] = customer.email
            request.session["customer_phone"] = customer.phone
            request.session["customer_name"] = customer.name  # for navbar compatibility
            request.session.set_expiry(1209600)  # 2 weeks persistent

            if next_url.startswith("/"):
                return redirect(next_url)
            return redirect("home")
        else:
            messages.error(request, "Invalid email or password.")
            return redirect(f"/login/?next={next_url}")

    return render(request, "login.html")


def logout_view(request):
    request.session.flush()
    return redirect("home")


@csrf_exempt
def save_address_api(request):
    if request.method == "POST":
        customer_id = request.session.get("customer_id")
        if not customer_id:
            return JsonResponse(
                {"success": False, "message": "Please login to save address."}
            )

        try:
            data = json.loads(request.body)
            address, _ = Address.objects.get_or_create(customer_id=customer_id)
            address.full_name = data.get("full_name", "")
            address.phone_number = data.get("phone_number", "")
            address.address_type = data.get("address_type", "Home")
            address.full_address = data.get("full_address", "")
            address.pincode = data.get("pincode", "")
            address.save()
            return JsonResponse(
                {"success": True, "message": "Address saved successfully."}
            )
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    return JsonResponse({"success": False, "message": "Invalid method."})
