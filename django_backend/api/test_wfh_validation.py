from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Employees, WorkFromHome, Holidays
import datetime


class WFHValidationTestCase(TestCase):
    """Test cases for WFH request validation"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create a test employee
        self.employee = Employees.objects.create(
            employee_id='TEST001',
            first_name='Test',
            last_name='Employee',
            email='test@example.com',
            role='Developer',
            status='Active'
        )
        
        # Create a test holiday (e.g., New Year's Day 2026)
        self.holiday = Holidays.objects.create(
            date='2026-01-01',
            name='New Year\'s Day',
            type='National Holiday',
            is_optional=False
        )

    def test_valid_wfh_request(self):
        """Test that a valid WFH request is accepted"""
        # Use a Monday in the future
        from_date = '2026-03-02'  # Monday
        to_date = '2026-03-02'
        
        response = self.client.post('/api/wfh/apply/', {
            'employeeId': self.employee.employee_id,
            'fromDate': from_date,
            'toDate': to_date,
            'reason': 'Personal work',
            'notifyTo': 'Manager'
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        self.assertEqual(WorkFromHome.objects.count(), 1)

    def test_duplicate_wfh_request(self):
        """Test that duplicate WFH requests are rejected"""
        from_date = '2026-03-02'  # Monday
        to_date = '2026-03-02'
        
        # Create first WFH request
        WorkFromHome.objects.create(
            employee=self.employee,
            from_date=from_date,
            to_date=to_date,
            reason='First request',
            status='Pending'
        )
        
        # Try to create duplicate request
        response = self.client.post('/api/wfh/apply/', {
            'employeeId': self.employee.employee_id,
            'fromDate': from_date,
            'toDate': to_date,
            'reason': 'Duplicate request',
            'notifyTo': 'Manager'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('already have a WFH request', response.data['error'])

    def test_overlapping_wfh_request(self):
        """Test that overlapping WFH requests are rejected"""
        # Create first WFH request for March 2-4
        WorkFromHome.objects.create(
            employee=self.employee,
            from_date='2026-03-02',
            to_date='2026-03-04',
            reason='First request',
            status='Pending'
        )
        
        # Try to create overlapping request for March 3-5
        response = self.client.post('/api/wfh/apply/', {
            'employeeId': self.employee.employee_id,
            'fromDate': '2026-03-03',
            'toDate': '2026-03-05',
            'reason': 'Overlapping request',
            'notifyTo': 'Manager'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('already have a WFH request', response.data['error'])

    def test_sunday_wfh_request(self):
        """Test that WFH requests on Sundays are rejected"""
        # March 1, 2026 is a Sunday
        sunday_date = '2026-03-01'
        
        response = self.client.post('/api/wfh/apply/', {
            'employeeId': self.employee.employee_id,
            'fromDate': sunday_date,
            'toDate': sunday_date,
            'reason': 'Sunday work',
            'notifyTo': 'Manager'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('not allowed on Sundays', response.data['error'])

    def test_sunday_in_date_range(self):
        """Test that WFH requests with Sunday in range are rejected"""
        # March 2-8, 2026 includes Sunday March 8
        response = self.client.post('/api/wfh/apply/', {
            'employeeId': self.employee.employee_id,
            'fromDate': '2026-03-02',
            'toDate': '2026-03-08',
            'reason': 'Week work',
            'notifyTo': 'Manager'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('not allowed on Sundays', response.data['error'])

    def test_public_holiday_wfh_request(self):
        """Test that WFH requests on public holidays are rejected"""
        response = self.client.post('/api/wfh/apply/', {
            'employeeId': self.employee.employee_id,
            'fromDate': '2026-01-01',
            'toDate': '2026-01-01',
            'reason': 'Holiday work',
            'notifyTo': 'Manager'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('not allowed on public holidays', response.data['error'])
        self.assertIn('New Year\'s Day', response.data['error'])

    def test_invalid_date_format(self):
        """Test that invalid date formats are rejected"""
        response = self.client.post('/api/wfh/apply/', {
            'employeeId': self.employee.employee_id,
            'fromDate': '01-03-2026',  # Invalid format
            'toDate': '01-03-2026',
            'reason': 'Invalid date',
            'notifyTo': 'Manager'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_end_date_before_start_date(self):
        """Test that end date before start date is rejected"""
        response = self.client.post('/api/wfh/apply/', {
            'employeeId': self.employee.employee_id,
            'fromDate': '2026-03-05',
            'toDate': '2026-03-02',
            'reason': 'Invalid range',
            'notifyTo': 'Manager'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('End date cannot be before start date', response.data['error'])

    def test_employee_not_found(self):
        """Test that non-existent employee is handled"""
        response = self.client.post('/api/wfh/apply/', {
            'employeeId': 'NONEXISTENT',
            'fromDate': '2026-03-02',
            'toDate': '2026-03-02',
            'reason': 'Test',
            'notifyTo': 'Manager'
        })
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)
        self.assertIn('Employee not found', response.data['error'])
