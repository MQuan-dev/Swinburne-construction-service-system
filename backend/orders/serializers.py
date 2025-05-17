from rest_framework import serializers
from user.models import CompletedOrder  # Import model CompletedOrder từ app user
from .models import (Order, QuotationInfo, QuotationOrderMapping, OrderFile, QuotationFile,
                    OrderContractMappingByUser, OrderContractMappingByConstructor , OrderFeedback , CoinTransaction , OurQuotation)
from category.serializers import CategorySerializer
from category.models import Category 


class OrderFileSerializer(serializers.ModelSerializer):
    """ Serializer cho file đính kèm của Order """
    class Meta:
        model = OrderFile
        fields = ['file', 'uploaded_at']
class OrderSerializer(serializers.ModelSerializer):
    quotations = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True)
    subcategory_name = serializers.CharField(source='category.name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    constructor_username = serializers.CharField(source='constructor.username', read_only=True, allow_null=True)
    incomeCoin = serializers.DecimalField(max_digits=10, decimal_places=2)
    outcomeCoin = serializers.DecimalField(max_digits=10, decimal_places=2)
    remainCoin = serializers.DecimalField(max_digits=10, decimal_places=2)

    # ✅ Cập nhật trạng thái động cho constructor
    status = serializers.SerializerMethodField()
    
    files = OrderFileSerializer(many=True, required=False, read_only=True)
   
    user_confirmed = serializers.BooleanField(read_only=True)
    constructor_confirmed = serializers.BooleanField(read_only=True)

    completion_date = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'category', 'category_id', 'subcategory_name', 'user', 'user_username', 'constructor', 'constructor_username', 'title',
            'description', 'status', 'user_fee', 'constructor_fee',  'created_at', 'updated_at', 'expired_at', 'quotations' , 'files' ,
            'user_confirmed', 'constructor_confirmed', 'incomeCoin', 'outcomeCoin', 'remainCoin','completion_date'

        ]
        read_only_fields = ['id', 'user', 'user_username', 'constructor', 'constructor_username', 'created_at', 'updated_at', 'expired_at', 'subcategory_name'
                            ,'completion_date']

    def get_status(self, obj):
        # Làm mới đối tượng để lấy trạng thái mới nhất từ DB
        obj.refresh_from_db()
        request = self.context.get('request')
        if not request:
            return obj.status

        user = request.user

        # Với customer và operator, trả về trạng thái lưu trong DB (theo như họ thấy)
        if user.role in ["customer", "operator"]:
            return obj.status

        # Với constructor, cần điều chỉnh hiển thị:
        if user.role == "constructor":
            # Lấy báo giá của constructor này cho đơn hàng (nếu có)
            quotation = QuotationInfo.objects.filter(
                quotation_mappings__order=obj,
                constructor=user
            ).first()

            # Nếu đơn hàng đã completed:
            if obj.status == "completed":
                # Nếu có báo giá và nó là rejected (vẫn chưa confirm) thì trả về "rejected"
                if quotation and quotation.status == "rejected":
                    print(f"[DEBUG] Order {obj.id}: Completed but quotation rejected; returning 'rejected' for constructor {user.username}.")
                    return "rejected"
                else:
                    print(f"[DEBUG] Order {obj.id}: Completed; returning 'completed' for constructor {user.username}.")
                    return "completed"

            # Nếu đơn hàng đang in_progress thì trả về "in_progress"
            if obj.status == "in_progress":
                print(f"[DEBUG] Order {obj.id}: In progress; returning 'in_progress' for constructor {user.username}.")
                return "in_progress"

            # Nếu đơn hàng đang ở trạng thái "constructor_selected", trả về trạng thái báo giá (chẳng hạn "accepted" hay "rejected")
            if obj.status == "constructor_selected":
                if quotation:
                    print(f"[DEBUG] Order {obj.id}: In constructor_selected; returning quotation status '{quotation.status}' for constructor {user.username}.")
                    return quotation.status

            # Nếu có báo giá và báo giá là rejected, thì luôn trả về "rejected"
            if quotation and quotation.status == "rejected":
                print(f"[DEBUG] Order {obj.id}: Quotation rejected; returning 'rejected' for constructor {user.username}.")
                return "rejected"

            # Mặc định, trả về trạng thái lưu trong DB
            print(f"[DEBUG] Order {obj.id}: Returning stored status '{obj.status}' for constructor {user.username}.")
            return obj.status

        return obj.status


    def get_quotations(self, obj):
        """
        Chỉ lấy quotations phù hợp với role của user.
        """
        request = self.context.get('request', None)
        if not request:
            return []

        user = request.user

        # ✅ Operator có thể thấy tất cả quotations
        if user.role == "operator":
            quotations = QuotationInfo.objects.filter(quotation_mappings__order=obj)

        # ✅ Customer thấy tất cả quotations trong order của họ
        elif user.role == "customer":
            quotations = QuotationInfo.objects.filter(quotation_mappings__order=obj)

        # ✅ Constructor chỉ thấy quotations của chính họ
        elif user.role == "constructor":
            quotations = QuotationInfo.objects.filter(
                quotation_mappings__order=obj,
                constructor=user
            )

        else:
            return []

        return QuotationInfoSerializer(quotations, many=True).data
    
    def get_completion_date(self, obj):
        # Chỉ trả về completion_date nếu đơn hàng đã được đánh dấu là completed
        if obj.status == "completed":
            completed_order = CompletedOrder.objects.filter(order=obj).first()
            if completed_order:
                return completed_order.completed_at
        return None
    

class QuotationFileSerializer(serializers.ModelSerializer):
    """
    Serializer for the QuotationFile model to handle files associated with a quotation.
    """
    class Meta:
        model = QuotationFile
        fields = ['file', 'uploaded_at']

class QuotationInfoSerializer(serializers.ModelSerializer):
    files = QuotationFileSerializer(many=True, required=False, read_only=True)
    constructor_username = serializers.CharField(source='constructor.username', read_only=True)
    
    class Meta:
        model = QuotationInfo
        fields = ['id', 'constructor', 'constructor_username', 'message', 'status', 'warranty_days', 'created_at', 'files']
        read_only_fields = ['id', 'status', 'created_at', 'constructor']

class RequestSerializer(serializers.Serializer):
    """
    Serializer cho API tạo order.
    """
    CATEGORY_CHOICES = (
        ('service', 'Service Order'),
        ('material', 'Material Order'),
    )
    category = serializers.ChoiceField(choices=CATEGORY_CHOICES)
    data = serializers.JSONField()

class QuotationOrderMappingSerializer(serializers.ModelSerializer):
    """ Serializer để map báo giá với order. """
    user_username = serializers.CharField(source='order.user.username', read_only=True)
    constructor_username = serializers.CharField(source='quotation.constructor.username', read_only=True)
    class Meta:
        model = QuotationOrderMapping
        fields = ['id', 'order', 'quotation', 'user_username', 'constructor_username', 'sent_at']

class OurQuotationSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), 
        required=False, 
        allow_null=True
    )
    class Meta:
        model = OurQuotation
        fields = ['id', 'category', 'user_fee', 'constructor_fee', 'user_refund', 'constructor_refund']


class OrderContractByUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderContractMappingByUser
        fields = ['id', 'order', 'user', 'contract_file', 'contract_money', 'uploaded_date', 'approved_date', 'status']
        read_only_fields = ['id', 'user', 'uploaded_date', 'approved_date', 'status']

class OrderContractByConstructorSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderContractMappingByConstructor
        fields = ['id', 'order', 'constructor', 'contract_file', 'contract_money', 'uploaded_date', 'approved_date', 'status']
        read_only_fields = ['id', 'constructor', 'uploaded_date', 'approved_date', 'status']

class OrderFeedbackSerializer(serializers.ModelSerializer):
    reviewer_username = serializers.CharField(source='reviewer.username', read_only=True)
    recipient_username = serializers.CharField(source='recipient.username', read_only=True)

    class Meta:
        model = OrderFeedback
        fields = ['id', 'order', 'reviewer', 'reviewer_username', 'recipient', 'recipient_username', 'rating', 'feedback', 'created_at']
        read_only_fields = ['id', 'order', 'reviewer', 'reviewer_username', 'recipient', 'recipient_username', 'created_at']

class CoinTransactionSerializer(serializers.ModelSerializer):
    # Lấy coin_balance từ user (read-only)
    coin_balance = serializers.DecimalField(source='user.coin_balance', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CoinTransaction
        fields = '__all__'