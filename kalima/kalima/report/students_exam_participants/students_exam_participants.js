// Copyright (c) 2024, e2next and contributors
// For license information, please see license.txt

frappe.query_reports["Students Exam Participants"] = {
	"filters": [
        {
            "fieldname": "department",
            "label": __("Department"),
            "fieldtype": "Link",
            "options": "Department",
            "width": 100,
            "on_change": function(query_report) {
                query_report.refresh();
            }
        },
        {
            "fieldname": "study_system",
            "label": __("Study Type"),
            "fieldtype": "Select",
            "options": "Morning\nEvening",
            "width": 100
        },
        {
            "fieldname": "year",
            "label": __("Year"),
            "fieldtype": "Link",
            "options": "Educational Year",
            "width": 100,
        },
    ]
};
