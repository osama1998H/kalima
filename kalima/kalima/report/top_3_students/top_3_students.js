// your_app_name/your_module/top_3_students.js

frappe.query_reports["Top 3 Students"] = {
    "filters": [
        {
            "fieldname": "educational_year",
            "label": __("Educational Year"),
            "fieldtype": "Link",
            "options": "Educational Year",
            "reqd": 0
        }
    ]
};
