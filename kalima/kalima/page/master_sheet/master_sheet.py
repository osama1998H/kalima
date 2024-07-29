import frappe
from frappe import _
import json

@frappe.whitelist()
def get_master_sheet_data(filters=None):
    filters = json.loads(filters)
    columns, data = [], []

    # Fetch columns based on the filters
    module_columns = get_columns(filters)
    columns.extend(module_columns)

    # Fetch student data based on filters
    students = get_students(filters)

    # Populate data with actual values
    for student in students:
        row = {"student": student["name"]}
        for col in columns[1:]:  # Skip the first column (student)
            row[col["fieldname"]] = get_student_grade_data(student["name"], col["fieldname"])
        data.append(row)

    return {"columns": columns, "data": data}

def get_columns(filters):
    columns = []

    query = """
        SELECT pm.name, pm.module_name
        FROM `tabPresented Module` pm
        LEFT JOIN `tabDepartment` d ON pm.department = d.name
        WHERE 1 = 1
    """

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

    presented_modules = frappe.db.sql(query, filters, as_dict=True)

    # Add main columns (module names) and sub-columns
    for module in presented_modules:
        module_fieldname = module["name"].lower().replace(" ", "_")
        
        # Add module name column
        columns.append({
            "fieldname": module_fieldname,
            "label": frappe._(module["module_name"]),
            "fieldtype": "Data",
            "width": 240
        })
        
        # Add sub-columns for the module
        for suffix in ['_a', '_b', '_c', '_d']:
            columns.append({
                "fieldname": f"{module_fieldname}{suffix}",
                "label": "س" if suffix == "_a" else ("د" if suffix == "_b" else ("ن" if suffix == "_c" else ("ق"))),
                "fieldtype": "Data",
                "width": 60
            })

    return columns

def get_students(filters):
    query = """
        SELECT DISTINCT s.name
        FROM `tabStudent` s
        INNER JOIN `tabStudent Enrolled Modules` sem
        ON s.name = sem.parent
        WHERE 1 = 1
    """

    if filters.get("academic_system_type"):
        query += " AND s.academic_system_type = %(academic_system_type)s"
    if filters.get("department"):
        query += " AND s.final_selected_course = %(department)s"
    if filters.get("module"):
        query += " AND sem.module = %(module)s"

    students = frappe.db.sql(query, filters, as_dict=True)
    return students

def get_student_grade_data(student_name, fieldname):
    module_name, grade_type = fieldname.rsplit('_', 1)
    result_type_map = {
        "a": "Class Continuous Exam",
        "b": "Student Exam Result",
        "c": "Cumulative",
        "d": "Final Grade"
    }
    result_type = result_type_map.get(grade_type)
    if not result_type:
        return ""

    if result_type == "Cumulative":
        continuous_exam = get_student_result(student_name, module_name, "Class Continuous Exam")
        student_exam = get_student_result(student_name, module_name, "Student Exam Result")
        return continuous_exam + student_exam

    return get_student_result(student_name, module_name, result_type)

def get_student_result(student_name, module_name, result_type):
    result_filters = {
        'student': student_name,
        'module': module_name,
        'type': result_type
    }
    results = frappe.get_list('Student Result Log', filters=result_filters, fields=['net_score', 'score', 'result', 'present'])

    if not results:
        return ""

    if result_type in ["Class Continuous Exam", "Student Exam Result"]:
        return sum(r.net_score for r in results)

    if result_type == "Final Grade":
        for r in results:
            if r.present == 1:
                return r.result

    return ""
