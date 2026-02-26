from django.db import models
from django.utils import timezone


class Customer(models.Model):
    name = models.CharField(max_length=255, unique=True, null=True, blank=True)
    phone = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.email} - {self.name}"


class Address(models.Model):
    customer = models.OneToOneField(
        Customer, on_delete=models.CASCADE, related_name="address"
    )
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20)
    address_type = models.CharField(
        max_length=20,
        choices=[("Home", "Home"), ("Office", "Office"), ("Other", "Other")],
        default="Home",
    )
    full_address = models.TextField()
    pincode = models.CharField(max_length=10)

    def __str__(self):
        return f"{self.full_name} ({self.address_type})"
