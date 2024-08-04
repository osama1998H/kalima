
import frappe
import json
from datetime import datetime, timedelta
import json
from frappe import _
from utils import update_student_stage


@frappe.whitelist()
def get_student_sheet_annual(module,round):
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

        
        for cont in cons:
            
            if(cont.final_exam_type == "Annual Half Year Exam"):
                midterm += cont.midterm
            
            if(cont.type == "Class Continuous Exam" or cont.type == "Assignment"):
                form_assess += cont.net_score
                # midterm += cont.midterm
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
def submit_student_sheet_annual(form_data, students_data):
    settings = frappe.get_single("Kalima Settings")

    if(settings.annual_max_number_of_simultaneous_tries == 0 or settings.courses_max_number_of_simultaneous_tries == 0 or settings.bologna_max_number_of_simultaneous_tries == 0 ):
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
