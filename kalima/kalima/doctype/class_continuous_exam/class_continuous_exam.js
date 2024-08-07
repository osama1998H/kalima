// Copyright (c) 2024, e2next and contributors
// For license information, please see license.txt

frappe.ui.form.on("Class Continuous Exam", {
});


frappe.ui.form.on('Continuous Exam Result', {
    score(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        let net_score = (row.score / frm.doc.marked_on) * frm.doc.percentage;
        frappe.model.set_value(cdt, cdn, 'net_score', net_score);
    }
});
