// Copyright (c) 2024, e2next and contributors
// For license information, please see license.txt

frappe.ui.form.on("Incoming", {
    async template(frm) { 
        if(frm.doc.template != null && frm.doc.template != undefined && frm.doc.template != "")
        {
            var terms = await frappe.db.get_doc("Terms and Conditions",frm.doc.template);
            frm.set_value("description",terms.terms);
            frm.refresh_field("description");
        }
    }
});
