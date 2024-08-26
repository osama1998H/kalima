
from frappe.model.document import Document
import frappe
from frappe.model.docstatus import DocStatus
from frappe.utils import nowdate

from datetime import datetime, timedelta


def get_future_date(days):
    current_date = datetime.now()
    future_date = current_date + timedelta(days=days)
    return future_date


class StudentsFees(Document):
    # def on_submit(doc):
        
        
        
        
    def create_invoices(doc):
        # doc = frappe.get_doc("Students Fees",docname)
        students = doc.students_fees

        for std in students:
            student_customer = frappe.db.get_value(
                "Student", std.student, "customer")
            if (student_customer == None):
                frappe.throw(
                    'User Does Not Have A Customer Assigned : ' + std.student)

            template = frappe.get_doc(
                "Payment Terms Template", doc.payment_term)

            for trm in template.terms:
                days_from_now = trm.credit_days
                future_date = get_future_date(days_from_now)
                future_due_date = get_future_date(days_from_now+7)
                
                new_invoice = frappe.get_doc({
                    "doctype": "Sales Invoice",
                    "set_posting_time":1,
                    "company": doc.company,
                    "cost_center": doc.cost_center,
                    "customer": student_customer,
                    "posting_date": future_date,
                    "due_date": future_due_date,
                    "custom_student_fee": doc.name,
                    "custom_from_term": trm.payment_term,
                    "discount_amount": (std.amount - std.amount_after_discount)*(trm.invoice_portion /100),
                    "additional_discount_percentage": (((std.amount - std.amount_after_discount) / std.amount) * 100)*(trm.invoice_portion /100)
                })

                new_invoice.append("items", {
                    "item_code": doc.item,
                    "qty": 1,
                    "income_account": doc.income_account,
                    "company": doc.company,
                    "cost_center": doc.cost_center,
                    "rate": doc.fee_amount  *(trm.invoice_portion /100)
                })

                new_invoice.insert()
                # new_invoice.submit()
                
            for addon in doc.addon_fees:
                days_from_now = trm.credit_days
                future_date = get_future_date(days_from_now)
                future_due_date = get_future_date(days_from_now+7)
                
                new_invoice = frappe.get_doc({
                    "doctype": "Sales Invoice",
                    "set_posting_time":1,
                    "company": doc.company,
                    "cost_center": doc.cost_center,
                    "customer": student_customer,
                    "posting_date": future_date,
                    "due_date": future_due_date,
                    "custom_student_fee": doc.name,
                    "custom_from_term": trm.payment_term,
                    "discount_amount": (std.amount - std.amount_after_discount)*(trm.invoice_portion /100),
                    "additional_discount_percentage": (((std.amount - std.amount_after_discount) / std.amount) * 100)*(trm.invoice_portion /100)
                })

                new_invoice.append("items", {
                    "item_code": addon.item,
                    "qty": 1,
                    "income_account": addon.income_account,
                    "company": doc.company,
                    "cost_center": doc.cost_center,
                    "rate": addon.amount
                })

                new_invoice.insert()

        current_date = nowdate()
        doc.transfer_date = current_date
        doc.save()

    # def on_cancel(doc):

    def cancel_invoices(doc):
        all_docs = frappe.db.get_list('Sales Invoice',
                                      filters={
                                          "docstatus": DocStatus.submitted(), "custom_student_fee": doc.name,
                                      },
                                      fields=['name'],
                                      )
        for d in all_docs:
            docu = frappe.get_doc("Sales Invoice", d.name)
            docu.cancel()

        doc.transfer_date = None
        doc.save()


@frappe.whitelist()
def create_invoices(docname):
    doc = frappe.get_doc("Students Fees", docname)
    doc.create_invoices()


@frappe.whitelist()
def cancel_invoices(docname):
    doc = frappe.get_doc("Students Fees", docname)
    doc.cancel_invoices()
