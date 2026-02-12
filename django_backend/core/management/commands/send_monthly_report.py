import base64
import os
import io
import requests
import json
from datetime import datetime, date, timedelta
from django.core.management.base import BaseCommand
from django.conf import settings
from django.template.loader import render_to_string
from core.models import Employees, Attendance, Leaves, Holidays
from xhtml2pdf import pisa

class Command(BaseCommand):
    help = 'Generates and sends monthly employee attendance report PDF to Managers'

    def add_arguments(self, parser):
        parser.add_argument('--date', type=str, help='Force a specific date (YYYY-MM-DD) to run report for')
        parser.add_argument('--test-email', type=str, help='Send report to this email instead of managers')

    def handle(self, *args, **options):
        # Determine the reporting period
        # Typically run on the 11th, summarizing 11th of prev month to 10th of current month
        target_date_str = options.get('date')
        if target_date_str:
            target_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
        else:
            target_date = date.today()

        # End date: 10th of current month
        # Start date: 11th of previous month
        end_date = target_date.replace(day=10)
        if target_date.month == 1:
            start_date = date(target_date.year - 1, 12, 11)
        else:
            start_date = target_date.replace(month=target_date.month - 1, day=11)

        self.stdout.write(f"Generating report for period: {start_date} to {end_date}")

        # Fetch data
        employees = Employees.objects.all().order_by('employee_id')
        holidays_list = Holidays.objects.all()
        holiday_dates = set()
        for h in holidays_list:
            try:
                holiday_dates.add(datetime.strptime(h.date, '%Y-%m-%d').date())
            except:
                pass

        report_data = []
        for emp in employees:
            stats = self.calculate_employee_stats(emp, start_date, end_date, holiday_dates)
            report_data.append(stats)

        # Generate PDF
        html_content = render_to_string('reports/monthly_attendance.html', {
            'employees': report_data,
            'start_date': start_date,
            'end_date': end_date,
            'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })

        pdf_file = io.BytesIO()
        pisa_status = pisa.CreatePDF(html_content, dest=pdf_file)
        
        if pisa_status.err:
            self.stdout.write(self.style.ERROR("Failed to generate PDF"))
            return

        pdf_data = pdf_file.getvalue()
        
        # Send Email
        recipient_email = options.get('test_email')
        if not recipient_email:
            # Get all managers (General Managers, Project Managers, etc.)
            from django.db.models import Q
            managers = Employees.objects.filter(
                Q(role__icontains='Manager') | 
                Q(role__icontains='Project Manager')
            ).distinct()
            
            manager_emails = [m.email for m in managers if m.email]
            
            # Remove duplicates and add fallback if needed
            manager_emails = list(set(manager_emails))
            if not manager_emails:
                manager_emails = ['rajesh@markwave.ai'] # Fallback
            recipient_email = manager_emails
        else:
            recipient_email = [recipient_email]

        success = self.send_email_with_pdf(
            to_emails=recipient_email,
            pdf_content=pdf_data,
            start_date=start_date,
            end_date=end_date
        )

        if success:
            self.stdout.write(self.style.SUCCESS(f"Report successfully sent to {', '.join(recipient_email)}"))
        else:
            self.stdout.write(self.style.ERROR("Failed to send report email"))

    def calculate_employee_stats(self, emp, start_date, end_date, holiday_dates):
        # 1. Total Working Days in period (Exclude Sat/Sun and Holidays)
        working_days = 0
        curr = start_date
        while curr <= end_date:
            if curr.weekday() < 5 and curr not in holiday_dates:
                working_days += 1
            curr += timedelta(days=1)

        # 2. Present Days
        present_days = Attendance.objects.filter(
            employee=emp,
            date__range=[start_date.isoformat(), end_date.isoformat()],
            status='Present'
        ).count()

        # 3. Leaves
        # We need to find leaves that overlap with our range
        overlapping_leaves = Leaves.objects.filter(
            employee=emp,
            status='Approved'
        )
        
        paid_leave_days = 0
        unpaid_leave_days = 0
        is_intern = 'intern' in (emp.role or '').lower()

        for leaf in overlapping_leaves:
            try:
                l_start = datetime.strptime(leaf.from_date, '%Y-%m-%d').date()
                l_end = datetime.strptime(leaf.to_date, '%Y-%m-%d').date()
                
                # Calculate overlap with period
                intersect_start = max(l_start, start_date)
                intersect_end = min(l_end, end_date)
                
                if intersect_start <= intersect_end:
                    # Number of days in overlap
                    # Note: We should ideally exclude weekends/holidays from leave days too?
                    # Usually if someone takes leave for a week, it's 5 days leave.
                    # But the 'days' field in model might already be correct.
                    # HOWEVER, we only want the overlap part.
                    
                    overlap_count = 0
                    c = intersect_start
                    while c <= intersect_end:
                        # Only count as leave if it's a working day? 
                        # This depends on company policy. Usually yes.
                        if c.weekday() < 5 and c not in holiday_dates:
                            overlap_count += 1
                        c += timedelta(days=1)

                    if is_intern:
                        unpaid_leave_days += overlap_count
                    else:
                        if leaf.type.lower() == 'lwp':
                            unpaid_leave_days += overlap_count
                        else:
                            paid_leave_days += overlap_count
            except Exception as e:
                self.stdout.write(f"Error processing leave for {emp.employee_id}: {e}")

        return {
            'id': emp.employee_id,
            'name': f"{emp.first_name} {emp.last_name or ''}".strip(),
            'role': emp.role or 'Employee',
            'working_days': working_days,
            'present_days': present_days,
            'paid_leaves': paid_leave_days,
            'unpaid_leaves': unpaid_leave_days
        }

    def send_email_with_pdf(self, to_emails, pdf_content, start_date, end_date):
        url = settings.EMAIL_API_URL
        
        encoded_pdf = base64.b64encode(pdf_content).decode('utf-8')
        
        payload = {
            "subject": f"Monthly Attendance Report ({start_date} to {end_date})",
            "msgbody": f"Dear Manager,\n\nPlease find attached the monthly attendance report for all employees for the period {start_date} to {end_date}.\n\nTotal Employees: {Employees.objects.count()}",
            "to_emails": to_emails,
            "attachment_name": f"Attendance_Report_{start_date}_to_{end_date}.pdf",
            "attachment_data": encoded_pdf,
            "attachment_mime_type": "application/pdf"
        }
        
        # Optional credentials if they exist in environment
        from_email = os.getenv('EMAIL_FROM')
        app_password = os.getenv('EMAIL_APP_PASSWORD')
        if from_email: payload['from_email'] = from_email
        if app_password: payload['app_password'] = app_password

        try:
            response = requests.post(url, json=payload, timeout=30)
            if response.status_code == 200:
                return True
            self.stdout.write(self.style.ERROR(f"API Error: {response.text}"))
            return False
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Request failed: {e}"))
            return False
