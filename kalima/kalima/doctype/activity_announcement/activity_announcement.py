# Copyright (c) 2024, e2next and contributors
# For license information, please see license.txt

import frappe
from frappe.website.website_generator import WebsiteGenerator


class ActivityAnnouncement(WebsiteGenerator):
	def before_submit(doc):
		req = frappe.get_doc("Activity Request",doc.activity_request)
		req.status = "In Progress"
		req.save()
