from django.db import models

class Category(models.Model):
    class CategoryType(models.TextChoices):
        SERVICE = 'service', 'Service'
        MATERIAL = 'material', 'Material'

    icon = models.ImageField(upload_to='category_icons/', null=True, blank=True)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(
        max_length=50,
        choices=CategoryType.choices,
        default=CategoryType.SERVICE,
    )

    def __str__(self):
        return self.name
