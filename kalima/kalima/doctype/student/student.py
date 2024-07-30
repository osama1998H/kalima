# Copyright (c) 2024, e2next and contributors
# For license information, please see license.txt
from frappe.utils.password import update_password
import frappe
from frappe.model.document import Document
from frappe import _

class Student(Document):
    
	def after_insert(doc):
		print(doc.customer)
		print(doc.user)
		if((doc.customer == None or doc.customer == "") and (doc.user == None or doc.user == "")):
			# Generate email address
			email_prefix = doc.english_student_full_name.replace(" ", "").lower()
			custom_email_domain = "Kalima.com"
			email = f"{email_prefix}@{custom_email_domain}"

			# Create a new user
			user_doc = frappe.get_doc(
				{
					"doctype": "User",
					"email": (
						email
						if (doc.email == None or doc.email == "")
						else doc.email
					),
					"first_name": doc.first_name,
					"last_name": doc.last_name,
					"roles": [{"role": "Student"}],
				}
			)
			user_doc.save()

			customer = frappe.get_doc(
				{
					"doctype": "Customer",
					"customer_name": doc.full_name_in_arabic,
					"customer_type": "Individual",
					"customer_group": "Individual",
					"territory": "All Territories",
					"portal_users": [{"user": user_doc.name}],
				}
			)
			customer.insert()
   
			doc.customer = customer.name
			doc.user = user_doc.name
			doc.save()

	def before_save(doc):
		if(len(doc.ministry_exam_results) > 0):
			ttl=0
			for r in doc.ministry_exam_results:
				ttl += r.mark
	
			doc.total = ttl
			doc.final_average = ttl/len(doc.ministry_exam_results)
   
		doc.full_name_in_arabic = f"{doc.first_name} {doc.middle_name} {doc.last_name} {doc.fourth_name}"
                
	def after_save(doc):
		# user = frappe.get_doc("User", doc.user)
		if(doc.password != None and doc.password != ""):
			if(doc.password == doc.confirm_password):
				update_password(doc.user, doc.password)
				frappe.db.commit()
			else:
				frappe.throw("Passwords do not match")
	def validate(self):
		self.check_student_stage()

	def check_student_stage(self):
		# Get the number of permitted fails to pass a year from Kalima Setting
		kalima_setting = frappe.get_single("Kalima Settings")
		if(self.academic_system_type == "Coursat"):
			number_of_permitted_fails_to_pass_a_year = kalima_setting.get("courses_number_of_permited_fails_to_pass_a_year")
		elif(self.academic_system_type == "Annual"):
			number_of_permitted_fails_to_pass_a_year = kalima_setting.get("number_of_permited_fails_to_pass_a_year")
		elif(self.academic_system_type == "Bologna"):
			number_of_permitted_fails_to_pass_a_year = kalima_setting.get("bologna_number_of_permited_fails_to_pass_a_year")

		# Stage mapping: map stage names to numeric values
		stage_mapping = {
			'First Year': 1,
			'Second Year': 2,
			'Third Year': 3,
			'Fourth Year': 4,
			'Fifth Year': 5
		}

		# Initialize a dictionary to count passed modules per stage
		passed_modules_per_stage = {}
		total_modules_per_stage = {}
		
		# Initialize the highest stage the student qualifies for
		highest_qualified_stage = 0

		for module in self.enrolled_modules:
			stage_num = stage_mapping.get(module.stage, 0)
			
			if stage_num not in passed_modules_per_stage:
				passed_modules_per_stage[stage_num] = 0
				total_modules_per_stage[stage_num] = 0

			total_modules_per_stage[stage_num] += 1
			
			if module.status == "Passed":
				passed_modules_per_stage[stage_num] += 1
    
		print("passed_modules_per_stage")
		print(passed_modules_per_stage)

		# Determine the highest stage the student qualifies for
		for stage_num, passed_count in passed_modules_per_stage.items():
			total_modules = total_modules_per_stage[stage_num]
			permitted_fails = total_modules - number_of_permitted_fails_to_pass_a_year
			
			if passed_count >= permitted_fails:
				highest_qualified_stage = max(highest_qualified_stage, stage_num)
		
		# Add one to the highest qualified stage
		highest_qualified_stage += 1
		print("highest_qualified_stage")
		print(highest_qualified_stage)

		# Map the numeric stage back to the stage name
		reversed_stage_mapping = {v: k for k, v in stage_mapping.items()}
		new_stage_name = reversed_stage_mapping.get(highest_qualified_stage, "Unknown Stage")
		print("new_stage_name")
		print(new_stage_name)
		print("reversed_stage_mapping")
		print(reversed_stage_mapping)

		# Correct the student's stage if necessary
		if self.stage != new_stage_name:
			frappe.msgprint(_("Student's stage corrected from {0} to {1} based on passed modules.").format(self.stage, new_stage_name), alert=True)
			self.stage = new_stage_name
			
	def correct_stage(self, last_stage, passed_modules_count, permitted_fails):
		# Define the stages and their order
		stages = ["First Year", "Second Year", "Third Year", "Fourth Year"]

		if last_stage in stages:
			current_index = stages.index(self.stage)
			last_stage_index = stages.index(last_stage)
			next_stage_index = last_stage_index + 1

			# Determine the correct stage
			if passed_modules_count >= permitted_fails:
				if next_stage_index < len(stages):
					correct_stage = stages[next_stage_index]
				else:
					correct_stage = stages[last_stage_index]
			else:
				correct_stage = stages[last_stage_index]

			# Update the stage if necessary
			if self.stage != correct_stage:
				self.stage = correct_stage
				frappe.msgprint(_("Student's stage has been updated to {0}.").format(correct_stage), alert=True)
			else:
				frappe.msgprint(_("Student is already in the correct stage."), alert=True)
		else:
			frappe.msgprint(_("Current stage is not valid."), alert=True)