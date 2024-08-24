# Copyright (c) 2024, e2next and contributors
# For license information, please see license.txt

import frappe
from frappe.website.website_generator import WebsiteGenerator
from frappe import utils


class Activity(WebsiteGenerator):
	def before_submit(doc):
		req = frappe.get_doc("Activity Request",doc.activity_request)
		req.status = "Completed"
		req.save()
  
		doc.status = "Completed"
		# doc.save()



@frappe.whitelist()
def generate_certificates(doc_name,terms_and_conditions):
	doc = frappe.get_doc("Activity",doc_name)

	#needs change
	if doc.type == "General":
		for s in doc.general_participants:
			new_doc = frappe.get_doc({
				'doctype': 'Activity Certificate',
				'activity': doc_name,
				'participant': s.participant,
				"template":terms_and_conditions,
				"issue_date":utils.today()
			})
			new_doc.insert()
	elif doc.type == "Staff":
		for s in doc.staff_activity_list:
			employee = frappe.get_doc("Employee",s.speaker)
			new_doc = frappe.get_doc({
				'doctype': 'Activity Certificate',
				'activity': doc_name,
				'participant': employee,
				'general_participant': employee,
				"template":terms_and_conditions,
				"issue_date":utils.today()
			})
			new_doc.insert()

	elif doc.type == "Departments":
		pass

	doc.certificates_generated = 1
	doc.save()
	return True