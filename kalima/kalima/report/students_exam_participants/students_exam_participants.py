import frappe
from frappe import _

def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data

def get_columns():
    return [
        {
            "label": _("Department"),
            "fieldname": "department",
            "fieldtype": "Data",
        },
        {
            "label": _("Student Name"),
            "fieldname": "student_name",
            "fieldtype": "Data",
        },
        {
            "label": _("Stage"),
            "fieldname": "stage",
            "fieldtype": "Data",
        },
        {
            "label": _("Class"),
            "fieldname": "class_name",
            "fieldtype": "Data",
        },
    ]

def get_data(filters):
    conditions = []
    if filters.get('department'):
        conditions.append(f"s.final_selected_course = '{filters['department']}'")
    if filters.get('study_type'):
        conditions.append(f"s.academic_system_type = '{filters['study_type']}'")
    if filters.get('year'):
        conditions.append(f"c.year = '{filters['year']}'")

    conditions_str = " AND ".join(conditions) if conditions else "1 = 1"

    query = f"""
        SELECT
            s.final_selected_course AS department,
            s.name AS student_name,
            s.stage,
            c.name AS class_name
        FROM
            `tabStudent` s
        LEFT JOIN
            `tabClass Students` cs ON cs.student = s.name
        LEFT JOIN
            `tabClass` c ON c.name = cs.parent
        WHERE
            {conditions_str}
    """

    return frappe.db.sql(query, as_dict=True)
