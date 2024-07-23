import frappe
import json
from datetime import datetime, timedelta
import json

@frappe.whitelist()
def get_sessions(student_name):
    student_classes = get_student_classes(student_name)
    # Join the list elements into a single string with each element quoted
    student_classes_str = ', '.join(f"'{cls}'" for cls in student_classes)

    query = f"""
        SELECT
            cs.`module`,
            cs.title,
            cs.class,
            cs.issue_date,
            cs.expiration_date,
            cs.description,
            GROUP_CONCAT(af.file SEPARATOR ', ') as session_files
        FROM
            `tabClass Session` cs
        LEFT JOIN
            `tabAssignment Files` af
        ON
            cs.name = af.parent
        WHERE
            cs.class IN ({student_classes_str})
        GROUP BY
            cs.`module`, cs.title, cs.class, cs.issue_date, cs.expiration_date, cs.description
        ORDER BY
            cs.issue_date DESC
    """

    data = frappe.db.sql(query, as_dict=True)

    # If you need session_files as a list instead of a comma-separated string
    for item in data:
        if item.get('session_files'):
            item['session_files'] = item['session_files'].split(', ')

    return data

@frappe.whitelist()
def get_classes_for_teacher(teacher_name):
    classes = frappe.get_all("Class Teachers", filters={"teacher": teacher_name}, fields=["parent"])
    class_names = [cls["parent"] for cls in classes]
    return class_names


@frappe.whitelist()
def get_student_attendance(student_name):
    # Define the SQL query
    query = """
        SELECT sae.*,sad.*
        FROM `tabStudent Attendance Entry` sae
        JOIN `tabAttednance` sad
        ON sae.name = sad.parent
        WHERE sad.student = %s
        and sae.year = (select name from `tabEducational Year` where active_year = 1)
        ORDER BY sae.date DESC
    """
    
    # Execute the SQL query
    records = frappe.db.sql(query, (student_name,), as_dict=True)
    # for r in records:
    return records

@frappe.whitelist()
def get_student_results(student_name):
    # Define the SQL query
    query = """
        SELECT ser.*
        FROM `tabStudent Result Log` ser
        WHERE ser.student = %s;
    """
    records = frappe.db.sql(query, (student_name,), as_dict=True)
    return records


@frappe.whitelist()
def get_student_final_results(student_name):
import logging

logger = logging.getLogger(__name__)

@frappe.whitelist()
def get_student_final_results(student_name):
    logger.info(f"student_name: {student_name}")

    # Define the SQL query
    query = """
        SELECT ser.*
        FROM `tabStudent Result Log` ser
        WHERE ser.student = %s
        and type = "Final Grade";
    """
    records = frappe.db.sql(query, (student_name,), as_dict=True)
    return records

@frappe.whitelist()
def get_current_user_student():
    user = frappe.session.user
    student = frappe.get_all('Student', filters={'user': user}, fields=['name', ])
    return student[0] if student else None

@frappe.whitelist()
def submit_student_results(student_results):

    student_results = json.loads(student_results)
    for result in student_results:
        doc = frappe.get_doc({
            'doctype': 'Student Result Log',

            'type': 'Student Exam Result',

            'prototype': result["prototype"],
            'student': result["student_name"],
            'module': result["module"],
            'teacher': result["teacher"],
            'round': result["round"],
            'stage': result["stage"],
            'academic_system_type': result["academic_system_type"],

            'exam_max_result': result["exam_mark"],
            'result':result["final_result"],
            'status': result["status"],
            'cheating': 0 if result["cheating"] == "No" else 1,
            'present': 1 if result["cheating"] == "Yes" else 1,
        })
        doc.insert()
        doc.submit()

    return "Results submitted successfully"



# @frappe.whitelist()
# def get_student_sheet( stage, department,module,semester,academic_system_type,round):
#     filters = {
#         'stage': stage,
#         'academic_system_type': academic_system_type,
#         'final_selected_course': department
#     }
    
#     fields = ['name', 'stage', 'final_selected_course']
    
#     students = frappe.get_list('Student', filters=filters, fields=fields)

#     stds= []
#     for student in students:   
#         std = {}
#         form_assess = 0
#         midterm = 0
#         res_filters = {
#             'student': student.name,
#             'module': module,
#             'stage': stage,
#             'academic_system_type': academic_system_type,
#         }
        
            
#         res_fields = ['net_score', 'score','result', 'round', 'midterm', 'type', 'present']
        
#         final_exam_result = 0
        
#         cons = frappe.get_list('Student Result Log', filters=res_filters, fields=res_fields)


#         for cont in cons:
#             if(cont.type == "Class Continuous Exam" or cont.type == "Assignment"):
#                 form_assess += cont.net_score
#                 midterm += cont.midterm
#             else:
#                 if cont.round == round or True:
#                     final_exam_result = cont.result
#                     std["final_exam_result"]= final_exam_result if cont.present == 1 else 0

#         std["formative_assessment"]=form_assess
#         std["midterm"]=midterm
#         std["name"]=student.name
#         std["present"]="Yes" if student.present == 1 else "No"
#         # std["final_exam_result"]= final_exam_result if student.present == 1 else 0
        
#         stds.append(std)

#     return stds


@frappe.whitelist()
def get_student_sheet(module,round):
    modl = frappe.get_doc("Presented Module", module)
    academic_system_type = modl.academic_system_type
    department = modl.department

    query = """
        SELECT s.name
        FROM `tabStudent` s
        INNER JOIN `tabStudent Enrolled Modules` sem
        ON s.name = sem.parent
        WHERE s.academic_system_type = %s
        AND s.final_selected_course = %s
        AND sem.module = %s
        AND sem.status != 'Passed'
    """

    students = frappe.db.sql(query, (academic_system_type, department, module), as_dict=True)
    print("students")
    print(students)
    # return
    stds= []
    for student in students:   
        std = {}
        form_assess = 0
        midterm = 0
        res_filters = {
            'student': student.name,
            'module': modl.name,
            # 'stage': modl.stage,
            'academic_system_type':modl.academic_system_type,
        }
        
            
        res_fields = ['net_score', 'score','result', 'round', 'midterm', 'type', 'present']
        
        final_exam_result = 0
        
        cons = frappe.get_list('Student Result Log', filters=res_filters, fields=res_fields)

        # print("cons")
        # print(cons)
        # print(modl.academic_system_type)
        # print(modl.name)
        
        for cont in cons:
            if(cont.type == "Class Continuous Exam" or cont.type == "Assignment"):
                form_assess += cont.net_score
                midterm += cont.midterm
            else:
                if cont.round == round or True:
                    final_exam_result = cont.result
                    std["final_exam_result"]= final_exam_result if cont.present == 1 else 0

        std["formative_assessment"]=form_assess
        std["midterm"]=midterm
        std["name"]=student.name
        std["present"]="Yes" if student.present == 1 else "No"
        # std["final_exam_result"]= final_exam_result if student.present == 1 else 0
        
        stds.append(std)

    return stds

@frappe.whitelist()
def submit_student_sheet(form_data, students_data):
    settings = frappe.get_single("Kalima Settings")

def check_simultaneous_tries(settings):
    return (
        settings.annual_max_number_of_simultaneous_tries == 0 or
        settings.courses_max_number_of_simultaneous_tries == 0 or
        settings.bologna_max_number_of_simultaneous_tries == 0
    )

if check_simultaneous_tries(settings):
    frappe.throw(_("Please Set Try Number in Settings"))

    form_data = frappe._dict(json.loads(form_data))
    students_data = json.loads(students_data)
    
    for std in students_data:
        # Check if a record with the same student, type, module, round, and stage already exists
        existing_record = frappe.db.exists('Student Result Log', {
            'student': std["name"],
            'type': 'Final Grade',
            'module': form_data["module"],
            'round': form_data["round"],
            'stage': form_data["stage"]
        })

        # if not not existing_record:
        doc = frappe.get_doc({
            'doctype': 'Student Result Log',
            'type': 'Final Grade',
            'year':  form_data["year"],

            'module': form_data["module"],
            'round': form_data["round"],
            'stage': form_data["stage"],
            'academic_system_type': form_data["academic_system_type"],
            
            'final_status': "Passed" if (float(std["result"]) > 49) else "Failed" ,

            'student': std["name"],
            'final_grade': std["result"],
            'curve': form_data["curve"],
            'note': std["notes"],
            'status': std["status"],
        })
        doc.insert()
        doc.submit()
        
        update_student_stage(std["name"],std["status"] == "Passed",form_data["module"])
            
        # else:
        #     print(f"Record already exists for student: {std['name']}")

    print("Form Data:", form_data)
    print("Students Data:", students_data)

    return 'Results submitted successfully!'


@frappe.whitelist()
def get_student_from_prototype(module):
    module = frappe.get_doc("Presented Module",module)
    
    academic_system_type = module.academic_system_type
    department = module.department

    query = """
        SELECT s.name
        FROM `tabStudent` s
        INNER JOIN `tabStudent Enrolled Modules` sem
        ON s.name = sem.parent
        WHERE s.academic_system_type = %s
        AND s.final_selected_course = %s
        AND sem.module = %s
        AND sem.status != 'Passed'
    """

    students = frappe.db.sql(query, (academic_system_type, department, module.name), as_dict=True)
    print("students")
    print(students)
    print(academic_system_type)
    print(department)
    print(module)
    return students
    
@frappe.whitelist()
def update_student_stage(student_name,passed,module):
    passed = (passed == "1")
    
    student = frappe.get_doc("Student", student_name)
    passed_all = True
    try_count = 0
    settings = frappe.get_single("Kalima Settings")
    permitted_not_passed_modules_in_a_year = 0
    not_passed_modules_in_a_year = 0

    if student.academic_system_type == "Annual":
        try_threshold = settings.annual_max_number_of_simultaneous_tries
        permitted_not_passed_modules_in_a_year = settings.number_of_permited_fails_to_pass_a_year
    elif student.academic_system_type == "Coursat":
        try_threshold = settings.courses_max_number_of_simultaneous_tries
        permitted_not_passed_modules_in_a_year = settings.courses_number_of_permited_fails_to_pass_a_year
    elif student.academic_system_type == "Bologna":
        try_threshold = settings.bologna_max_number_of_simultaneous_tries
        permitted_not_passed_modules_in_a_year = settings.bologna_number_of_permited_fails_to_pass_a_year
        
    modules_stages = set()
    # modules_stages = {}
    for mod in student.enrolled_modules:
        modules_stages.add(mod.stage)
        if mod.module == module:
            if(passed):
                mod.status = "Passed"
                print("setting to passed")
            else:
                rounds = [
                    "First",
                    "Second",
                    "Third",
                ]
                current_round_index = rounds.index(mod.round)
                mod.status = "Failed"

                if current_round_index == len(rounds) - 1:
                    print(f"Student Failed")
                    print(mod.try_number)
                    
                    if(mod.try_number == "Second"):
                        mod.try_number = "Third"               
                    elif(mod.try_number == "Third"):
                        mod.try_number = "Fourth"
                    elif(mod.try_number == "Fourth"):
                        pass
                    
                    mod.round = "First"
                        # mod.try_number = "Third"
                else:
                    print("next round")
                    mod.round = rounds[current_round_index + 1]
                    
            if(mod.status == "Failed" or mod.status == "Ongoing"):
                try_count = try_count + 1
                
            if(try_count > try_threshold):
                passed_all = False 

        if(mod.stage == student.stage and mod.status != "Passed"):
            not_passed_modules_in_a_year = not_passed_modules_in_a_year + 1

    if(not_passed_modules_in_a_year > permitted_not_passed_modules_in_a_year):
        passed_all = False
    
    if(passed_all):
        # Define the stage options
        stages = [
            "First Year",
            "Second Year",
            "Third Year",
            "Fourth Year",
            "Fifth Year"
        ]
        
        # Find the current stage index
        try:
            current_stage_index = stages.index(student.stage)
        except ValueError:
            print(f"Invalid stage '{student.stage}' for student '{student_name}'")
            return

        # Check if it is the last stage
        if(student.academic_system_type == "Annual" or student.academic_system_type == "Coursat"):
            if current_stage_index == len(stages) - 1:
                print(f"Student '{student_name}' is already in the last stage: {student.stage}")
            else:
                
                if(stages[current_stage_index]  in modules_stages):
                    student.stage = stages[current_stage_index + 1]
                    student.save()
                    frappe.db.commit()  # Commit the changes to the database
                    print(f"Student '{student_name}' stage updated to: {student.stage}")
    else:
        pass
    
    student.save()

    return True

def fines():
    current_date = datetime.now()

    # Fetch Lend Book records where the difference between current date and creation date is greater than borrowing_days
    lend_books = frappe.get_all(
        "Lend Book",
        filters={
            'creation': ('>', (current_date - timedelta(days=30)).strftime('%Y-%m-%d %H:%M:%S'))  # Example: 30 days ago
        },
        fields=["name", "creation", "borrowing_days", "extra_period", "book", "user", "user_type", "fine_amount"]
    )
    
    for lend_book in lend_books:
        creation_date = lend_book.get('creation')
        borrowing_days = int(lend_book.get('borrowing_days')) + int(lend_book.get('extra_period'))

        # Calculate the difference in days between the current date and the creation date
        day_difference = (current_date - creation_date).days

        if day_difference > borrowing_days:
   
            due_date = current_date + timedelta(days=3)

            # Create a new Fine document
            fine_doc = frappe.get_doc({
                "doctype": "Fines",
                "book": lend_book.get('book'),
                "user": lend_book.get('user'),
                "status": "Unpaid",
                "amount": lend_book.get('fine_amount'),
                "due_date": due_date
            })
            fine_doc.insert()
            frappe.db.commit()
            

@frappe.whitelist()
def get_student_classes(student_name):
    query = """
        SELECT sae.name
        FROM `tabClass` sae
        JOIN `tabClass Students` sad
        ON sae.name = sad.parent
        WHERE sad.student = %s
    """
    
    # Execute the SQL query
    records = frappe.db.sql(query, (student_name,), as_dict=True)
    print(records)
    lst = []
    for r in records:
        lst.append(r["name"])
        
    return lst
    
    
@frappe.whitelist()
def get_student_tasks(student_name):
    student_classes = get_student_classes(student_name)
    # Join the list elements into a single string with each element quoted
    student_classes_str = ', '.join(f"'{cls}'" for cls in student_classes)

    query = f"""
        SELECT
            at.*,
            af.*
        FROM
            `tabAssignments and Tasks` at
        LEFT JOIN
            `tabAssignment Files` af
        ON
            at.name = af.parent
        WHERE
            at.class IN ({student_classes_str})
    """
    
    # Execute the SQL query
    records = frappe.db.sql(query, as_dict=True)
    
    return records
