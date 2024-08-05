import frappe
from frappe.model.document import Document
from frappe import _
from datetime import datetime, timedelta


class ApplicantStudent(Document):
    def validate(self):
        # Concatenate full name in Arabic
        self.full_name_in_arabic = f"{self.first_name} {self.middle_name} {self.last_name} {self.fourth_name}"
        
        # Validate age
        if self.date_of_birth:
            # Ensure date_of_birth is parsed as a datetime.date object
            if isinstance(self.date_of_birth, str):
                dob = datetime.strptime(self.date_of_birth, '%Y-%m-%d').date()
            else:
                dob = self.date_of_birth
            age = (datetime.now().date() - dob).days / 365.25
            if age < 17:
                frappe.throw(_("Age must be more than 17 years."))

    def before_save(self):
        self.full_name_in_arabic = f"{self.first_name} {self.middle_name} {self.last_name} {self.fourth_name}"
                
@frappe.whitelist()
def admit_student(doc_name, department, study_system):
    # Get the "Applicant Student" document
    applicant_doc = frappe.get_doc("Applicant Student", doc_name)

    # Get meta information for "Student" doctype
    student_meta = frappe.get_meta("Student")

    # Create a new "Student" document
    student_doc = frappe.new_doc("Student")

    # Iterate through fields in the "Applicant Student" document
    for field in applicant_doc.meta.fields:
        fieldname = field.fieldname

        # Only set the field if it exists in the "Student" DocType
        if student_meta.has_field(fieldname):
            student_doc.set(fieldname, applicant_doc.get(fieldname))

    # Generate email address
    email_prefix = applicant_doc.english_student_full_name.replace(" ", "").lower()
    custom_email_domain = "Kalima.com"
    email = f"{email_prefix}@{custom_email_domain}"

    # Create a new user
    user_doc = frappe.get_doc(
        {
            "doctype": "User",
            "email": (
                email
                if (applicant_doc.email == None or applicant_doc.email == "")
                else applicant_doc.email
            ),
            "first_name": applicant_doc.first_name,
            "last_name": applicant_doc.last_name,
            "roles": [{"role": "Student"}],
        }
    )
    user_doc.save()

    customer = frappe.get_doc(
        {
            "doctype": "Customer",
            "customer_name": student_doc.full_name_in_arabic,
            "customer_type": "Individual",
            "customer_group": "Individual",
            "territory": "All Territories",
            "portal_users": [{"user": user_doc.name}],
        }
    )
    customer.insert()
    
    
    student_doc.email = (
        email
        if (applicant_doc.email == None or applicant_doc.email == "")
        else applicant_doc.email
    )
    student_doc.customer = customer.name
    student_doc.final_selected_course = department
    student_doc.study_system = study_system
    student_doc.user = user_doc.name
    
    
    active_year = frappe.get_last_doc('Educational Year', filters={"active_year": 1})
    if(active_year == None):
        frappe.throw(_("Please Select The Active Year in Educaational Year"))
    
    student_doc.year = active_year
    student_doc.insert()
    student_doc.save()
    
    applicant_doc.admission_status = "Accepted"
    applicant_doc.save()
    
    return student_doc.name
