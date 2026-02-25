from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.core.exceptions import ObjectDoesNotExist

from django.http import JsonResponse
import json
import random
import datetime
from django.utils import timezone
from .models import Customer, OTPVerification
from django.views.decorators.csrf import csrf_exempt


def home(request):
    return render(request, "home.html")


def about_us(request):
    return render(request, "about us.html")


def login_view(request):
    return render(request, "login.html")


def signup_view(request):
    return render(request, "signup.html")


@csrf_exempt
def send_otp_api(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            phone = data.get("phone")
            name = data.get("name")

            if not phone or not name:
                return JsonResponse(
                    {"success": False, "message": "Name and phone are required."}
                )

            if Customer.objects.filter(phone_number=phone).exists():
                return JsonResponse(
                    {
                        "success": False,
                        "message": "Phone number already registered. Please login.",
                    }
                )

            # Limit requests
            recent_requests = OTPVerification.objects.filter(
                phone_number=phone,
                created_at__gte=timezone.now() - datetime.timedelta(minutes=5),
            ).count()

            if recent_requests >= 5:  # Limit up to 5 OTP requests per 5 min
                return JsonResponse(
                    {
                        "success": False,
                        "message": "Too many OTP requests. Try again later.",
                    }
                )

            otp = str(random.randint(100000, 999999))
            OTPVerification.objects.create(phone_number=phone, otp=otp)

            # --- SMS Integration (Fast2SMS) ---
            import urllib.request
            import urllib.error
            import urllib.parse
            import ssl

            # In production, replace YOUR_FAST2SMS_API_KEY with actual key.
            # Fast2SMS requires you to register and get a free/paid API key.
            api_key = "YOUR_FAST2SMS_API_KEY"  # Placeholder

            # We are writing the true Fast2SMS API logic here as requested!
            url = "https://www.fast2sms.com/dev/bulkV2"

            # Fast2SMS expects numbers without +91 or + and no spaces, just 10 digits
            phone_formatted = (
                phone.replace("+91", "")
                .replace("+", "")
                .replace(" ", "")
                .replace("-", "")
                .strip()
            )

            # Formulate the payload
            params = {
                "authorization": api_key,
                "variables_values": otp,
                "route": "otp",
                "numbers": phone_formatted,
            }

            query_string = urllib.parse.urlencode(params)
            req_url = f"{url}?{query_string}"

            try:
                # SSL context to ignore certificate issues in local dev
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE

                req = urllib.request.Request(
                    req_url, headers={"cache-control": "no-cache"}
                )
                with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
                    res_body = response.read()
                    res_json = json.loads(res_body.decode("utf-8"))

                    if not res_json.get("return", False):
                        if api_key == "YOUR_FAST2SMS_API_KEY":
                            # Dev bypass logic
                            print(f"\n[DEV MODE] Simulated OTP for {phone}: {otp}\n")
                            return JsonResponse(
                                {
                                    "success": True,
                                    "message": "Simulated OTP successfully (Check Console)!",
                                }
                            )

                        return JsonResponse(
                            {
                                "success": False,
                                "message": res_json.get(
                                    "message", "Fast2SMS API Error"
                                ),
                            }
                        )
            except urllib.error.HTTPError as e:
                err_body = e.read().decode("utf-8")
                try:
                    err_json = json.loads(err_body)
                    error_msg = err_json.get("message", "HTTP Error from Fast2SMS")
                except:
                    error_msg = str(e)

                if api_key == "YOUR_FAST2SMS_API_KEY":
                    print(f"\n[DEV MODE] Simulated OTP for {phone}: {otp}\n")
                    return JsonResponse(
                        {
                            "success": True,
                            "message": "Simulated OTP successfully (Check Console)!",
                        }
                    )

                return JsonResponse(
                    {"success": False, "message": f"Fast2SMS API Error: {error_msg}"}
                )
            except Exception as e:
                # We catch other general errors
                if api_key == "YOUR_FAST2SMS_API_KEY":
                    print(f"\n[DEV MODE] Simulated OTP for {phone}: {otp}\n")
                    return JsonResponse(
                        {
                            "success": True,
                            "message": "Simulated OTP successfully (Check Console)!",
                        }
                    )

                return JsonResponse(
                    {"success": False, "message": f"SMS sending failed: {str(e)}"}
                )
            # -----------------------------------------------------

            return JsonResponse(
                {
                    "success": True,
                    "message": "OTP sent successfully!",
                }
            )

        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    return JsonResponse({"success": False, "message": "Invalid request method."})


@csrf_exempt
def verify_otp_api(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            phone = data.get("phone")
            otp = data.get("otp")
            name = data.get("name")

            if not phone or not otp or not name:
                return JsonResponse({"success": False, "message": "Missing fields."})

            try:
                otp_record = OTPVerification.objects.filter(phone_number=phone).latest(
                    "created_at"
                )
            except OTPVerification.DoesNotExist:
                return JsonResponse(
                    {
                        "success": False,
                        "message": "No OTP requested. Please request one.",
                    }
                )

            if otp_record.is_verified:
                return JsonResponse({"success": False, "message": "Already verified."})

            if otp_record.is_expired():
                return JsonResponse(
                    {"success": False, "message": "OTP has expired. Please resend."}
                )

            if otp_record.attempts >= 3:
                return JsonResponse(
                    {
                        "success": False,
                        "message": "Too many failed attempts. Please request a new OTP.",
                    }
                )

            if otp_record.otp != otp:
                otp_record.attempts += 1
                otp_record.save()
                return JsonResponse({"success": False, "message": "Invalid OTP."})

            # OTP matched!
            otp_record.is_verified = True
            otp_record.save()

            # Create Customer safely
            customer, created = Customer.objects.get_or_create(
                phone_number=phone, defaults={"name": name}
            )
            if not created:
                return JsonResponse(
                    {"success": False, "message": "Customer already exists."}
                )

            return JsonResponse(
                {"success": True, "message": "Account created successfully!"}
            )

        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    return JsonResponse({"success": False, "message": "Invalid request method."})


@csrf_exempt
def login_api(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            phone = data.get("phone")
            name = data.get("name")

            if not phone or not name:
                return JsonResponse(
                    {"success": False, "message": "Name and phone are required."}
                )

            try:
                # Case insensitive name search is better for UX,
                # but let's check exact phone and iexact name
                customer = Customer.objects.get(phone_number=phone, name__iexact=name)

                # Success! Set persistent session
                request.session["customer_id"] = customer.id
                request.session["customer_name"] = customer.name

                return JsonResponse(
                    {
                        "success": True,
                        "message": "Logged in successfully",
                        "redirect_url": "/",
                    }
                )
            except ObjectDoesNotExist:
                return JsonResponse(
                    {"success": False, "message": "Name or Phone Number is incorrect."}
                )

        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    return JsonResponse({"success": False, "message": "Invalid request method."})


def logout_view(request):
    request.session.flush()
    logout(request)  # just in case django auth was used
    return redirect("home")
