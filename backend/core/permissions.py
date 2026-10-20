from rest_framework import permissions

class IsAdminOrPenyuluh(permissions.BasePermission):
    """
    Permission khusus untuk Admin / Kelompok Tani / Penyuluh.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role == 'ADMIN' or request.user.is_superuser

class IsPetani(permissions.BasePermission):
    """
    Permission khusus untuk Petani (Admin/Penyuluh juga dapat mengakses).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['PETANI', 'ADMIN'] or request.user.is_superuser

