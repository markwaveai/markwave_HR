from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Clear all attendance data from the database'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            self.stdout.write('Clearing core_attendancelog table...')
            cursor.execute("TRUNCATE TABLE core_attendancelog;")
            self.stdout.write(self.style.SUCCESS('✓ core_attendancelog cleared'))
            
            self.stdout.write('Clearing core_attendance table...')
            cursor.execute("TRUNCATE TABLE core_attendance;")
            self.stdout.write(self.style.SUCCESS('✓ core_attendance cleared'))
            
            self.stdout.write(self.style.SUCCESS('\n✅ All attendance data has been cleared successfully!'))
