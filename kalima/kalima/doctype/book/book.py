# Copyright (c) 2024, e2next and contributors
# For license information, please see license.txt

# import frappe
from frappe.website.website_generator import WebsiteGenerator


class Book(WebsiteGenerator):
	def before_save(doc):
		tags = doc.get_tags()
		for tag in tags:
			print(tag)
			doc.append("tags",{
				"tag":tag
			})
