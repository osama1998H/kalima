import frappe
from frappe import _

def execute(filters=None):
    columns = get_columns(filters)
    data = get_data(filters)
    return columns, data

def get_columns(filters):
    # Get all unique module names from the filtered Student Attendance Entry
    module_names = frappe.db.sql_list("""
        SELECT DISTINCT module 
        FROM `tabStudent Attendance Entry` 
        WHERE {conditions}
    """.format(conditions=get_conditions(filters)))
    
    # Define fixed columns
    columns = [
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
        {
            "label": _("Class"),
            "fieldname": "class_name",
            "fieldtype": "Data",
            "width": 100,
        },
        {
            "label": _("Academic System Type"),
            "fieldname": "academic_system_type",
            "fieldtype": "Data",
            "width": 150,
        },
        {
            "label": _("Semester"),
            "fieldname": "semester",
            "fieldtype": "Data",
            "width": 100,
        },
    ]
    
    # Add columns for each module
    for module in module_names:
        columns.append({
            "label": _(module),
            "fieldname": frappe.scrub(module),
            "fieldtype": "Float",
            "width": 150,
        })

    return columns

def get_conditions(filters):
    conditions = ["1=1"]
    if filters.get('department'):
        conditions.append("department = '{0}'".format(filters['department']))
    if filters.get('stage'):
        conditions.append("stage = '{0}'".format(filters['stage']))
    if filters.get('year'):
        conditions.append("year = '{0}'".format(filters['year']))
    if filters.get('class'):
        conditions.append("class = '{0}'".format(filters['class']))
    if filters.get('academic_system_type'):
        conditions.append("academic_system_type = '{0}'".format(filters['academic_system_type']))
    if filters.get('semester'):
        conditions.append("semester = '{0}'".format(filters['semester']))
    
    return " AND ".join(conditions)

def get_data(filters):
    # Get all unique module names from the filtered Student Attendance Entry
    module_names = frappe.db.sql_list("""
        SELECT DISTINCT module 
        FROM `tabStudent Attendance Entry` 
        WHERE {conditions}
    """.format(conditions=get_conditions(filters)))
    
    # Fetch student attendance data
    query = """
        SELECT
            s.name AS student_name,
            s.department,
            s.stage,
            s.class AS class_name,
            s.academic_system_type,
            s.semester,
            COALESCE(SUM(CASE WHEN a.status = 'Absent' AND a.leave = 0 THEN 1 ELSE 0 END), 0) AS absent_count,
            COALESCE(SUM(CASE WHEN a.status = 'Present' AND a.leave = 0 THEN 1 ELSE 0 END), 0) AS present_count,
            COUNT(a.student) AS total_count
        FROM
            `tabStudent Attendance Entry` s
        LEFT JOIN
            `tabAttednance` a ON a.parent = s.name
        WHERE
            {conditions}
        GROUP BY
            s.name
    """.format(conditions=get_conditions(filters))
    
    students = frappe.db.sql(query, as_dict=True)
    
    data = []
    for student in students:
        row = {
            "student_name": student.student_name,
            "department": student.department,
            "stage": student.stage,
            "class_name": student.class_name,
            "academic_system_type": student.academic_system_type,
            "semester": student.semester,
        }
        
        # Add attendance percentage for each module
        for module in module_names:
            total_count = student.total_count if student.total_count > 0 else 1
            absent_percentage = (student.absent_count / total_count) * 100 if total_count > 0 else 0
            row[frappe.scrub(module)] = absent_percentage
        
        data.append(row)

    # Add total row
    data.append({
        "student_name": _("Total"),
        "department": "",
        "stage": "",
        "class_name": "",
        "academic_system_type": "",
        "semester": "",
        **{frappe.scrub(module): sum(student[frappe.scrub(module)] for student in data) / len(data) if len(data) > 0 else 0 for module in module_names}
    })

    return data
