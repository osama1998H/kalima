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
    
    # print(student_module_grades)

    return {"columns": columns, "data": student_module_grades}

def get_columns(filters):
    columns = []

    query = """
        SELECT pm.name, pm.module
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

    query += " GROUP BY pm.module"

    presented_modules = frappe.db.sql(query, filters, as_dict=True)


    # Add main columns (module names) and sub-columns
    for module in presented_modules:
        print(module)
        module_fieldname = module["name"].lower().replace(" ", "_")
        module_name = module["module"].lower().replace(" ", "_")
        nm = module["name"]
        
        # Add module name column
        columns.append({
            "fieldname": module_fieldname,
            "module_name": module_name,
            "nm": nm,
            "label": frappe._(module["module"]),
            "fieldtype": "Data",
            "width": 240
        })
        
        # Add sub-columns for the module
        for suffix in ['_a', '_b', '_c', '_d']:
            columns.append({
                "fieldname": f"{module_fieldname}{suffix}",
                "nm": nm,
                "module_name": module_name,
                "label": "س" if suffix == "_a" else ("د" if suffix == "_b" else ("ن" if suffix == "_c" else "ق")),
                "fieldtype": "Data",
                "width": 60
            })

    for x in [1, 2]:
        # Add module name column
        columns.append({
            "fieldname": "try" + str(x),
            "module_name": "try" + str(x),
            "nm": "try" + str(x),
            "label": "Try " + str(x),
            "fieldtype": "Data",
            "width": 240
        })
        
        # Add sub-columns for the module
        for suffix in ['_a', '_b', '_c', '_d']:
            columns.append({
                "fieldname": f"try{str(x)}{suffix}",
                "nm": f"try{str(x)}",
                "module_name": f"try{str(x)}",
                "label": "س" if suffix == "_a" else ("د" if suffix == "_b" else ("ن" if suffix == "_c" else "ق")),
                "fieldtype": "Data",
                "width": 60
            })

    # for x in [1, 2]:
    #     columns.append({
    #         "fieldname": "try_module_" + str(x),
    #         "module_name": "try_module_" + str(x),
    #         "nm": "try_module_" + str(x),
    #         "label": "Try Module " + str(x),
    #         "fieldtype": "Data",
    #         "width": 240
    #     })
        
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

    std = 0
    for student in students:
        student_data = {"student_name": student["name"], "modules": []}

        failed_modules = 0
        ongoing = 0
        final_avg= 0
        
        tryy = 0
        

        for col in columns:
            if(not col["fieldname"].startswith("try")):
                if col["fieldname"].endswith("_a"):
                    module_name = col["module_name"]#[:-2]  # Remove the suffix to get the module name
                    module_data = {"module_name": module_name}
                    a,b,c,d = get_student_data(student["name"],col["nm"],filters)
                    module_data["a"] = a
                    module_data["b"] = b
                    module_data["c"] = c
                    module_data["d"] = d

                    student_data["modules"].append(module_data)
                    final_avg = final_avg + c+d
                    if(c + d < 50):
                        failed_modules =failed_modules+1
                    if(a == 0 or b == 0):
                        ongoing = ongoing+1

                studend_study_type = frappe.db.get_value("Student",student["name"],"academic_system_type")
                
                settings = frappe.get_single("Kalima Settings")
                permitted_not_passed_modules_in_a_year = 0
                if studend_study_type == "Annual":
                    permitted_not_passed_modules_in_a_year = settings.number_of_permited_fails_to_pass_a_year
                elif studend_study_type == "Coursat":
                    permitted_not_passed_modules_in_a_year = settings.courses_number_of_permited_fails_to_pass_a_year
                elif studend_study_type == "Bologna":
                    permitted_not_passed_modules_in_a_year = settings.bologna_number_of_permited_fails_to_pass_a_year
                
                student_data["Status"] = "Passed" if (permitted_not_passed_modules_in_a_year > failed_modules) else "Ongoing" if ongoing > 0 else "Failed" #"Passed" if c+d > 49 else "Failed"
                student_data["Grade"] = final_avg
                
                evaluation = ""
                if ongoing > 0:
                    evaluation = "Ongoing"
                else:
                    if final_avg <50:
                        evaluation = "Failed"
                    elif final_avg <60:
                        evaluation = "Acceptable"
                    elif final_avg <70:
                        evaluation = "Medium"
                    elif final_avg <80:
                        evaluation = "Good"
                    elif final_avg <90:
                        evaluation = "Very Good"
                    elif final_avg <100:
                        evaluation = "Excellent"
                    
                student_data["Evaluation"] =evaluation
                student_data["Notes"] = ""
            else:

                if col["fieldname"].endswith("_a"):
                    module_name = col["module_name"]
                    module_data = {"module_name": module_name}
                    a,b,c,d = get_student_tries_data(student["name"],filters,tryy)
                    module_data["a"] = a
                    module_data["b"] = b
                    module_data["c"] = c
                    module_data["d"] = d

                    student_data["modules"].append(module_data)
                    tryy = tryy +1

        student_module_grades.append(student_data)
    

    #remove here
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
        # 'academic_system_type':filters.get("study_system"),
        'stage':filters.get("stage"),
        # 'year':filters.get("year"),
        'department':filters.get("department"),
    }
    
    res_fields = ['net_score', 'score','result', 'round', 'midterm', 'type', 'present']
    
    final_exam_result = 0
    
    cons = frappe.get_list('Student Result Log', filters=res_filters, fields=res_fields)
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
        SELECT ser.final_grade,ser.curve
        FROM `tabStudent Result Log` ser
        WHERE ser.student = %s
        and type = "Final Grade"
        and module = %s;
    """
    records = frappe.db.sql(query, (student_name,module_name), as_dict=True)

    try:
        d = records[0]["curve"]
    except:
        d=0
        
    return a,b,c,d


def get_student_tries_data(student_name,filters,idx):
    
    student = frappe.get_doc("Student",student_name)
    tries_list = []
    for m in student.enrolled_modules:
        if(m.try_number != "Second"):
            module_name = m.module
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
                # 'academic_system_type':filters.get("study_system"),
                'stage':filters.get("stage"),
                # 'year':filters.get("year"),
                'department':filters.get("department"),
            }
            
            res_fields = ['net_score', 'score','result', 'round', 'midterm', 'type', 'present']
            
            final_exam_result = 0
            
            cons = frappe.get_list('Student Result Log', filters=res_filters, fields=res_fields)
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
                SELECT ser.final_grade,ser.curve
                FROM `tabStudent Result Log` ser
                WHERE ser.student = %s
                and type = "Final Grade"
                and module = %s;
            """
            records = frappe.db.sql(query, (student_name,module_name), as_dict=True)

            try:
                d = records[0]["curve"]
            except:
                d=0
                
            # return a,b,c,d
            tries_list.append([a,b,c,d]) 

    # print(tries_list)
    try:
        return tries_list[idx]
    except:
        return [0,0,0,0]
    
    
    
def has_module(student, module_name):
    for module in student['modules']:
        if module['module_name'] == module_name:
            return True
    return False

def student_has_module(students, module_name):
    for student in students:
        return has_module(student, module_name)
    return False