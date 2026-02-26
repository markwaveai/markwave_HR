from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0022_supportquery'),
    ]

    operations = [
        migrations.RunSQL(
            # core_attendancelog
            sql='ALTER TABLE core_attendancelog DROP CONSTRAINT core_attendancelog_employee_id_77fa9230_fk_core_empl; '
                'ALTER TABLE core_attendancelog ADD CONSTRAINT core_attendancelog_employee_id_77fa9230_fk_core_empl '
                'FOREIGN KEY (employee_id) REFERENCES core_employee(employee_id) ON UPDATE CASCADE ON DELETE SET NULL;',
            reverse_sql='ALTER TABLE core_attendancelog DROP CONSTRAINT core_attendancelog_employee_id_77fa9230_fk_core_empl; '
                        'ALTER TABLE core_attendancelog ADD CONSTRAINT core_attendancelog_employee_id_77fa9230_fk_core_empl '
                        'FOREIGN KEY (employee_id) REFERENCES core_employee(employee_id) ON DELETE SET NULL;'
        ),
        migrations.RunSQL(
            # core_attendance
            sql='ALTER TABLE core_attendance DROP CONSTRAINT core_attendance_employee_id_6327f987_fk_core_empl; '
                'ALTER TABLE core_attendance ADD CONSTRAINT core_attendance_employee_id_6327f987_fk_core_empl '
                'FOREIGN KEY (employee_id) REFERENCES core_employee(employee_id) ON UPDATE CASCADE ON DELETE SET NULL;',
            reverse_sql='ALTER TABLE core_attendance DROP CONSTRAINT core_attendance_employee_id_6327f987_fk_core_empl; '
                        'ALTER TABLE core_attendance ADD CONSTRAINT core_attendance_employee_id_6327f987_fk_core_empl '
                        'FOREIGN KEY (employee_id) REFERENCES core_employee(employee_id) ON DELETE SET NULL;'
        ),
        migrations.RunSQL(
            # core_leaverequest
            sql='ALTER TABLE core_leaverequest DROP CONSTRAINT core_leaverequest_employee_id_eae723bf_fk_core_empl; '
                'ALTER TABLE core_leaverequest ADD CONSTRAINT core_leaverequest_employee_id_eae723bf_fk_core_empl '
                'FOREIGN KEY (employee_id) REFERENCES core_employee(employee_id) ON UPDATE CASCADE ON DELETE NO ACTION;',
            reverse_sql='ALTER TABLE core_leaverequest DROP CONSTRAINT core_leaverequest_employee_id_eae723bf_fk_core_empl; '
                        'ALTER TABLE core_leaverequest ADD CONSTRAINT core_leaverequest_employee_id_eae723bf_fk_core_empl '
                        'FOREIGN KEY (employee_id) REFERENCES core_employee(employee_id) ON DELETE NO ACTION;'
        ),
        migrations.RunSQL(
            # core_posts
            sql='ALTER TABLE core_posts DROP CONSTRAINT core_posts_author_id_9fddc5f1_fk_core_employee_employee_id; '
                'ALTER TABLE core_posts ADD CONSTRAINT core_posts_author_id_9fddc5f1_fk_core_employee_employee_id '
                'FOREIGN KEY (author_id) REFERENCES core_employee(employee_id) ON UPDATE CASCADE ON DELETE NO ACTION;',
            reverse_sql='ALTER TABLE core_posts DROP CONSTRAINT core_posts_author_id_9fddc5f1_fk_core_employee_employee_id; '
                        'ALTER TABLE core_posts ADD CONSTRAINT core_posts_author_id_9fddc5f1_fk_core_employee_employee_id '
                        'FOREIGN KEY (author_id) REFERENCES core_employee(employee_id) ON DELETE NO ACTION;'
        ),
        migrations.RunSQL(
            # core_team
            sql='ALTER TABLE core_team DROP CONSTRAINT core_team_manager_id_227cfa0f_fk_core_employee_employee_id; '
                'ALTER TABLE core_team ADD CONSTRAINT core_team_manager_id_227cfa0f_fk_core_employee_employee_id '
                'FOREIGN KEY (manager_id) REFERENCES core_employee(employee_id) ON UPDATE CASCADE ON DELETE SET NULL;',
            reverse_sql='ALTER TABLE core_team DROP CONSTRAINT core_team_manager_id_227cfa0f_fk_core_employee_employee_id; '
                        'ALTER TABLE core_team ADD CONSTRAINT core_team_manager_id_227cfa0f_fk_core_employee_employee_id '
                        'FOREIGN KEY (manager_id) REFERENCES core_employee(employee_id) ON DELETE SET NULL;'
        ),
        migrations.RunSQL(
            # core_regularization
            sql='ALTER TABLE core_regularization DROP CONSTRAINT core_regularization_employee_id_045df133_fk_core_empl; '
                'ALTER TABLE core_regularization ADD CONSTRAINT core_regularization_employee_id_045df133_fk_core_empl '
                'FOREIGN KEY (employee_id) REFERENCES core_employee(employee_id) ON UPDATE CASCADE ON DELETE NO ACTION;',
            reverse_sql='ALTER TABLE core_regularization DROP CONSTRAINT core_regularization_employee_id_045df133_fk_core_empl; '
                        'ALTER TABLE core_regularization ADD CONSTRAINT core_regularization_employee_id_045df133_fk_core_empl '
                        'FOREIGN KEY (employee_id) REFERENCES core_employee(employee_id) ON DELETE NO ACTION;'
        ),
        migrations.RunSQL(
            # core_wfh
            sql='ALTER TABLE core_wfh DROP CONSTRAINT core_wfh_employee_id_a703f60c_fk_core_employee_employee_id; '
                'ALTER TABLE core_wfh ADD CONSTRAINT core_wfh_employee_id_a703f60c_fk_core_employee_employee_id '
                'FOREIGN KEY (employee_id) REFERENCES core_employee(employee_id) ON UPDATE CASCADE ON DELETE NO ACTION;',
            reverse_sql='ALTER TABLE core_wfh DROP CONSTRAINT core_wfh_employee_id_a703f60c_fk_core_employee_employee_id; '
                        'ALTER TABLE core_wfh ADD CONSTRAINT core_wfh_employee_id_a703f60c_fk_core_employee_employee_id '
                        'FOREIGN KEY (employee_id) REFERENCES core_employee(employee_id) ON DELETE NO ACTION;'
        ),
        migrations.RunSQL(
            # core_leaveoverriderequest
            sql='ALTER TABLE core_leaveoverriderequest DROP CONSTRAINT core_leaveoverridere_employee_id_c43c4061_fk_core_empl; '
                'ALTER TABLE core_leaveoverriderequest ADD CONSTRAINT core_leaveoverridere_employee_id_c43c4061_fk_core_empl '
                'FOREIGN KEY (employee_id) REFERENCES core_employee(employee_id) ON UPDATE CASCADE ON DELETE NO ACTION;',
            reverse_sql='ALTER TABLE core_leaveoverriderequest DROP CONSTRAINT core_leaveoverridere_employee_id_c43c4061_fk_core_empl; '
                        'ALTER TABLE core_leaveoverriderequest ADD CONSTRAINT core_leaveoverridere_employee_id_c43c4061_fk_core_empl '
                        'FOREIGN KEY (employee_id) REFERENCES core_employee(employee_id) ON DELETE NO ACTION;'
        ),
    ]
