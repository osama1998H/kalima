// Copyright (c) 2024, e2next and contributors
// For license information, please see license.txt

frappe.ui.form.on("Activity Request", {
	validate(frm) {
        if (frm.doc.deliverer_type ==="Single" && frm.doc.activity_deliverers.length > 1) {
            frappe.throw(__('You can Only Select 1 Deliverer'))
        }
        if (frm.doc.deliverer_type ==="Multiple" && frm.doc.activity_deliverers.length < 2) {
            frappe.throw(__('You Must Select more than 1 Deliverer'))
        }
	},
    async template(frm) { 
        if(frm.doc.template != null && frm.doc.template != undefined && frm.doc.template != "")
        {
            var terms = await frappe.db.get_doc("Terms and Conditions",frm.doc.template);
            frm.set_value("description",terms.terms);
            frm.refresh_field("description");
        }
    }
});

