from django.db import models
from django.conf import settings
from datetime import timedelta
from django.utils import timezone
from django.utils.timezone import now
from django.core.exceptions import ValidationError
from category.models import Category
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

def default_expiration_date():
    return now() + timedelta(days=7)

def validate_file_extension(value):
    """ Kiểm tra file đính kèm có định dạng hợp lệ """
    valid_extensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.png', '.jpeg']
    if not any(value.lower().endswith(ext) for ext in valid_extensions):
        raise ValidationError("Invalid file format. Only PDF, DOC, XLS, JPG, PNG are allowed.")

class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('constructor_selected', 'Constructor Selected'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    # Liên kết với Category (SubCategory nằm trong name của Category)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    constructor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_orders')

    # Trạng thái xác nhận hoàn thành công việc
    user_confirmed = models.BooleanField(default=False)
    constructor_confirmed = models.BooleanField(default=False)

    # Phí khi tạo đơn và gửi báo giá
    user_fee = models.DecimalField(max_digits=10, decimal_places=2, default=100.00)
    constructor_fee = models.DecimalField(max_digits=10, decimal_places=2, default=100.00)

    expired_at = models.DateTimeField(default=default_expiration_date)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    incomeCoin = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    outcomeCoin = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    remainCoin = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        category_name = self.category.name if self.category else "No Category"
        return f"Order #{self.id} - {category_name} - {self.status}"
    

class OrderFile(models.Model):
    """ Lưu file đính kèm cho mỗi Order """
    
    order = models.ForeignKey(Order, related_name="files", on_delete=models.CASCADE)
    file = models.FileField(upload_to='order_files/')  # Use FileField to store actual files
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"File for Order {self.order.id} - {self.file.url}"


class QuotationInfo(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('cancelled_by_customer', 'Cancelled by Customer'),
    )

    constructor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quotations') 
    message = models.TextField()
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    warranty_days = models.PositiveIntegerField(default=30)
    created_at = models.DateTimeField(auto_now_add=True)
    is_saved = models.BooleanField(default=False)
    is_notified = models.BooleanField(default=False)  # ✅ Constructor xác nhận đã xem thông báo bị rejected

    def __str__(self):
        return f"QuotationInfo #{self.id} - {self.status}"

class QuotationFile(models.Model):
    """ Lưu file đính kèm cho mỗi báo giá """
    
    quotation = models.ForeignKey(QuotationInfo, related_name="files", on_delete=models.CASCADE)
    file = models.FileField(upload_to='quotation_files/', validators=[validate_file_extension])  # Lưu file đính kèm
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"File for Quotation {self.quotation.id} - {self.file.name}"

class QuotationOrderMapping(models.Model):
    """ Mapping giữa QuotationInfo và Order (Một báo giá có thể gửi cho nhiều order) """

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='quotation_mappings')
    quotation = models.ForeignKey(QuotationInfo, on_delete=models.CASCADE, related_name='quotation_mappings')
    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Quotation {self.quotation.id} -> Order {self.order.id}"


class OrderContractMappingByUser(models.Model):
    """
    Model lưu hợp đồng do User ký.
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    order = models.ForeignKey(
        "orders.Order", on_delete=models.CASCADE, related_name="user_contracts" , null=True
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="signed_user_contracts" , null=True, blank=True
    )
    contract_file = models.FileField(upload_to="contracts/user/")
    uploaded_date = models.DateTimeField(auto_now_add=True)  # Đổi từ uploaded_at thành uploaded_date
    approved_date = models.DateTimeField(null=True, blank=True)  # Thêm trường approved_date để lưu thời gian approve hợp đồng
    contract_money = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)  # Thêm trường contract_money
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='pending'
    )

    def __str__(self):
        return f"User Contract for Order {self.order.id} - {self.status}"

class OrderContractMappingByConstructor(models.Model):
    """
    Model lưu hợp đồng do Constructor ký.
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    order = models.ForeignKey(
        "orders.Order", on_delete=models.CASCADE, related_name="constructor_contracts" , null=True
    )
    constructor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="signed_constructor_contracts" , null=True
    )
    contract_file = models.FileField(upload_to="contracts/constructor/")
    uploaded_date = models.DateTimeField(auto_now_add=True)  # Đổi từ uploaded_at thành uploaded_date
    approved_date = models.DateTimeField(null=True, blank=True)  # Thêm trường approved_date để lưu thời gian approve hợp đồng
    contract_money = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)  # Thêm trường contract_money
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='pending'
    )

    def __str__(self):
        return f"Constructor Contract for Order {self.order.id} - {self.status}"
    
class OurQuotation(models.Model):
    category = models.OneToOneField(
        Category, on_delete=models.CASCADE, related_name="quotation_fee"
    )
    user_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    constructor_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    user_refund = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    constructor_refund = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)


    def __str__(self):
        return f"Fees for {self.category.name} - User Fee: {self.user_fee}, Constructor Fee: {self.constructor_fee}"

@receiver(post_save, sender=Category)
def create_quotation_for_category(sender, instance, created, **kwargs):
    """
    Tự động tạo OurQuotation khi có Category mới
    """
    if created:
        OurQuotation.objects.create(category=instance, user_fee=0.00, constructor_fee=0.00)

@receiver(post_delete, sender=Category)
def delete_quotation_for_category(sender, instance, **kwargs):
    """
    Tự động xóa OurQuotation khi Category bị xóa
    """
    OurQuotation.objects.filter(category=instance).delete()

class OrderFeedback(models.Model):
    """
    Model lưu trữ feedback và rating giữa User và Constructor.
    """
    order = models.ForeignKey(
        "orders.Order", on_delete=models.CASCADE, related_name="feedbacks"
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="given_feedbacks"
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_feedbacks"
    )
    rating = models.PositiveIntegerField(default=5)  # Rating từ 1 đến 5
    feedback = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("order", "reviewer")  # Một reviewer chỉ đánh giá 1 lần trên một order

    def __str__(self):
        return f"Feedback from {self.reviewer.username} to {self.recipient.username} - Rating: {self.rating}"
    
class CoinTransaction(models.Model):
    TRANSACTION_TYPES = (
        ('deduction', 'Deduction'),
        ('refund', 'Refund'),
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='coin_transactions'
    )
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(default=timezone.now)
    # Nếu giao dịch liên quan tới một order (có thể null)
    order = models.ForeignKey(
        'orders.Order', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='coin_transactions'
    )
    description = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_transaction_type_display()} {self.amount} at {self.timestamp}"
