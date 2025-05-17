
import uuid

from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.contrib.auth import get_user_model
from orders.models import Order
from django.db.models import Avg, Count

class UserManager(BaseUserManager):

    def create_user(self, username, email, password=None, phone_number=None, tax_code=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, phone_number=phone_number, tax_code=tax_code, **extra_fields)

        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)
        return self.create_user(username, email, password, **extra_fields)

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        CUSTOMER = 'customer', 'Customer'
        CONSTRUCTOR = 'constructor', 'Constructor'
        OPERATOR = 'operator', 'Operator'
    
    class AccountStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
    role = models.CharField(max_length=50, choices=Role.choices, default=Role.CUSTOMER)
    email_verified = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=15, blank=True, null=True)  
    tax_code = models.CharField(max_length=20, blank=True, null=True)
    company_name = models.CharField(max_length=255, blank=True, null=True)
    account_status = models.CharField(
        max_length=20, choices=AccountStatus.choices, default=AccountStatus.PENDING
    )
    # Số dư coin của người dùng
    coin_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    completed_orders_count = models.PositiveIntegerField(default=0)

    objects = UserManager()

    def is_email_verified(self):
        """No verified email required for admin and operator."""
        return self.email_verified or self.role in [self.Role.ADMIN, self.Role.OPERATOR]



    def __str__(self):
        return self.username
    
    def adjust_balance(self, amount):
        """
        Phương thức để điều chỉnh số dư coin.
        :param amount: Số coin cần cộng hoặc trừ (có thể âm hoặc dương).
        """
        self.coin_balance += amount
        self.save()

    def can_afford(self, amount):
        """
        Kiểm tra xem người dùng có đủ coin không.
        :param amount: Số coin cần kiểm tra.
        :return: True nếu có đủ coin, False nếu không đủ.
        """
        return self.coin_balance >= amount

class CompletedOrder(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name="completed_orders")
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    constructor = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name="completed_orders_as_constructor")
    completed_at = models.DateTimeField(auto_now_add=True)  # Time when the order was marked as completed

    def __str__(self):
        return f"Completed Order {self.order.id} by {self.user.username} for {self.constructor.username}"

