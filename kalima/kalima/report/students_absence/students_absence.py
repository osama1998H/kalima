# import frappe
# from frappe import _

# def execute(filters=None):
#     columns = get_columns(filters)
#     data = get_data(filters)
#     return columns, data

# def get_columns(filters):
#     # Get all unique module names from the filtered Student Attendance Entry
#     module_names = frappe.db.sql_list("""
#         SELECT DISTINCT module 
#         FROM `tabStudent Attendance Entry` 
#         WHERE {conditions}
#     """.format(conditions=get_conditions(filters)))
    
#     # Define fixed columns
#     columns = [
#         {
#             "label": _("Student Name"),
#             "fieldname": "student_name",
#             "fieldtype": "Data",
#             "width": 200,
#         },
#     ]
    
#     # Add columns for each module
#     for module in module_names:
#         columns.append({
#             "label": _(module),
#             "fieldname": frappe.scrub(module),
#             "fieldtype": "Float",
#             "width": 150,
#         })

#     return columns

# def get_conditions(filters):
#     conditions = ["1=1"]
#     if filters.get('department'):
#         conditions.append("department = '{0}'".format(filters['department']))
#     if filters.get('stage'):
#         conditions.append("stage = '{0}'".format(filters['stage']))
#     if filters.get('year'):
#         conditions.append("year = '{0}'".format(filters['year']))
#     if filters.get('class'):
#         conditions.append("class = '{0}'".format(filters['class']))
#     if filters.get('academic_system_type'):
#         conditions.append("academic_system_type = '{0}'".format(filters['academic_system_type']))
#     if filters.get('semester'):
#         conditions.append("semester = '{0}'".format(filters['semester']))
    
#     return " AND ".join(conditions)

# def get_data(filters):
#     # Get all unique module names from the filtered Student Attendance Entry
#     module_names = frappe.db.sql_list("""
#         SELECT DISTINCT module 
#         FROM `tabStudent Attendance Entry` 
#         WHERE {conditions}
#     """.format(conditions=get_conditions(filters)))
    
#     # Fetch student attendance data
#     query = """
#         SELECT
#             a.student AS student_name,
#             s.module,
#             s.department,
#             s.stage,
#             s.class AS class_name,
#             s.academic_system_type,
#             s.semester,
#             SUM(a.number_of_hours) AS total_lecture_duration,
#             SUM(CASE WHEN a.leave = 1 THEN a.number_of_hours ELSE a.attendance_duration END) AS total_attendance_duration
#         FROM
#             `tabStudent Attendance Entry` s
#         LEFT JOIN
#             `tabAttednance` a ON a.parent = s.name
#         WHERE
#             {conditions}
#         GROUP BY
#             a.student, s.module
#     """.format(conditions=get_conditions(filters))
    
#     attendance_data = frappe.db.sql(query, as_dict=True)
    
#     student_data = {}
#     for entry in attendance_data:
#         student_name = entry.student_name
#         module = frappe.scrub(entry.module)
#         if student_name not in student_data:
#             student_data[student_name] = {
#                 "student_name": student_name,
#                 "department": entry.department,
#                 "stage": entry.stage,
#                 "class_name": entry.class_name,
#                 "academic_system_type": entry.academic_system_type,
#                 "semester": entry.semester,
#                 **{frappe.scrub(mod): 0 for mod in module_names}
#             }
        
#         total_lecture_duration = entry.total_lecture_duration if entry.total_lecture_duration > 0 else 1
#         attendance_percentage = (entry.total_attendance_duration / total_lecture_duration) * 100
#         student_data[student_name][module] = attendance_percentage
    
#     return list(student_data.values())



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
    ]
    
    # Add columns for each module
    for module in module_names:
        columns.append({
            "label": _(module),
            "fieldname": frappe.scrub(module),
            "fieldtype": "Data",
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

def get_warning_text(absence_percentage, settings):
    if absence_percentage >= settings.final_warning:
        return "Final Warning"
    elif absence_percentage >= settings.second_warning:
        return "Second Warning"
    elif absence_percentage >= settings.first_warning:
        return "First Warning"
    elif absence_percentage >= settings.notify:
        return "Notify"
    else:
        return "None"

def get_data(filters):
    # Fetch settings from Kalima Settings
    settings = frappe.get_doc("Kalima Settings")
    
    # Get all unique module names from the filtered Student Attendance Entry
    module_names = frappe.db.sql_list("""
        SELECT DISTINCT module 
        FROM `tabStudent Attendance Entry` 
        WHERE {conditions}
    """.format(conditions=get_conditions(filters)))
    
    # Fetch student attendance data
    query = """
        SELECT
            a.student AS student_name,
            s.module,
            s.department,
            s.stage,
            s.class AS class_name,
            s.academic_system_type,
            s.semester,
            SUM(a.number_of_hours) AS total_lecture_duration,
            SUM(CASE WHEN a.leave = 1 THEN a.number_of_hours ELSE a.attendance_duration END) AS total_attendance_duration
        FROM
            `tabStudent Attendance Entry` s
        LEFT JOIN
            `tabAttednance` a ON a.parent = s.name
        WHERE
            {conditions}
        GROUP BY
            a.student, s.module
    """.format(conditions=get_conditions(filters))
    
    attendance_data = frappe.db.sql(query, as_dict=True)
    
    student_data = {}
    for entry in attendance_data:
        student_name = entry.student_name
        module = frappe.scrub(entry.module)
        if student_name not in student_data:
            student_data[student_name] = {
                "student_name": student_name,
                "department": entry.department,
                "stage": entry.stage,
                "class_name": entry.class_name,
                "academic_system_type": entry.academic_system_type,
                "semester": entry.semester,
                **{frappe.scrub(mod): "None" for mod in module_names}
            }
        
        total_lecture_duration = entry.total_lecture_duration if entry.total_lecture_duration > 0 else 1
        absence_percentage = ((total_lecture_duration - entry.total_attendance_duration) / total_lecture_duration) * 100
        student_data[student_name][module] = get_warning_text(absence_percentage, settings)
    
    return list(student_data.values())
