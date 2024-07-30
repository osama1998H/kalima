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

    # Fetch module grades for each student
    student_module_grades = get_student_module_grades(students, columns,filters)

    return {"columns": columns, "data": student_module_grades}

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
        module_name = module["module_name"].lower().replace(" ", "_")
        
        # Add module name column
        columns.append({
            "fieldname": module_fieldname,
            "module_name": module_name,
            "label": frappe._(module["module_name"]),
            "fieldtype": "Data",
            "width": 240
        })
        
        # Add sub-columns for the module
        for suffix in ['_a', '_b', '_c', '_d']:
            columns.append({
                "fieldname": f"{module_fieldname}{suffix}",
                "module_name": module_name,
                # "label": suffix[-1].upper(),
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

def get_student_module_grades(students, columns,filters):
    student_module_grades = []

    for student in students:
        student_data = {"student_name": student["name"], "modules": []}
        
        for col in columns:
            if col["fieldname"].endswith("_a"):
                module_name = col["module_name"]#[:-2]  # Remove the suffix to get the module name
                module_data = {"module_name": module_name}
                
                a,b,c,d = get_student_data(student["name"],module_name,filters)
                module_data["a"] = a#get_random_grade()
                module_data["b"] = b#get_random_grade()
                module_data["c"] = c#get_random_grade()
                module_data["d"] = d#get_random_grade()

                student_data["modules"].append(module_data)
        
            student_data["Status"] = get_random_grade()
            student_data["Grade"] = get_random_grade()
            student_data["Evaluation"] = get_random_grade()
            student_data["Notes"] = get_random_grade()
            
                
        student_module_grades.append(student_data)
    
    # print(student_module_grades)
    return student_module_grades

def get_random_grade():
    import random
    return random.randint(20, 100)


def get_student_data(student_name,module_name,filters):
    a,b,c,d = 0,0,0,0
    query = "1 = 1"
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
            
        
    std = {}
    form_assess = 0
    midterm = 0
    
    res_filters = {
        'student': student_name,
        'module': module_name,
        'academic_system_type':filters.get("study_system"),
        'stage':filters.get("stage"),
        'year':filters.get("year"),
        'department':filters.get("department"),
    }
    
    
    print("res_filters")
    print(res_filters)
    
    
    res_fields = ['net_score', 'score','result', 'round', 'midterm', 'type', 'present']
    
    final_exam_result = 0
    
    cons = frappe.get_list('Student Result Log', filters=res_filters, fields=res_fields)
    print("cons")
    print(cons)
                
    for cont in cons:
        if(cont.type == "Class Continuous Exam" or cont.type == "Assignment"):
            form_assess += cont.net_score
            midterm += cont.midterm
        else:
            if cont.round == round or True:
                final_exam_result = cont.result
                std["final_exam_result"]= final_exam_result if cont.present == 1 else 0

    
    a = form_assess
    b= final_exam_result
    c= a+b
    
        # Define the SQL query
    query = """
        SELECT ser.final_grade
        FROM `tabStudent Result Log` ser
        WHERE ser.student = %s
        and type = "Final Grade"
        and module = %s;
    """
    records = frappe.db.sql(query, (student_name,module_name), as_dict=True)

    try:
        d = records[0]["final_grade"]
    except:
        d=0
        
    return a,b,c,d