// Copyright (c) 2024, e2next and contributors
// For license information, please see license.txt

frappe.ui.form.on("Department Module", {
	faculty(frm) {
		frm.set_query("department", function() {
			return {
				filters: [
					["custom_faculty", "=",frm.doc.faculty]
				]
			}
		});
	},
});
