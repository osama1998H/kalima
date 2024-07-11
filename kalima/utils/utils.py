import frappe
import json
from datetime import datetime, timedelta


@frappe.whitelist()
def get_sessions(student_classes):
    student_classes = json.loads(student_classes)
    student_classes_str = ', '.join([f"'{cls}'" for cls in student_classes])

    query = f"""
        SELECT
            cs.module,
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
            cs.module, cs.title, cs.class, cs.issue_date, cs.expiration_date, cs.description
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
    print(student_name)

    # Define the SQL query
    query = """
        SELECT ser.*
        FROM `tabStudent Result Log` ser
        WHERE ser.student = %s;
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

            'exam_max_result': result["exam_mark"],
            'result':result["final_result"],
            'status': result["status"],
            'cheating': 0 if result["cheating"] == "No" else 1,
            'present': 1 if result["cheating"] == "Yes" else 1,
        })
        doc.insert()
        doc.submit()

    return "Results submitted successfully"



@frappe.whitelist()
def get_student_sheet( stage, department,module,semester,round):
    filters = {
        'stage': stage,
        'final_selected_course': department
    }
    
    fields = ['name', 'stage', 'final_selected_course']
    
    students = frappe.get_list('Student', filters=filters, fields=fields)
    
    stds= []
    for student in students:   
        std = {}
        form_assess = 0
        midterm = 0
        res_filters = {
            'student': student.name,
            'module': module,
            'stage': stage,
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

        std["formative_assessment"]=form_assess
        std["midterm"]=midterm
        std["name"]=student.name
        std["present"]="Yes" if student.present == 1 else "No"
        # std["final_exam_result"]= final_exam_result if student.present == 1 else 0
        
        stds.append(std)
  
    return stds

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
    