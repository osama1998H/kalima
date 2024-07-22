# your_app_name/your_module/department_annual_report.py

import frappe

def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data

def get_columns():
    return [
        {"label": "Department", "fieldname": "department", "fieldtype": "Data", "width": 150},
        {"label": "Passed Students", "fieldname": "passed_students", "fieldtype": "Data", "width": 150},
        {"label": "Failed Students", "fieldname": "failed_students", "fieldtype": "Data", "width": 150},
        {"label": "Another Try Students", "fieldname": "failed_third_round_students", "fieldtype": "Data", "width": 200},
        {"label": "Exam Another Try Students", "fieldname": "failed_not_third_round_students", "fieldtype": "Data", "width": 200}
    ]

def get_data(filters):
    data = []

    if filters and filters.get("department"):
        departments = [filters.get("department")]
    else:
        departments = frappe.get_all("Department", fields=["name"])
        departments = [dept.name for dept in departments]

    for dept in departments:
        # Fetch passed students
        passed_students = frappe.get_all("Student Result Log", filters={
            "type": "Final Grade",
            "final_status": "Passed",
            "module_department": dept
        }, fields=["student_name"])

        # Fetch failed students
        failed_students = frappe.get_all("Student Result Log", filters={
            "type": "Final Grade",
            "final_status": "Failed",
            "module_department": dept
        }, fields=["student_name", "round"])

        failed_third_round_students = [student.student_name for student in failed_students if student.round == "Third"]
        failed_not_third_round_students = [student.student_name for student in failed_students if student.round != "Third"]

        data.append({
            "department": dept,
            "passed_students": len(passed_students),
            "failed_students": len(failed_students),
            "failed_third_round_students": len(failed_third_round_students),
            "failed_not_third_round_students": len(failed_not_third_round_students)
        })

    return data
