# your_app_name/your_module/top_3_students.py

import frappe

def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data

def get_columns():
    return [
        {"label": "Department", "fieldname": "department", "fieldtype": "Data", "width": 150},
        {"label": "Student Name", "fieldname": "student_name", "fieldtype": "Data", "width": 150},
        {"label": "Student Stage", "fieldname": "student_stage", "fieldtype": "Data", "width": 150},
        {"label": "Final Grade", "fieldname": "final_grade", "fieldtype": "Float", "width": 100}
    ]

def get_data(filters):
    data = []

    # Fetch all departments
    departments = frappe.get_all("Department", fields=["name"])

    for dept in departments:
        # Set up filters for fetching students
        student_filters = {
            "type": "Final Grade",
            "final_status": "Passed",
            "module_department": dept.name
        }

        if filters and filters.get("educational_year"):
            student_filters["year"] = filters.get("educational_year")

        # Fetch students from the Student Result Log
        students = frappe.get_all("Student Result Log", filters=student_filters, fields=["student", "stage", "final_grade"], order_by="final_grade desc", limit_page_length=3)

        for student in students:
            data.append({
                "department": dept.name,
                "student_name": student.student,
                "student_stage": student.stage,
                "final_grade": student.final_grade
            })

        # Add an empty row after each department
        if students:
            data.append({
                "department": "",
                "student_name": "",
                "student_stage": "",
                "final_grade": None
            })

    return data
