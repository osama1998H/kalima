// Copyright (c) 2024, e2next and contributors
// For license information, please see license.txt

frappe.ui.form.on("Student Fee Structure", {

	refresh(frm) {
        // frm.add_custom_button(__('View'), function () {
        //     var objWindowOpenResult = window.open(frappe.urllib.get_full_url("/doctor_dashboard?cycle=" + frm.doc.name));
        //     if (!objWindowOpenResult) {
        //         msgprint(__("Please set permission for pop-up windows in your browser!")); return;
        //     }
        // }).addClass('bg-success', 'text-white').css({
        //     "color": "white",
        // });

        frm.set_query("debit_account", () => ({
            "filters": {
                "company": frm.doc.company,
                "root_type": "Asset",
                "account_type": "Receivable",
                "is_group": 0,
            }
        }));
        frm.set_query("income_account", () => ({
            "filters": {
                "company": frm.doc.company,
                "root_type": "Income",
                "is_group": 0,
            }
        }));
        frm.set_query("cost_center", () => ({
            "filters": {
                "company": frm.doc.company,
                "is_group": 0
            }
        }));
	},
});
