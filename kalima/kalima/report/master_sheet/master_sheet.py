import frappe
from frappe import _

def execute(filters=None):
    columns, data = [], []

    # Fetch the columns from "Presented Module" based on the filters
    columns = get_columns(filters) + [
        {
            "label": _("Status"),
            "fieldname": "status",
            "fieldtype": "Data",
            # "width": 200,
        },
        {
            "label": _("Grade"),
            "fieldname": "grade",
            "fieldtype": "Data",
            # "width": 200,
        },
        {
            "label": _("Evaluation"),
            "fieldname": "evaluation",
            "fieldtype": "Data",
            # "width": 100,
        },
        {
            "label": _("Notes"),
            "fieldname": "notes",
            "fieldtype": "Data",
            # "width": 100,
        },
    ]
    data.append({column['fieldname']: '' for column in columns})

    return columns, data

def get_columns(filters):
    columns = []

    # Construct SQL query with necessary joins and filters
    query = """
        SELECT pm.name, pm.module_name
        FROM `tabPresented Module` pm
        LEFT JOIN `tabDepartment` d ON pm.department = d.name
        WHERE 1 = 1
    """

    # Apply filters
    if filters.get("department"):
        query += " AND pm.department = %(department)s"

    if filters.get("stage"):
        query += " AND pm.stage = %(stage)s"

    if filters.get("year"):
        query += " AND pm.year = %(year)s"

    if filters.get("study_system"):
        if filters["study_system"] == "Morning":
            query += " AND d.custom_morning = 1"
        elif filters["study_system"] == "Evening":
            query += " AND d.custom_evening = 1"

    # Execute the query
    presented_modules = frappe.db.sql(query, filters, as_dict=True)
    
    for module in presented_modules:
        columns.append({
            "fieldname": module["name"].lower().replace(" ", "_"),
            "label": frappe._(module["module_name"]),
            "fieldtype": "Data",
            "width": 120
        })
        # Add sub-columns with custom fixed titles
        sub_columns = [
            {
                "fieldname": f"{module['name'].lower().replace(' ', '_')}_sub1",
                "label": frappe._(f"{module['module_name']} Sub1"),
                "fieldtype": "Data",
                "width": 120
            },
            {
                "fieldname": f"{module['name'].lower().replace(' ', '_')}_sub2",
                "label": frappe._(f"{module['module_name']} Sub2"),
                "fieldtype": "Data",
                "width": 120
            }
        ]
        columns.extend(sub_columns)
    
    return columns
