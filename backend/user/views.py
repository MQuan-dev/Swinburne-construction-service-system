import uuid, json 
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
from .models import User , CompletedOrder
from rest_framework.exceptions import ValidationError
from django.contrib.auth.hashers import make_password
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model ,update_session_auth_hash
from django.core.mail import send_mail
from django.conf import settings
from django.shortcuts import render
# Đây là phần thêm
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
# Đây là phần thêm
from .serializers import UserSerializer , UserStatsSerializer
from .permission import IsAdmin, IsOperator

from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from .serializers import (ChangePasswordSerializer, ResetPasswordSerializer, ConfirmResetPasswordSerializer , AddCoinSerializer  )
from rest_framework import generics, permissions
# Đây là phần thêm
from rest_framework.decorators import api_view, permission_classes
from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from .models import User
from orders.models import Order

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg, Count
from orders.models import OrderFeedback, Order
# Đây là phần thêm
import random
import string


User = get_user_model()
class RegisterCustomerAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        data = request.data

        required_fields = ["username", "email", "password"]
        for field in required_fields:
            if field not in data or not data[field]:
                raise ValidationError({field: f"{field} is required."})

        username = data["username"]
        email = data["email"]
        password = data["password"]

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already taken."}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exists():
            return Response({"error": "Email already registered."}, status=status.HTTP_400_BAD_REQUEST)

        # Tạo mã xác thực UUID
        verification_uuid = str(uuid.uuid4())

        # Lưu thông tin vào cache (tạm thời, chưa lưu vào database)
        cache.set(f"email_verification:{verification_uuid}", json.dumps({
            "username": username,
            "email": email,
            "password": make_password(password)  # Mã hóa mật khẩu trước khi lưu
        }), timeout=600)  # Hết hạn sau 10 phút

        # Gửi email xác thực
        verification_link = f"{settings.SITE_HOST}/api/v1/user/verify-email/{verification_uuid}/"
        send_mail(
            'Verify Your Email',
            f'Click the following link to verify your email: {verification_link}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )

        return Response({"message": "Verification email sent. Please check your email."}, status=status.HTTP_200_OK)


class VerifyEmailView(APIView):
    """
    API xác thực email và tạo tài khoản chính thức.
    """
    def get(self, request, verification_uuid):
        cache_key = f"email_verification:{verification_uuid}"
        user_data_json = cache.get(cache_key)

        if not user_data_json:
            return Response({"error": "Invalid or expired verification link."}, status=status.HTTP_400_BAD_REQUEST)

        user_data = json.loads(user_data_json)

        # Kiểm tra xem email đã tồn tại chưa (tránh trường hợp spam email xác thực)
        if User.objects.filter(email=user_data["email"]).exists():
            return Response({"error": "Email already verified and registered."}, status=status.HTTP_400_BAD_REQUEST)

        # Tạo tài khoản chính thức
        user = User.objects.create(
            username=user_data["username"],
            email=user_data["email"],
            password=user_data["password"],
            email_verified=True  # Đánh dấu đã xác thực
        )

        # Xóa dữ liệu cache sau khi xác thực
        cache.delete(cache_key)

        # Render template HTML
        context = {
            'message': 'Your email has been successfully verified!',
        }

        return render(request, 'email_verified.html', context)
    
class RegisterConstructorAPIView(APIView):
    """
    API view to register a new user.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        data = request.data

        required_fields = ["username", "email", "phone_number", "password", "tax_code", "company_name"]
        for field in required_fields:
            if field not in data or not data[field]:
                raise ValidationError({field: f"{field} is required."})

        username = data["username"]
        email = data["email"]
        phone_number = data["phone_number"]
        password = data["password"]
        tax_code = data["tax_code"]
        company_name = data["company_name"]

        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Username already taken."}, status=status.HTTP_400_BAD_REQUEST
            )
        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Email already registered."}, status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create(
            username=username,
            email=email,
            phone_number=phone_number,
            password=make_password(password),
            tax_code=tax_code,
            company_name=company_name,
            role=User.Role.CONSTRUCTOR,
            account_status=User.AccountStatus.PENDING
        )

        return Response(
            {"message": "User registered successfully, pending approval.", "user_id": user.id},
            status=status.HTTP_201_CREATED,
        )

class UserView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    def put(self, request):
        user = request.user
        data = request.data
        serializer = UserSerializer(user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Đây là phần thêm
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Thêm role vào token
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Nếu user là constructor và chưa được duyệt, chặn đăng nhập
        if self.user.role == User.Role.CONSTRUCTOR and self.user.account_status == User.AccountStatus.PENDING:
            raise ValidationError({"error": "Your account is pending approval. Please wait for an operator to approve."})
        
        data['role'] = self.user.role
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
# Đây là phần thêm
class RegisterOperatorAPIView(APIView):
    """
    API để Admin tạo tài khoản Operator (không thể chỉnh sửa).
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, *args, **kwargs):
        data = request.data

        required_fields = ["username", "email", "password"]
        for field in required_fields:
            if field not in data or not data[field]:
                return Response({field: f"{field} is required."}, status=status.HTTP_400_BAD_REQUEST)

        username = data["username"]
        email = data["email"]
        password = make_password(data["password"])

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already taken."}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exists():
            return Response({"error": "Email already registered."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = UserSerializer(data={
            "username": username,
            "email": email,
            "password": password,
            "role": User.Role.OPERATOR,
        })
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Operator registered successfully."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class OperatorListView(APIView):
    """
    API để Admin xem danh sách Operator mà họ đã tạo.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        operators = User.objects.filter(role=User.Role.OPERATOR)
        serializer = UserSerializer(operators, many=True)
        return Response(serializer.data)

class OperatorDeleteView(APIView):
    """
    API để Admin xoá Operator mà họ đã tạo.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def delete(self, request, operator_id):
        try:
            operator = User.objects.get(id=operator_id, role=User.Role.OPERATOR)
        except User.DoesNotExist:
            return Response({"error": "Operator not found or you don't have permission to delete."}, status=status.HTTP_404_NOT_FOUND)

        operator.delete()
        return Response({"message": "Operator deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
# Đây là phần thêm
class ApproveConstructorAPIView(APIView):
    """
    API để Operator xét duyệt Constructor.
    """
    permission_classes = [IsAuthenticated, IsOperator]

    def patch(self, request, constructor_id):
        try:
            constructor = User.objects.get(id=constructor_id, role=User.Role.CONSTRUCTOR, account_status=User.AccountStatus.PENDING)
        except User.DoesNotExist:
            return Response({"error": "Pending Constructor not found."}, status=status.HTTP_404_NOT_FOUND)

        constructor.account_status = User.AccountStatus.APPROVED
        constructor.save()

        return Response({"message": f"Constructor {constructor.username} approved successfully."}, status=status.HTTP_200_OK)
    

class PendingConstructorsListAPIView(APIView):
    """
    API để Operator xem danh sách Constructor chờ duyệt.
    """
    permission_classes = [IsAuthenticated, IsOperator]

    def get(self, request):
        pending_constructors = User.objects.filter(role=User.Role.CONSTRUCTOR, account_status=User.AccountStatus.PENDING)
        serializer = UserSerializer(pending_constructors, many=True)
        return Response(serializer.data)
# Đây là phần thêm
class ViewProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({"data": serializer.data})

class ChangePasswordView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = ChangePasswordSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        """Handle password change"""
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        self.get_object().set_password(serializer.validated_data['new_password'])
        self.get_object().save()
        return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)

class ResetPasswordView(APIView):
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.filter(email=email).first()
            if user:
                # Tạo mật khẩu ngẫu nhiên (10 ký tự gồm chữ cái và số)
                new_password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
                # Cập nhật mật khẩu của người dùng trong database
                user.set_password(new_password)
                user.save()
                # Gửi email chứa mật khẩu ngẫu nhiên
                send_mail(
                    "Your New Password",
                    f"Your new password is: {new_password}\nPlease log in and change your password immediately.",
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )
                return Response(
                    {"message": "A new password has been sent to your email. Please check your inbox and change your password after logging in."},
                    status=status.HTTP_200_OK
                )
            return Response({"error": "This email is not registered!"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
# Đây là phần thêm
@api_view(["GET"])
@permission_classes([IsAuthenticated])  # Chỉ cho phép user đã đăng nhập (qua token)
def list_users_by_role(request, role):
    """
    Admin: View user list by role.
    Operator: Can only view customers and constructors.
    """
    if request.user.role == "admin":
        users = User.objects.filter(role=role)
    elif request.user.role == "operator":
        if role in ["customer", "constructor"]:
            users = User.objects.filter(role=role)
        else:
            raise PermissionDenied("Operator is not allowed to view this role.")
    else:
        raise PermissionDenied("You do not have permission to view this list.")

    user_data = [{"id": u.id, "name": u.username} for u in users]
    return Response({"users": user_data})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def view_profile(request, user_id):
    """
    View a user's profile with full data.
    - Admin & Operator can view profiles based on their permissions.
    - Customers & Constructors can only view each other after the customer has chosen the constructor.
    """
    user_to_view = get_object_or_404(User, id=user_id)

    if request.user.role in ["admin", "operator"]:
        if request.user.role == "operator" and user_to_view.role not in ["customer", "constructor"]:
            raise PermissionDenied("Operator can only view customers and constructors.")
    elif request.user.role in ["customer", "constructor"]:
        order_exists = Order.objects.filter(
            user=request.user if request.user.role == "customer" else user_to_view,
            constructor=user_to_view if request.user.role == "customer" else request.user,
            status="constructor_selected"
        ).exists()

        if not order_exists:
            raise PermissionDenied("You do not have permission to view this profile.")
    else:
        raise PermissionDenied("You do not have permission to access this profile.")

    profile_data = {
        field.name: getattr(user_to_view, field.name) for field in User._meta.fields
    }

    return Response({"profile": profile_data})

@receiver(post_save, sender=Order)
def update_completed_orders(sender, instance, created, **kwargs):
    if instance.status == "completed":
        # Create a new CompletedOrder record
        CompletedOrder.objects.create(
            user=instance.user,
            order=instance,
            constructor=instance.constructor,
            completed_at=instance.updated_at  # Or use the time when the order was marked as complete
        )

        # Recalculate completed order count for the user
        user_completed_orders_count = CompletedOrder.objects.filter(user=instance.user).count()
        print(f"[DEBUG] Before Update - User {instance.user.id} - Completed Orders Count: {user_completed_orders_count}")  # Print to debug
        instance.user.completed_orders_count = user_completed_orders_count
        instance.user.save()

        constructor_completed_orders_count = CompletedOrder.objects.filter(constructor=instance.constructor).count()
        print(f"[DEBUG] Before Update - Constructor {instance.constructor.id} - Completed Orders Count: {constructor_completed_orders_count}")  # Print to debug
        instance.constructor.completed_orders_count = constructor_completed_orders_count
        instance.constructor.save()  # Ensure the constructor object is saved with the updated count
        print(f"[DEBUG] After Update - Constructor {instance.constructor.id} - Completed Orders Count: {instance.constructor.completed_orders_count}")  # Print to debug
        # Calculate the average rating based on feedback (only if there are ratings)
        feedbacks = OrderFeedback.objects.filter(order=instance)
        if feedbacks.exists():  # Only update if there are ratings
            avg_rating = feedbacks.aggregate(Avg('rating'))['rating__avg']
            instance.user.average_rating = avg_rating if avg_rating else None
            instance.user.save()

        print(f"[DEBUG] Updated User {instance.user.id} - Completed Orders: {user_completed_orders_count}, Average Rating: {instance.user.average_rating}")
        if instance.constructor:
            print(f"[DEBUG] Updated Constructor {instance.constructor.id} - Completed Orders: {constructor_completed_orders_count}")


@receiver(post_save, sender=OrderFeedback)
def update_rating_on_feedback(sender, instance, created, **kwargs):
    # Only update the rating if feedback exists
    user = instance.recipient
    feedbacks = OrderFeedback.objects.filter(recipient=user)

    if feedbacks.exists():  # Only calculate if there are feedbacks
        avg_rating = feedbacks.aggregate(Avg('rating'))['rating__avg']
        user.average_rating = avg_rating if avg_rating else None  # Don't set 0.00 if no feedback
        user.save()

    # Do not overwrite completed_orders_count when feedback is created
    print(f"[DEBUG] Completed Orders Count (User - before feedback): {user.completed_orders_count}")  # Print for debugging

    # We leave completed_orders_count intact as we shouldn't modify it during feedback creation
    print(f"[DEBUG] Completed Orders Count (User - after feedback): {user.completed_orders_count}")  # Print for debugging

    print(f"[DEBUG] Completed Orders Count (User): {user.completed_orders_count}")  # Final check

@receiver(post_delete, sender=OrderFeedback)
def update_rating_on_feedback_delete(sender, instance, **kwargs):
    user = instance.recipient
    feedbacks = OrderFeedback.objects.filter(recipient=user)

    if feedbacks.exists():  # Only update if there are feedbacks left
        avg_rating = feedbacks.aggregate(Avg('rating'))['rating__avg']
        user.average_rating = avg_rating if avg_rating else None  # Don't set 0.00 if no feedback
        user.save()

    # Recalculate the completed order count for the user (same as before, don't modify it unnecessarily)
    print(f"[DEBUG] Completed Orders Count (User - before delete): {user.completed_orders_count}")  # Print for debugging
    user.save()

    print(f"[DEBUG] Completed Orders Count (User - after delete): {user.completed_orders_count}")  # Print for debugging
    print(f"[DEBUG] Completed Orders Count (User): {user.completed_orders_count}")  # Final check
# Đây là phần thêm
class UpdateProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Profile updated successfully.",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AddCoinView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, user_id):
        serializer = AddCoinSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        amount = serializer.validated_data['amount']
        
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        
        # Cộng coin cho user (sử dụng phương thức adjust_balance đã định nghĩa)
        user.adjust_balance(amount)
        
        # Nếu bạn muốn ghi nhận giao dịch coin thì có thể tạo một bản ghi CoinTransaction tại đây
        
        return Response({
            "message": f"Added {amount} coin to user {user.username}.",
            "new_balance": str(user.coin_balance)
        }, status=status.HTTP_200_OK)