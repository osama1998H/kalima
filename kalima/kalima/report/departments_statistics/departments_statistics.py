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
            "label": _("Applied Students"),
            "fieldname": "applied_students_count",
            "fieldtype": "Int",
        },
        {
            "label": _("Accepted Students"),
            "fieldname": "accepted_students_count",
            "fieldtype": "Int",
        },
        {
            "label": _("Rejected Students"),
            "fieldname": "rejected_students_count",
            "fieldtype": "Int",
        },
        {
            "label": _("Pending Applicants"),
            "fieldname": "pending_students_count",
            "fieldtype": "Int",
        },
        {
            "label": _("Students Under Review"),
            "fieldname": "review_students_count",
            "fieldtype": "Int",
        },
        {
            "label": _("Acceptance Rate"),
            "fieldname": "acceptance_rate",
            "fieldtype": "Float",
        },
    ]

def get_data(filters):
    conditions = []
    if filters.get('year'):
        conditions.append(f"year = '{filters['year']}'")
    if filters.get('study_type'):
        conditions.append(f"pd.study_type = '{filters['study_type']}'")

    conditions_str = " AND ".join(conditions) if conditions else "1 = 1"
    print(conditions_str)

    query = f"""
        SELECT
            pd.department,
            COUNT(*) AS applied_students_count,
            SUM(CASE WHEN aps.admission_status = 'Accepted' THEN 1 ELSE 0 END) AS accepted_students_count,
            SUM(CASE WHEN aps.admission_status = 'Rejected' THEN 1 ELSE 0 END) AS rejected_students_count,
            SUM(CASE WHEN aps.admission_status = 'Pending' THEN 1 ELSE 0 END) AS pending_students_count,
            SUM(CASE WHEN aps.admission_status = 'In Progress' THEN 1 ELSE 0 END) AS review_students_count,
            SUM(CASE WHEN aps.admission_status = 'Accepted' THEN 1 ELSE 0 END) / COUNT(*) * 100 AS acceptance_rate
        FROM
            `tabApplicant Student` aps
        INNER JOIN
            `tabPreferred Departments` pd ON pd.parent = aps.name
        WHERE
            {conditions_str}
        GROUP BY
            pd.department
        ORDER BY
            pd.department
    """

    return frappe.db.sql(query, as_dict=True)
