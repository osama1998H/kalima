// Copyright (c) 2024, e2next and contributors
// For license information, please see license.txt

frappe.ui.form.on("Activity", {
	refresh(frm) {
        frm.add_custom_button(__('Fetch From Request'), function () {
            if (frm.doc.activity_request) {
                frappe.db.get_doc("Activity Request", frm.doc.activity_request)
                    .then(request => {
                        // Set activity_deliverers table
                        if (request.activity_deliverers) {
                            frm.clear_table("activity_deliverers");

                            frappe.model.with_doctype("Activity Deliverers", () => {
                                let meta = frappe.get_meta("Activity Deliverers");

                                request.activity_deliverers.forEach(deliverer => {
                                    let new_row = frm.add_child("activity_deliverers");

                                    meta.fields.forEach(field => {
                                        if (deliverer[field.fieldname] !== undefined) {
                                            new_row[field.fieldname] = deliverer[field.fieldname];
                                        }
                                    });
                                });

                                frm.refresh_field("activity_deliverers");
                            });
                        }
                        if (frm.doc.type == "Departments") {
                            // Set departments table
                            if (request.departments) {
                                frm.clear_table("departments");

                                frappe.model.with_doctype("Activity Departments", () => {
                                    let meta = frappe.get_meta("Activity Departments");

                                    request.departments.forEach(department => {
                                        let new_row = frm.add_child("departments");

                                        meta.fields.forEach(field => {
                                            if (department[field.fieldname] !== undefined) {
                                                new_row[field.fieldname] = department[field.fieldname];
                                            }
                                        });
                                    });

                                    frm.refresh_field("departments");
                                });
                            }
                        } else if (frm.doc.type == "Staff") {
                            if (request.staff_activity_list) {
                                frm.clear_table("staff");

                                frappe.model.with_doctype("Staff Activity List", () => {
                                    let meta = frappe.get_meta("Staff Activity List");

                                    request.staff_activity_list.forEach(stf => {
                                        let new_row = frm.add_child("staff");

                                        meta.fields.forEach(field => {
                                            if (stf[field.fieldname] !== undefined) {
                                                new_row[field.fieldname] = stf[field.fieldname];
                                            }
                                        });
                                    });

                                    frm.refresh_field("staff");
                                });
                            }
                        }
                    });
            }
        }).addClass('bg-success', 'text-white').css({
            "color": "white",
        });
	},
    async activity_execution(frm) {
        frm.clear_table('requirements');

        var req = await frappe.db.get_doc("Activity Coordination",frm.doc.activity_execution);
        req.activity_requirements.forEach(element => {
            var new_row = frm.add_child('requirements', {
                'material': element.material,
                'quantitiy': element.quantitiy,
            });
        });
        frm.refresh_field('requirements');

    },
    async activity_request(frm) {
        frm.clear_table('activity_participants_list');

        var req = await frappe.db.get_doc("Activity Request",frm.doc.activity_request);
        req.activity_deliverers.forEach(element => {
           frm.add_child('activity_participants_list', {
                'participant': element.speaker
            });
        });
        frm.refresh_field('activity_participants_list');

    },
});
