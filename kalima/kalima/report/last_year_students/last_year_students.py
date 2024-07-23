import frappe
from frappe import _

def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data

def get_columns():
    return [
        {
            "label": _("Student Name"),
            "fieldname": "student_name",
            "fieldtype": "Data",
            "width": 200,
        },
        {
            "label": _("Department"),
            "fieldname": "department",
            "fieldtype": "Data",
            "width": 200,
        },
        {
            "label": _("Stage"),
            "fieldname": "stage",
            "fieldtype": "Data",
            "width": 100,
        },
    ]

def get_data(filters):
    query = """
        SELECT
            s.name AS student_name,
            s.final_selected_course AS department,
            s.stage,
            d.custom_last_stage AS last_stage
        FROM
            `tabStudent` s
        LEFT JOIN
            `tabDepartment` d ON d.name = s.final_selected_course
        WHERE
            s.stage = d.custom_last_stage
    """

    students = frappe.db.sql(query, as_dict=True)

    data = []
    for student in students:
        data.append({
            "student_name": student.student_name,
            "department": student.department,
            "stage": student.stage,
        })

    # Add total row
    data.append({
        "student_name": _("Total"),
        "department": len(students),
        "stage": "",
        "is_last_stage": "",
    })

    return data
