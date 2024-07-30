
frappe.query_reports["Master Sheet"] = {
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
            "fieldname": "stage",
            "label": __("Stage"),
            "fieldtype": "Select",
            "options": "First Year\nSecond Year\nThird Year\nFourth Year\nFifth Year",
            "width": 100
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
