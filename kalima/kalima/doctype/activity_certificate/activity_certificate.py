import frappe
from frappe.model.document import Document

class ActivityCertificate(Document):
    def before_save(self):
        self.render_template()

    def render_template(self):
        if self.template:
            template_content = frappe.db.get_value('Terms and Conditions', self.template, 'terms')
            if template_content:
                self.description = frappe.render_template(template_content, {'doc': self})
