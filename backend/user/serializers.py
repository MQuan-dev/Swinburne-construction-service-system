from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from .models import User
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import check_password
from django.contrib.auth.hashers import make_password


class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_old_password(self, value):
        """Check if the old password is correct"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Incorrect old password.")
        return value

    def validate(self, data):
        """Ensure the new password is different from the old one"""
        if data['old_password'] == data['new_password']:
            raise serializers.ValidationError({"new_password": "New password must be different from the old password."})
        return data

    def update(self, instance, validated_data):
        """Update the user's password"""
        instance.set_password(validated_data['new_password'])
        instance.save()
        return instance

class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

class ConfirmResetPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Mật khẩu không khớp!"})
        return attrs

    def update(self, instance, validated_data):
        """Cập nhật mật khẩu mới"""
        instance.password = make_password(validated_data["new_password"])
        instance.save()
        return instance

class UserStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'average_rating', 'completed_order_count']

class AddCoinSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)