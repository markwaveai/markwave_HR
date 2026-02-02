from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Grant admin privileges to Project Manager and Advisor-Technology & Operations roles'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Add is_admin column if it doesn't exist
            try:
                cursor.execute("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='core_employee' AND column_name='is_admin';
                """)
                
                if not cursor.fetchone():
                    self.stdout.write(self.style.WARNING('Adding is_admin column...'))
                    cursor.execute("""
                        ALTER TABLE core_employee 
                        ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
                    """)
                    self.stdout.write(self.style.SUCCESS('✓ Added is_admin column'))
                else:
                    self.stdout.write(self.style.WARNING('is_admin column already exists'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error adding column: {e}'))
                return
            
            # Set is_admin=True for specific roles
            try:
                cursor.execute("""
                    UPDATE core_employee 
                    SET is_admin = TRUE 
                    WHERE role IN ('Project Manager', 'Advisor-Technology & Operations');
                """)
                
                rows_updated = cursor.rowcount
                self.stdout.write(self.style.SUCCESS(f'✓ Updated {rows_updated} employees to admin status'))
                
                # Show the updated employees
                cursor.execute("""
                    SELECT employee_id, first_name, last_name, role, is_admin 
                    FROM core_employee 
                    WHERE role IN ('Project Manager', 'Advisor-Technology & Operations');
                """)
                
                self.stdout.write('\n' + '='*80)
                self.stdout.write(self.style.SUCCESS('Admin Employees:'))
                self.stdout.write('='*80)
                
                for row in cursor.fetchall():
                    emp_id, first, last, role, is_admin = row
                    status = '✓ ADMIN' if is_admin else '✗ NOT ADMIN'
                    self.stdout.write(f'{emp_id}: {first} {last} - {role} - {status}')
                
                self.stdout.write('='*80 + '\n')
                self.stdout.write(self.style.SUCCESS('✅ Admin privileges granted successfully!'))
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error updating employees: {e}'))
