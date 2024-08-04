
from frappe.model.document import Document
from kalima.utils.utils import fines
import frappe
from frappe import _

class LendBook(Document):
	def before_save(self):
		if(self.user != None):
			borrowing_limitations = frappe.get_single("Borrowing Limitations")

			# Fetch all not returned Lend Book records for the same user
			not_returned_books = frappe.get_all("Lend Book", filters={
				"user": self.user,
				"is_returned": 0
			})
   
			# Determine the limit based on the user type
			if self.user_type == "Undergraduate Student":
				limit = borrowing_limitations.undergraduate_student
			elif self.user_type == "Master Student":
				limit = borrowing_limitations.master_student
			elif self.user_type == "Phd Student":
				limit = borrowing_limitations.phd_student
			elif self.user_type == "Employee":
				limit = borrowing_limitations.employee
			elif self.user_type == "Teacher":
				limit = borrowing_limitations.teacher
			elif self.user_type == "Special":
				limit = borrowing_limitations.special
			else:
				limit = 0  # Default to 0 if user type is not recognized

			# Check if the user has exceeded the borrowing limit
			if len(not_returned_books) > limit:
				frappe.throw(_("The user has exceeded the borrowing limit for {0}").format(self.user_type))

		if(self.extra_period == None):
			self.extra_period = frappe.get_value("Fining System",self.fining_system,"period")
			