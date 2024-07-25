# my_app/my_app/doctype/group_class/group_class.py

import frappe

@frappe.whitelist()
def fetch_students(selected_modules, department):
    if not selected_modules or not department:
        frappe.throw("Please select at least one module and ensure department is selected.")

    selected_modules = frappe.parse_json(selected_modules)
    
    students = frappe.db.sql("""
        SELECT name, student_name
        FROM `tabStudent`
        WHERE department = %s
        AND name NOT IN (
            SELECT parent
            FROM `tabEnrolled Module`
            WHERE module IN (%s)
        )
    """, (department, ','.join(['%s'] * len(selected_modules))), tuple(selected_modules), as_dict=True)

    return students
