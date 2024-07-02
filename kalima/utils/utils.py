import frappe
import json
from datetime import datetime, timedelta

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
        ORDER BY sae.date DESC
    """
    
    # Execute the SQL query
    records = frappe.db.sql(query, (student_name,), as_dict=True)
    # for r in records:
    return records



# @frappe.whitelist()
# def get_student_results(student_name):
#     print(student_name)

#     # Define the SQL query
#     query = """
#         SELECT ser.*
#         FROM `tabStudent Exam Result` ser
#         WHERE ser.student = %s;
#     """
#     records = frappe.db.sql(query, (student_name,), as_dict=True)
#     print(records)
#     return records

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

            'exam_max_result': result["exam_mark"],
            'result':result["final_result"],
            'status': result["status"],
            'cheating': 0 if result["cheating"] == "No" else 1,
            'present': 1 if result["cheating"] == "Yes" else 1,
        })
        doc.insert()
        doc.submit()


        # doc = frappe.get_doc({
        #     'doctype': 'Student Exam Result',
            
        #     'prototype': result["prototype"],
        #     'student': result["student_name"],
        #     'module': result["module"],
        #     'teacher': result["teacher"],
            
        #     'exam_max_result': result["exam_mark"],
        #     'result':result["final_result"],
        #     'status': result["status"],
        #     'cheating': 0 if result["cheating"] == "No" else 1,
        #     'present': 1 if result["cheating"] == "Yes" else 1,
        # })
        # doc.insert()
        # doc.submit()
        
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
            # 'module': module,
            # 'type': "Class Continuous Exam",
            # 'semester': semester,
            'stage': stage,
            # 'round': round,
        }
        
        res_fields = ['net_score', 'score', 'midterm', 'type', 'present']
        
        final_exam_result = 0
        
        cons = frappe.get_list('Student Result Log', filters=res_filters, fields=res_fields)
        for cont in cons:
            if(cont.type == "Class Continuous Exam"):
                form_assess += cont.net_score
                midterm += cont.midterm
            else:
                final_exam_result = cont.result
                
        std["formative_assessment"]=form_assess
        std["midterm"]=midterm
        std["name"]=student.name
        std["present"]="Yes" if student.present == 1 else "No"
        std["final_exam_result"]= student.final_exam_result if student.present == 1 else 0

        
        
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
            

# user_type = lend_book.get('user_type')
            
# # Fetch Borrowing Limitations settings
# borrowing_limitations = frappe.get_single("Borrowing Limitations")

# # Get the number of days for the due date based on the user type
# if user_type == "Undergraduate Student":
#     due_days = borrowing_limitations.undergraduate_student
# elif user_type == "Master Student":
#     due_days = borrowing_limitations.master_student
# elif user_type == "Phd Student":
#     due_days = borrowing_limitations.phd_student
# elif user_type == "Employee":
#     due_days = borrowing_limitations.employee
# elif user_type == "Teacher":
#     due_days = borrowing_limitations.teacher
# elif user_type == "Special":
#     due_days = borrowing_limitations.special
# else:
#     due_days = 0 # Default to 0 if user type is not recognized
