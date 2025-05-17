from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from django.db.models import Q
from user.permission import IsOperator , IsAdmin
from django.shortcuts import get_object_or_404
from django.utils.timezone import now
from decimal import Decimal
from category.models import Category
from .models import (Order, QuotationInfo, QuotationOrderMapping , QuotationFile ,OrderFile ,
                      OrderContractMappingByUser, OrderContractMappingByConstructor , OurQuotation ,OrderFeedback ,CoinTransaction,
                       OurQuotation )
from .serializers import (
    OrderSerializer, QuotationInfoSerializer,
    QuotationOrderMappingSerializer, RequestSerializer , QuotationFileSerializer ,
    OrderContractByUserSerializer, OrderContractByConstructorSerializer ,OrderFeedbackSerializer ,CoinTransactionSerializer,
    OurQuotationSerializer
)
from user.permission import IsAdmin
from django.db.models import Sum
from django.db.models.functions import TruncDay, TruncMonth, TruncYear
from django.db.models import Count
from django.utils import timezone
import calendar


class CreateRequestView(APIView):
    """
    API để tạo yêu cầu (service, material, v.v.).
    """
    permission_classes = [IsAuthenticated]


    def post(self, request, *args, **kwargs):


        title = request.data.get('title')
        description = request.data.get('description')
        category_id = request.data.get('category_id')  # Lấy category_id từ request
        constructor = request.data.get('constructor', None)


        # Kiểm tra category_id có hợp lệ không
        if not category_id:
            return Response({"error": "Category ID is required."}, status=status.HTTP_400_BAD_REQUEST)


        try:
            category = Category.objects.get(id=int(category_id))  # Ép kiểu category_id thành int
        except (Category.DoesNotExist, ValueError):
            return Response({"error": "Invalid category ID."}, status=status.HTTP_400_BAD_REQUEST)


        # 🔥 **Lấy phí từ bảng OurQuotation**
        quotation = OurQuotation.objects.get(category=category)  # ✅ Chắc chắn tồn tại do trigger ở Bước 1


        user_fee = quotation.user_fee
        constructor_fee = quotation.constructor_fee


        # Kiểm tra số dư của user
        if request.user.coin_balance < user_fee:
            return Response({"error": "Insufficient balance to create order."}, status=status.HTTP_400_BAD_REQUEST)


        # Trừ coin từ tài khoản user
        request.user.coin_balance -= user_fee
        request.user.save()


        # Tạo order
        order_instance = Order.objects.create(
            title=title,
            description=description,
            category=category,
            user=request.user,
            user_fee=user_fee,
            constructor_fee=constructor_fee,
            incomeCoin=user_fee,
            outcomeCoin=0.00,
            remainCoin=user_fee
        )


        # Ghi nhận giao dịch trừ coin cho việc tạo order
        CoinTransaction.objects.create(
            user=request.user,
            transaction_type='deduction',
            amount=user_fee,
            order=order_instance,
            description="Coin deduction for creating order"
        )


        # ✅ Truyền object thay vì dictionary vào serializer
        request_serializer = OrderSerializer(order_instance, context={'request': request})


        # Xử lý file đính kèm
        files = request.FILES.getlist('order_files')
        for file in files:
            OrderFile.objects.create(order=order_instance, file=file)


        return Response({
            "message": "Order created successfully!",
            "data": request_serializer.data
        }, status=status.HTTP_201_CREATED)


class OrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet để quản lý tất cả các loại order (Service, Material, v.v.).
    """
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]


    def get_queryset(self):
        user = self.request.user
        category = self.request.query_params.get('category', None)
        queryset = Order.objects.all()  


        if category:
            queryset = queryset.filter(category=category)


        # ✅ Operator can view all orders
        if user.role == "operator":
            return queryset


        # ✅ Customer only sees their own orders
        if user.role == "customer":
            return queryset.filter(user=user)


        # ✅ Constructor logic for fetching orders
        if user.role == "constructor":


            # 🟢 Fetch all orders where the constructor is involved in any way
            queryset = queryset.filter(
                Q(status="pending") |  # Orders that are pending
                Q(quotation_mappings__quotation__constructor=user) |  # Orders where the constructor has submitted a quotation
                Q(status="constructor_selected", constructor=user) |  # Orders where constructor is selected
                Q(status="in_progress", constructor=user) |  # Orders in progress
                Q(status="completed", constructor=user)  # Completed orders
            ).distinct()


            # 🟢 Exclude **only** rejected quotations where the constructor has confirmed rejection
            rejected_orders = QuotationInfo.objects.filter(
                constructor=user, status="rejected", is_notified=True
            ).values_list("quotation_mappings__order", flat=True)


            queryset = queryset.exclude(id__in=rejected_orders)




            # 🔥 Update order status dynamically based on the constructor's quotation
            for order in queryset:
                quotation = QuotationInfo.objects.filter(
                    quotation_mappings__order=order,
                    constructor=user
                ).first()
                if quotation:
                    order.status = quotation.status  # ✅ Update order status dynamically
            return queryset


        return queryset.none()




    @action(detail=True, methods=['get'])
    def quotations(self, request, pk=None):
        """
        Lấy danh sách báo giá liên quan đến order.
        """
        order_instance = self.get_object()
        user = request.user


        # ✅ Operator có thể xem tất cả báo giá của order
        if user.role == "operator":
            quotations = QuotationInfo.objects.filter(quotation_mappings__order=order_instance)
            serializer = QuotationInfoSerializer(quotations, many=True)
            return Response(serializer.data)


        # ✅ Customer chỉ xem báo giá trên order của chính mình
        if user.role == "customer":
            if order_instance.user != user:
                raise PermissionDenied("You can only view quotations for your own orders.")
            quotations = QuotationInfo.objects.filter(quotation_mappings__order=order_instance)
            serializer = QuotationInfoSerializer(quotations, many=True)
            return Response(serializer.data)


        # ✅ Constructor chỉ xem báo giá mà họ đã gửi vào order này
        if user.role == "constructor":
            quotations = QuotationInfo.objects.filter(
                quotation_mappings__order=order_instance,
                constructor=user
            )
            serializer = QuotationInfoSerializer(quotations, many=True)
            return Response(serializer.data)


        return Response({"error": "You do not have permission to view quotations."}, status=status.HTTP_403_FORBIDDEN)


    @action(detail=True, methods=['post'])
    def submit_quotation(self, request, pk=None):
        """
        Constructor submits a new quotation or selects a saved quotation.
        """
        order_instance = self.get_object()


        # Kiểm tra trạng thái đơn hàng
        if order_instance.status != "pending":
            return Response({"error": "Cannot quote on a non-pending order."}, status=status.HTTP_400_BAD_REQUEST)


        # Kiểm tra nếu constructor đã gửi báo giá
        if QuotationOrderMapping.objects.filter(order=order_instance, quotation__constructor=request.user).exists():
            return Response({"error": "You have already submitted a quotation for this order."}, status=status.HTTP_400_BAD_REQUEST)


        # 🔥 **Lấy constructor_fee từ order**
        constructor_fee = order_instance.constructor_fee


        # Kiểm tra số dư của constructor
        if request.user.coin_balance < constructor_fee:
            return Response({"error": "Insufficient balance to submit quotation."}, status=status.HTTP_400_BAD_REQUEST)


        # Trừ coin từ constructor
        request.user.coin_balance -= constructor_fee
        request.user.save()


        # Ghi nhận giao dịch trừ coin cho việc tạo order
        CoinTransaction.objects.create(
            user=request.user,
            transaction_type='deduction',
            amount=constructor_fee,
            order=order_instance,
            description="Coin deduction for submit quotation"
        )


        # Cộng constructor_fee vào incomeCoin (coin spent của constructor)
        order_instance.incomeCoin += constructor_fee
        order_instance.remainCoin = order_instance.incomeCoin - order_instance.outcomeCoin
        order_instance.save()


        # Xử lý dữ liệu báo giá
        data = request.data.copy()
        use_saved_quotation = data.get('use_saved_quotation', False)


        if use_saved_quotation:
            quotation_id = data.get('quotation_id')
            if not quotation_id:
                return Response({"error": "Quotation ID is required."}, status=status.HTTP_400_BAD_REQUEST)


            try:
                saved_quotation = QuotationInfo.objects.get(id=quotation_id, constructor=request.user, status='saved')
            except QuotationInfo.DoesNotExist:
                return Response({"error": "Saved quotation not found."}, status=status.HTTP_404_NOT_FOUND)


            QuotationOrderMapping.objects.create(order=order_instance, quotation=saved_quotation)
            return Response({"message": "Saved quotation submitted successfully."}, status=status.HTTP_201_CREATED)
        else:
            data['constructor'] = request.user.id
            serializer = QuotationInfoSerializer(data=data)
            if serializer.is_valid():
                quotation = serializer.save(is_saved=False, constructor=request.user)


                files = request.FILES.getlist('quotation_files')
                for file in files:
                    QuotationFile.objects.create(quotation=quotation, file=file)


                QuotationOrderMapping.objects.create(order=order_instance, quotation=quotation)
                return Response(serializer.data, status=status.HTTP_201_CREATED)


            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    @action(detail=True, methods=['post'], url_path='quotations/(?P<quotation_id>[^/.]+)/select')
    def select_quotation(self, request, pk=None, quotation_id=None):
        """
        Chọn báo giá tốt nhất cho order.
        """
        order_instance = self.get_object()


        if order_instance.user != request.user:
            raise PermissionDenied("You can only select a constructor for your own order.")


        try:
            quotation = QuotationInfo.objects.get(pk=quotation_id, quotation_mappings__order=order_instance)
        except QuotationInfo.DoesNotExist:
            return Response({"error": "Quotation not found for this order."}, status=status.HTTP_404_NOT_FOUND)




        # Ensure the quotation is in the 'pending' status
        if quotation.status != 'pending':
            return Response({"error": "Quotation must be in pending status to be selected."}, status=status.HTTP_400_BAD_REQUEST)


        # Reject all other quotations
        QuotationInfo.objects.filter(
            quotation_mappings__order=order_instance
        ).exclude(id=quotation.id).update(status="rejected")


        # Mark the selected quotation as accepted
        quotation.status = "accepted"
        quotation.save()


        # Set the order status to "constructor_selected" and link the selected constructor
        order_instance.status = "constructor_selected"
        order_instance.constructor = quotation.constructor
        order_instance.save()




        return Response({
            "message": "Constructor selected successfully.",
            "order_status": order_instance.status
        }, status=status.HTTP_200_OK)






    def retrieve(self, request, *args, **kwargs):
        """
        Lấy chi tiết order, bao gồm danh sách báo giá liên quan.
        """
        instance = self.get_object()
        user = request.user


        # ✅ Operator có quyền xem tất cả orders và tất cả quotations của order đó
        if user.role == "operator":
            quotations = QuotationInfo.objects.filter(quotation_mappings__order=instance)


        # ✅ Customer chỉ xem order của chính họ, đồng thời thấy tất cả quotations của order
        elif user.role == "customer":
            if instance.user != user:
                raise PermissionDenied("You can only view your own orders.")
            quotations = QuotationInfo.objects.filter(quotation_mappings__order=instance)


        # ✅ Constructor chỉ thấy order có accepted hoặc rejected, không còn thấy constructor_selected
        elif user.role == "constructor":
            quotation = QuotationInfo.objects.filter(
                quotation_mappings__order=instance,
                constructor=user
            ).first()


            if quotation:
                instance.status = quotation.status  # ✅ Gán lại status để trả về "accepted" hoặc "rejected"


            quotations = QuotationInfo.objects.filter(
                quotation_mappings__order=instance,
                constructor=user
            )


        else:
            raise PermissionDenied("You do not have permission to view this order.")


        # ✅ Serialize order và quotations
        response_data = self.get_serializer(instance, context={'request': request}).data
        response_data["quotations"] = QuotationInfoSerializer(quotations, many=True).data
        response_data["user_username"] = instance.user.username
        response_data["constructor_username"] = instance.constructor.username if instance.constructor else None
        return Response(response_data)




    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Hủy order.
        """
        instance = self.get_object()


        if instance.status != "pending":
            return Response({"error": "Only pending orders can be cancelled."}, status=status.HTTP_400_BAD_REQUEST)
        if instance.user != request.user:
            raise PermissionDenied("You can only cancel your own orders.")


        instance.status = "cancelled"
        instance.save()


        QuotationInfo.objects.filter(quotation_mappings__order=instance).update(status="cancelled_by_customer")


        return Response({"message": "Order cancelled successfully."}, status=status.HTTP_200_OK)
   
    @action(detail=True, methods=['post'], url_path='confirm-rejection')
    def confirm_rejection(self, request, pk=None):
        """
        Constructor confirms rejection of an order. Once confirmed, the order will no longer be visible.
        """
        order_instance = self.get_object()
        user = request.user


        # Ensure only constructor can confirm rejection
        if user.role != "constructor":
            return Response({"error": "Only constructors can confirm rejection."}, status=status.HTTP_403_FORBIDDEN)


        # Find the quotation related to this order
        quotation = QuotationInfo.objects.filter(
            quotation_mappings__order=order_instance,
            constructor=user,
            status="rejected"
        ).first()


        if not quotation:
            return Response({"error": "No rejected quotation found for this order."}, status=status.HTTP_404_NOT_FOUND)


        # Mark the quotation as notified
        quotation.is_notified = True
        quotation.save()


        return Response({"message": "Rejection confirmed. The order will no longer be visible to you."}, status=status.HTTP_200_OK)






    @action(detail=True, methods=['get'], url_path="contracts")
    def get_contracts(self, request, pk=None):
        """
        Retrieve contracts for a specific order.
        """
        order = get_object_or_404(Order, id=pk)


        if order.user != request.user and order.constructor != request.user and request.user.role != "operator":
            return Response({"error": "You do not have permission to view these contracts."}, status=403)


        # ✅ Constructor bị rejected không thể xem contract
        quotation = QuotationInfo.objects.filter(quotation_mappings__order=order, constructor=request.user).first()
        if request.user.role == "constructor" and quotation and quotation.status == "rejected":
            return Response({"error": "You cannot view contracts for rejected orders."}, status=403)


        user_contract = OrderContractMappingByUser.objects.filter(order=order).first()
        constructor_contract = OrderContractMappingByConstructor.objects.filter(order=order).first()


        return Response({
            "user_contract": OrderContractByUserSerializer(user_contract).data if user_contract else None,
            "constructor_contract": OrderContractByConstructorSerializer(constructor_contract).data if constructor_contract else None
        })


    @action(detail=True, methods=['post'], url_path="contracts/user/upload")
    def upload_user_contract(self, request, pk=None):
        """User uploads a contract for a specific order."""
        order = self.get_object()


        # Kiểm tra xem User đã tải hợp đồng chưa
        if OrderContractMappingByUser.objects.filter(order=order, user=request.user).exists():
            return Response({"error": "You have already uploaded a contract for this order."},
                            status=status.HTTP_400_BAD_REQUEST)
        if order.user != request.user:
            raise PermissionDenied("You can only upload a contract for your own order.")


        contract_file = request.FILES.get("contract_file")
        contract_money = request.data.get('contract_money')
        if not contract_file:
            return Response({"error": "Contract file is required."}, status=status.HTTP_400_BAD_REQUEST)


        # Sử dụng update_or_create: nếu mới tạo (created==True) thì mới thực hiện refund
        contract, created = OrderContractMappingByUser.objects.update_or_create(
            order=order,
            user=request.user,
            defaults={"contract_file": contract_file, "contract_money": contract_money, "status": "pending"}
        )


        # Nếu contract được tạo mới, thực hiện hoàn coin cho User
        if created:
            try:
                our_quotation = OurQuotation.objects.get(category=order.category)
            except OurQuotation.DoesNotExist:
                return Response({"error": "OurQuotation for this category not found."},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            refund_amount = our_quotation.user_refund
            order.user.coin_balance += refund_amount
            order.user.save()
            # Ghi nhận giao dịch refund
            CoinTransaction.objects.create(
                user=order.user,
                transaction_type='refund',
                amount=refund_amount,
                order=order,
                description="Refund on contract upload (user)"
            )


        return Response({
            "message": "User contract uploaded successfully!",
            "contract_id": contract.id,
            "file_url": contract.contract_file.url
        }, status=status.HTTP_201_CREATED)




    # --- Upload contract của Constructor ---
    @action(detail=True, methods=['post'], url_path="contracts/constructor/upload")
    def upload_constructor_contract(self, request, pk=None):
        """Constructor uploads a contract for a specific order."""
        order = self.get_object()


        # Kiểm tra xem Constructor đã tải hợp đồng chưa
        if OrderContractMappingByConstructor.objects.filter(order=order, constructor=request.user).exists():
            return Response({"error": "You have already uploaded a contract for this order."},
                            status=status.HTTP_400_BAD_REQUEST)
        if order.constructor != request.user:
            raise PermissionDenied("You can only upload a contract for your assigned order.")


        contract_file = request.FILES.get("contract_file")
        contract_money = request.data.get('contract_money')
        if not contract_file:
            return Response({"error": "Contract file is required."}, status=status.HTTP_400_BAD_REQUEST)


        contract, created = OrderContractMappingByConstructor.objects.update_or_create(
            order=order,
            constructor=request.user,
            defaults={"contract_file": contract_file, "contract_money": contract_money, "status": "pending"}
        )


        # Nếu contract được tạo mới, hoàn coin cho Constructor theo giá trị trong OurQuotation
        if created:
            try:
                our_quotation = OurQuotation.objects.get(category=order.category)
            except OurQuotation.DoesNotExist:
                return Response({"error": "OurQuotation for this category not found."},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            refund_amount = our_quotation.constructor_refund
            order.constructor.coin_balance += refund_amount
            order.constructor.save()
            CoinTransaction.objects.create(
                user=order.constructor,
                transaction_type='refund',
                amount=refund_amount,
                order=order,
                description="Refund on contract upload (constructor)"
            )


        return Response({
            "message": "Constructor contract uploaded successfully!",
            "contract_id": contract.id,
            "file_url": contract.contract_file.url
        }, status=status.HTTP_201_CREATED)


    # Action để duyệt hợp đồng của User và Constructor (đổi trạng thái order sang in_progress)
    @action(detail=True, methods=['post'], url_path="contracts/approve")
    def approve_contracts(self, request, pk=None):
        """
        Operator approves both contracts and marks the order as 'in_progress'.
        """
        if request.user.role != "operator":
            return Response({"error": "You do not have permission to approve contracts."}, status=status.HTTP_403_FORBIDDEN)


        order = get_object_or_404(Order, pk=pk)


        user_contract = OrderContractMappingByUser.objects.filter(order=order).first()
        constructor_contract = OrderContractMappingByConstructor.objects.filter(order=order).first()


        if not user_contract or not constructor_contract:
            return Response({"error": "Both user and constructor contracts must be uploaded."}, status=status.HTTP_400_BAD_REQUEST)


        if user_contract.status == "approved" and constructor_contract.status == "approved":
            return Response({"error": "This contract has already been approved."}, status=status.HTTP_400_BAD_REQUEST)


        # Approve contracts if pending
        if user_contract.status == "pending":
            user_contract.status = "approved"
            user_contract.approved_date = now()
            user_contract.save()


        if constructor_contract.status == "pending":
            constructor_contract.status = "approved"
            constructor_contract.approved_date = now()
            constructor_contract.save()


        # Refund 50% fee to both parties
        refund_amount_user = order.category.quotation_fee.user_refund
        refund_amount_constructor = order.category.quotation_fee.constructor_refund


        order.user.coin_balance += refund_amount_user
        order.user.save()
       
        order.constructor.coin_balance += refund_amount_constructor
        order.constructor.save()


        # Ghi nhận giao dịch refund cho user
        CoinTransaction.objects.create(
            user=order.user,
            transaction_type='refund',
            amount=refund_amount_user,
            order=order,
            description="Refund after contract approval (user)"
        )
        # Ghi nhận giao dịch refund cho constructor
        CoinTransaction.objects.create(
            user=order.constructor,
            transaction_type='refund',
            amount=refund_amount_constructor,
            order=order,
            description="Refund after contract approval (constructor)"
        )


        # Cộng tổng refund vào outcomeCoin (coin refund là outcome của admin)
        total_refund = refund_amount_user + refund_amount_constructor
        order.outcomeCoin += total_refund
        order.remainCoin = order.incomeCoin - order.outcomeCoin


        # Force update order status to "in_progress" if it is currently "constructor_selected" or "accepted"
        if order.status in ["constructor_selected", "accepted"]:
            order.status = "in_progress"
            order.save()


        # Refresh the order object to ensure latest DB value is used
        order.refresh_from_db()
        return Response({
            "message": "Both contracts approved. Order is now in progress.",
            "order_status": order.status,
            "refunds": {
                "user_refund": refund_amount_user,
                "constructor_refund": refund_amount_constructor
            }
        }, status=status.HTTP_200_OK)


    @action(detail=True, methods=['post'], url_path="contracts/cancel")
    def cancel_contract(self, request, pk=None):
        """
        Operator cancels the contract if the contract_money values do not match or for any other reason.
        When cancelled, both the customer and constructor must resubmit the contract.
        Only when the contract is later approved, can the order proceed to the next step.
        """
        order = get_object_or_404(Order, pk=pk)


        user_contract = OrderContractMappingByUser.objects.filter(order=order).first()
        constructor_contract = OrderContractMappingByConstructor.objects.filter(order=order).first()


        if not user_contract or not constructor_contract:
            return Response(
                {"error": "Both customer and constructor contracts must be submitted."},
                status=status.HTTP_400_BAD_REQUEST
            )


        # Cancel both contracts
        user_contract.delete()
        constructor_contract.delete()


        return Response(
            {"message": "Contract cancelled by operator. Both parties must resubmit the contract."},
            status=status.HTTP_200_OK
        )
   


    @action(detail=True, methods=['post'], url_path="confirm-completion")
    def confirm_completion(self, request, pk=None):
        """
        User hoặc Constructor xác nhận đã hoàn thành công việc.
        Khi cả hai bên xác nhận, trạng thái order sẽ chuyển sang "completed".
        Đồng thời, hệ thống sẽ hoàn coin cho cả hai bên dựa trên refund trong OurQuotation.
        Lưu ý: Chỉ khi cả hai bên xác nhận, refund sẽ được thực hiện.
        """
        order = self.get_object()
        user = request.user


        if order.status != "in_progress":
            return Response({"error": "Order must be in progress to confirm completion."},
                            status=status.HTTP_400_BAD_REQUEST)


        if user == order.user:
            order.user_confirmed = True
            order.save()
        elif user == order.constructor:
            order.constructor_confirmed = True
            order.save()
        else:
            raise PermissionDenied("You are not authorized to confirm this order.")


        if order.user_confirmed and order.constructor_confirmed:
            order.status = "completed"
            order.save()


            # Lấy refund từ OurQuotation dựa trên category của order
            try:
                our_quotation = OurQuotation.objects.get(category=order.category)
            except OurQuotation.DoesNotExist:
                return Response({"error": "OurQuotation for this category not found."},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)


            refund_amount_user = our_quotation.user_refund
            refund_amount_constructor = our_quotation.constructor_refund


            # Cộng refund vào số dư của user và constructor
            order.user.coin_balance += refund_amount_user
            order.user.save()
            if order.constructor:
                order.constructor.coin_balance += refund_amount_constructor
                order.constructor.save()


            # Ghi nhận giao dịch refund
            CoinTransaction.objects.create(
                user=order.user,
                transaction_type='refund',
                amount=refund_amount_user,
                order=order,
                description="Refund on confirm completion (user)"
            )
            if order.constructor:
                CoinTransaction.objects.create(
                    user=order.constructor,
                    transaction_type='refund',
                    amount=refund_amount_constructor,
                    order=order,
                    description="Refund on confirm completion (constructor)"
                )


        return Response({
            "message": "Completion confirmed.",
            "order_status": order.status,
            "user_confirmed": order.user_confirmed,
            "constructor_confirmed": order.constructor_confirmed
        }, status=status.HTTP_200_OK)




    @action(detail=True, methods=['post'], url_path="user-feedback")
    def user_feedback(self, request, pk=None):
        """
        User gửi feedback và rating cho Constructor.
        Sau khi feedback thành công, user sẽ nhận thêm refund coin dựa trên OurQuotation.
        """
        order = self.get_object()
        user = request.user


        if order.status != "completed":
            return Response({"error": "You can only give feedback after the order is completed."},
                            status=status.HTTP_400_BAD_REQUEST)
        if user != order.user:
            return Response({"error": "Only the order owner can give feedback to the constructor."},
                            status=status.HTTP_403_FORBIDDEN)
        if OrderFeedback.objects.filter(order=order, reviewer=user).exists():
            return Response({"error": "You have already given feedback for this order."},
                            status=status.HTTP_400_BAD_REQUEST)


        serializer = OrderFeedbackSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(order=order, reviewer=user, recipient=order.constructor)
            # Refund coin cho user khi feedback
            try:
                our_quotation = OurQuotation.objects.get(category=order.category)
            except OurQuotation.DoesNotExist:
                return Response({"error": "OurQuotation for this category not found."},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            refund_amount_user = our_quotation.user_refund
            order.user.coin_balance += refund_amount_user
            order.user.save()
            CoinTransaction.objects.create(
                user=order.user,
                transaction_type='refund',
                amount=refund_amount_user,
                order=order,
                description="Refund on user feedback submission"
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




    @action(detail=True, methods=['post'], url_path="constructor-feedback")
    def constructor_feedback(self, request, pk=None):
        """
        Constructor gửi feedback và rating cho User.
        Sau khi feedback thành công, constructor sẽ nhận thêm refund coin dựa trên OurQuotation.
        """
        order = self.get_object()
        user = request.user


        if order.status != "completed":
            return Response({"error": "You can only give feedback after the order is completed."},
                            status=status.HTTP_400_BAD_REQUEST)
        if user != order.constructor:
            return Response({"error": "Only the assigned constructor can give feedback to the user."},
                            status=status.HTTP_403_FORBIDDEN)
        if OrderFeedback.objects.filter(order=order, reviewer=user).exists():
            return Response({"error": "You have already given feedback for this order."},
                            status=status.HTTP_400_BAD_REQUEST)


        serializer = OrderFeedbackSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(order=order, reviewer=user, recipient=order.user)
            # Refund coin cho constructor khi feedback
            try:
                our_quotation = OurQuotation.objects.get(category=order.category)
            except OurQuotation.DoesNotExist:
                return Response({"error": "OurQuotation for this category not found."},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            refund_amount_constructor = our_quotation.constructor_refund
            if order.constructor:
                order.constructor.coin_balance += refund_amount_constructor
                order.constructor.save()
                CoinTransaction.objects.create(
                    user=order.constructor,
                    transaction_type='refund',
                    amount=refund_amount_constructor,
                    order=order,
                    description="Refund on constructor feedback submission"
                )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    # 🔥 API: Lấy danh sách feedback của user hoặc constructor
    @action(detail=False, methods=['get'], url_path="feedbacks")
    def list_feedbacks(self, request):
        """
        Xem danh sách feedback của User hoặc Constructor.
        """
        user = request.user
        feedbacks = OrderFeedback.objects.filter(recipient=user)
        return Response(OrderFeedbackSerializer(feedbacks, many=True).data, status=status.HTTP_200_OK)


    def check_operator_role(self, request):
        """ Kiểm tra xem user có quyền Operator không """
        if request.user.role != "operator":
            raise PermissionDenied("Only operators can approve contracts.")
       
class ContractMoneyListView(APIView):
    """
    API để lấy danh sách chi tiết contract_money của các đơn hàng.
   
    - Customer: chỉ thấy đơn hàng của chính mình.
    - Constructor: chỉ thấy các đơn hàng có liên quan đến họ (đơn mà họ được chọn).
    - Admin/Operator: thấy tất cả các đơn hàng.
    """
    permission_classes = [IsAuthenticated]


    def get(self, request, format=None):
        user = request.user
       
        # Lấy danh sách orders dựa vào vai trò của user
        if user.role in ["admin", "operator"]:
            orders = Order.objects.all()
        elif user.role == "customer":
            orders = Order.objects.filter(user=user)
        elif user.role == "constructor":
            orders = Order.objects.filter(constructor=user)
        else:
            return Response({"error": "Invalid role."}, status=400)


        # Xây dựng data list với thông tin contract money
        data = []
        for order in orders:
            user_contract = OrderContractMappingByUser.objects.filter(order=order).first()
            constructor_contract = OrderContractMappingByConstructor.objects.filter(order=order).first()
           
            data.append({
                "order_id": order.id,
                "order_status": order.status,
                "user_contract_money": user_contract.contract_money if user_contract else None,
                "constructor_contract_money": constructor_contract.contract_money if constructor_contract else None,
                "contract_approved_date": user_contract.approved_date if user_contract and user_contract.approved_date else (
                    constructor_contract.approved_date if constructor_contract and constructor_contract.approved_date else None
                ),
            })


        return Response(data, status=200)
       
class CoinHistoryView(APIView):
    permission_classes = [IsAuthenticated]


    def get(self, request, format=None):
        user = request.user


        # Nếu admin, trả về toàn bộ giao dịch
        if user.role == "admin" or user.is_superuser:
            transactions = CoinTransaction.objects.all()
        else:
            # Customer và Constructor chỉ thấy giao dịch của chính họ
            transactions = CoinTransaction.objects.filter(user=user)


        serializer = CoinTransactionSerializer(transactions, many=True)
        return Response(serializer.data)


class ContractMoneyHistoryView(APIView):
    """
    API trả về tổng hợp số tiền hợp đồng theo tháng.
    Chỉ tính những hợp đồng có status là "approved".
    - Nếu người dùng là constructor: trả về tổng thu nhập (từ OrderContractMappingByConstructor)
      của họ theo tháng.
    - Nếu người dùng là customer: trả về tổng chi tiêu (từ OrderContractMappingByUser)
      của họ theo tháng.
    - Nếu admin/operator: trả về tổng hợp chi tiêu của khách hàng và thu nhập của constructor.
    """
    permission_classes = [IsAuthenticated]


    def get(self, request, format=None):
        user = request.user
        from django.db.models.functions import TruncMonth
        from django.db.models import Sum


        if user.role == "constructor":
            income_data = (OrderContractMappingByConstructor.objects
                           .filter(constructor=user, status="approved")
                           .exclude(contract_money__isnull=True)
                           .annotate(month=TruncMonth('approved_date'))
                           .values('month')
                           .annotate(total_income=Sum('contract_money'))
                           .order_by('month'))
            return Response({
                "role": "constructor",
                "data": list(income_data)
            })


        elif user.role == "customer":
            spending_data = (OrderContractMappingByUser.objects
                             .filter(user=user, status="approved")
                             .exclude(contract_money__isnull=True)
                             .annotate(month=TruncMonth('approved_date'))
                             .values('month')
                             .annotate(total_spent=Sum('contract_money'))
                             .order_by('month'))
            return Response({
                "role": "customer",
                "data": list(spending_data)
            })


        elif user.role in ["admin", "operator"]:
            user_spending = (OrderContractMappingByUser.objects
                             .filter(status="approved")
                             .exclude(contract_money__isnull=True)
                             .values('user')
                             .annotate(total_spent=Sum('contract_money'))
                             .order_by('user'))
            constructor_income = (OrderContractMappingByConstructor.objects
                                  .filter(status="approved")
                                  .exclude(contract_money__isnull=True)
                                  .values('constructor')
                                  .annotate(total_income=Sum('contract_money'))
                                  .order_by('constructor'))
            return Response({
                "role": user.role,
                "user_spending": list(user_spending),
                "constructor_income": list(constructor_income),
            })


        else:
            return Response({"error": "Invalid role."}, status=400)
       
       
class FeedbackListAdminView(generics.ListAPIView):
    """
    API cho phép admin và operator xem danh sách tất cả các feedback (và rating)
    mà các user đã nhận được. Nếu có query parameter 'recipient_id', sẽ chỉ trả về
    feedback của user đó.
    """
    serializer_class = OrderFeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]


    def get_queryset(self):
        user = self.request.user
        # Chỉ cho phép admin và operator truy cập
        if user.role not in ["admin", "operator"]:
            raise PermissionDenied("You do not have permission to view feedback stats.")
       
        # Nếu có truyền recipient_id thì lọc theo đó
        recipient_id = self.request.query_params.get("recipient_id")
        if recipient_id:
            return OrderFeedback.objects.filter(recipient_id=recipient_id)
        return OrderFeedback.objects.all()


    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        # Bạn có thể tùy chỉnh response nếu cần, ví dụ thêm tổng số feedback
        response_data = {
            "total_feedbacks": queryset.count(),
            "feedbacks": serializer.data
        }
        return Response(response_data, status=status.HTTP_200_OK)
   
class CompletedOrdersView(APIView):
 
    permission_classes = [IsAuthenticated]
   
    def get(self, request, format=None):
        user = request.user


        if user.role == "customer":
            orders = Order.objects.filter(status="completed", user=user)
        elif user.role == "constructor":
            orders = Order.objects.filter(status="completed", constructor=user)
        elif user.role in ["admin", "operator"]:
            user_id = request.query_params.get("user_id")
            if user_id:
                orders = Order.objects.filter(status="completed", user__id=user_id)
            else:
                orders = Order.objects.filter(status="completed")
        else:
            raise PermissionDenied("You do not have permission to view completed orders.")


        serializer = OrderSerializer(orders, many=True, context={'request': request})
        return Response(serializer.data)
#đây là phần thêm
class AdminOrderListView(generics.ListAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAdmin]


    def get_queryset(self):
        return Order.objects.select_related('user', 'constructor').all()


class IncomeView(APIView):
    def get(self, request, format=None):
        period = request.query_params.get('period', 'day')  # Mặc định là 'day'
        if period not in ['day', 'month', 'year']:
            return Response({"error": "Invalid period. Choose 'day', 'month', or 'year'."},
                            status=status.HTTP_400_BAD_REQUEST)


        now = timezone.now()  # Thời gian hiện tại


        if period == 'day':
            # Lấy total_income của ngày hiện tại
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
            income_data = Order.objects.filter(created_at__range=(start_date, end_date)).aggregate(
                total_income=Sum('incomeCoin')  # Thay 'incomeCoin' bằng field thực tế
            )
            return Response({
                "date": start_date.strftime('%Y-%m-%d'),
                "total_income": income_data['total_income'] or 0
            }, status=status.HTTP_200_OK)


        elif period == 'month':
            # Lấy total_income của từng ngày trong tháng hiện tại
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            # Sử dụng calendar để lấy ngày cuối tháng
            last_day = calendar.monthrange(now.year, now.month)[1]
            end_date = now.replace(day=last_day, hour=23, minute=59, second=59, microsecond=999999)
            income_data = Order.objects.filter(created_at__range=(start_date, end_date)).annotate(
                day=TruncDay('created_at')
            ).values('day').annotate(
                total_income=Sum('incomeCoin')  # Thay 'incomeCoin' bằng field thực tế
            ).order_by('day')
            formatted_data = [
                {"date": entry['day'].strftime('%Y-%m-%d'), "total_income": entry['total_income'] or 0}
                for entry in income_data
            ]
            return Response(formatted_data, status=status.HTTP_200_OK)


        else:  # period == 'year'
            # Lấy total_income của từng tháng trong năm hiện tại
            start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            end_date = now.replace(month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)
            income_data = Order.objects.filter(created_at__range=(start_date, end_date)).annotate(
                month=TruncMonth('created_at')
            ).values('month').annotate(
                total_income=Sum('incomeCoin')  # Thay 'incomeCoin' bằng field thực tế
            ).order_by('month')
            formatted_data = [
                {"month": entry['month'].strftime('%Y-%m'), "total_income": entry['total_income'] or 0}
                for entry in income_data
            ]
            return Response(formatted_data, status=status.HTTP_200_OK)
   
class OrderCountView(APIView):
    permission_classes = [IsAdmin]
    def get(self, request, format=None):
        period = request.query_params.get('period', 'day')
        if period not in ['day', 'month', 'year']:
            return Response({"error": "Invalid period. Choose 'day', 'month', or 'year'."},
                            status=status.HTTP_400_BAD_REQUEST)
        now = timezone.now()
        if period == 'day':
            # Filter to current day
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
            total_orders = Order.objects.filter(created_at__range=(start_date, end_date)).count()
            return Response({
                "date": start_date.strftime('%Y-%m-%d'),
                "total_orders": total_orders
            }, status=status.HTTP_200_OK)


        elif period == 'month':
            # Filter to current month and group by day
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            last_day = calendar.monthrange(now.year, now.month)[1]
            end_date = now.replace(day=last_day, hour=23, minute=59, second=59, microsecond=999999)
            order_count_data = Order.objects.filter(created_at__range=(start_date, end_date)).annotate(
                day=TruncDay('created_at')
            ).values('day').annotate(
                total_orders=Count('id')
            ).order_by('day')
            formatted_data = [
                {"date": entry['day'].strftime('%Y-%m-%d'), "total_orders": entry['total_orders']}
                for entry in order_count_data
            ]
            return Response(formatted_data, status=status.HTTP_200_OK)


        else:  # period == 'year'
            # Filter to current year and group by month
            start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            end_date = now.replace(month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)


            order_count_data = Order.objects.filter(created_at__range=(start_date, end_date)).annotate(
                month=TruncMonth('created_at')
            ).values('month').annotate(
                total_orders=Count('id')
            ).order_by('month')
            formatted_data = [
                {"month": entry['month'].strftime('%Y-%m'), "total_orders": entry['total_orders']}
                for entry in order_count_data
            ]
            return Response(formatted_data, status=status.HTTP_200_OK)
       
class OurQuotationUpdateView(generics.RetrieveUpdateAPIView):
    queryset = OurQuotation.objects.all()
    serializer_class = OurQuotationSerializer
    permission_classes = [IsAdmin]


class OurQuotationListView(generics.ListAPIView):
    queryset = OurQuotation.objects.all()
    serializer_class = OurQuotationSerializer
    permission_classes = [IsAdmin]


class OutcomeView(APIView):
    permission_classes = [IsAdmin]


    def get(self, request, format=None):
        period = request.query_params.get('period', 'day')
        if period not in ['day', 'month', 'year']:
            return Response({"error": "Invalid period. Choose 'day', 'month', or 'year'."},
                            status=status.HTTP_400_BAD_REQUEST)


        now = timezone.now()


        if period == 'day':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
            outcome_data = Order.objects.filter(created_at__range=(start_date, end_date)).aggregate(
                total_outcome=Sum('outcomeCoin')
            )
            return Response({
                "date": start_date.strftime('%Y-%m-%d'),
                "total_outcome": outcome_data['total_outcome'] or 0
            }, status=status.HTTP_200_OK)


        elif period == 'month':
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            last_day = calendar.monthrange(now.year, now.month)[1]
            end_date = now.replace(day=last_day, hour=23, minute=59, second=59, microsecond=999999)
            outcome_data = Order.objects.filter(created_at__range=(start_date, end_date)).annotate(
                day=TruncDay('created_at')
            ).values('day').annotate(
                total_outcome=Sum('outcomeCoin')
            ).order_by('day')
            formatted_data = [
                {"date": entry['day'].strftime('%Y-%m-%d'), "total_outcome": entry['total_outcome'] or 0}
                for entry in outcome_data
            ]
            return Response(formatted_data, status=status.HTTP_200_OK)


        else:  # period == 'year'
            start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            end_date = now.replace(month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)
            outcome_data = Order.objects.filter(created_at__range=(start_date, end_date)).annotate(
                month=TruncMonth('created_at')
            ).values('month').annotate(
                total_outcome=Sum('outcomeCoin')
            ).order_by('month')
            formatted_data = [
                {"month": entry['month'].strftime('%Y-%m'), "total_outcome": entry['total_outcome'] or 0}
                for entry in outcome_data
            ]
            return Response(formatted_data, status=status.HTTP_200_OK)


class RemainView(APIView):
    permission_classes = [IsAdmin]


    def get(self, request, format=None):
        period = request.query_params.get('period', 'day')
        if period not in ['day', 'month', 'year']:
            return Response({"error": "Invalid period. Choose 'day', 'month', or 'year'."},
                            status=status.HTTP_400_BAD_REQUEST)


        now = timezone.now()


        if period == 'day':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
            remain_data = Order.objects.filter(created_at__range=(start_date, end_date)).aggregate(
                total_remain=Sum('remainCoin')
            )
            return Response({
                "date": start_date.strftime('%Y-%m-%d'),
                "total_remain": remain_data['total_remain'] or 0
            }, status=status.HTTP_200_OK)


        elif period == 'month':
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            last_day = calendar.monthrange(now.year, now.month)[1]
            end_date = now.replace(day=last_day, hour=23, minute=59, second=59, microsecond=999999)
            remain_data = Order.objects.filter(created_at__range=(start_date, end_date)).annotate(
                day=TruncDay('created_at')
            ).values('day').annotate(
                total_remain=Sum('remainCoin')
            ).order_by('day')
            formatted_data = [
                {"date": entry['day'].strftime('%Y-%m-%d'), "total_remain": entry['total_remain'] or 0}
                for entry in remain_data
            ]
            return Response(formatted_data, status=status.HTTP_200_OK)


        else:  # period == 'year'
            start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            end_date = now.replace(month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)
            remain_data = Order.objects.filter(created_at__range=(start_date, end_date)).annotate(
                month=TruncMonth('created_at')
            ).values('month').annotate(
                total_remain=Sum('remainCoin')
            ).order_by('month')
            formatted_data = [
                {"month": entry['month'].strftime('%Y-%m'), "total_remain": entry['total_remain'] or 0}
                for entry in remain_data
            ]
            return Response(formatted_data, status=status.HTTP_200_OK)




