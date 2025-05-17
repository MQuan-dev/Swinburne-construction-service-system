from rest_framework import permissions

class IsAdmin(permissions.BasePermission):

    def has_permission(self, request, view):
        try:
            return request.user.role == "admin"
        except Exception as ex:
            return False

class IsOperator(permissions.BasePermission): 
    def has_permission(self, request, view):
        try:
            return request.user.role == "operator"
        except Exception as ex:
                return False
        
class IsConstructor(permissions.BasePermission):
    def has_permission(self, request, view):
        try:
            return request.user.role == "constructor"
        except Exception as ex:
            return False
        
class IsCustomer(permissions.BasePermission):
    
    def has_permission(self, request, view):
        try:
            return request.user.role == "customer"
        except Exception as ex:
            return False