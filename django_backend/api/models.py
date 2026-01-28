from django.db import models

class OTPStore(models.Model):
    phone = models.CharField(max_length=20)
    otp = models.CharField(max_length=6)
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.phone} - {self.otp} ({'Verified' if self.is_verified else 'Pending'})"

    class Meta:
        verbose_name = "OTP Store"
        verbose_name_plural = "OTP Store entries"
        ordering = ['-created_at']
