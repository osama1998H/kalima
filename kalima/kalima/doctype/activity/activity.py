# Copyright (c) 2024, e2next and contributors
# For license information, please see license.txt

import frappe
from frappe.website.website_generator import WebsiteGenerator
from frappe import utils


class Activity(WebsiteGenerator):
	pass


@frappe.whitelist()
def generate_certificates(doc_name,terms_and_conditions):
	doc = frappe.get_doc("Activity",doc_name)

	if doc.type == "General":
		pass
	elif doc.type == "Staff":
		for s in doc.staff_activity_list:
			employee = frappe.get_doc("Employee",s.speaker)
			new_doc = frappe.get_doc({
				'doctype': 'Activity Certificate',
				'activity': doc_name,
				'participant': employee,
    			"template":terms_and_conditions,
				"issue_date":utils.today()
			})
			new_doc.insert()
			new_doc.submit()
	elif doc.type == "Departments":
		pass

	doc.certificates_generated = 1
	doc.save()
	return True