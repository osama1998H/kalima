// your_app_name/your_module/department_annual_report.js

frappe.query_reports["Department Annual Report"] = {
    "filters": [
        {
            "fieldname": "department",
            "label": __("Department"),
            "fieldtype": "Link",
            "options": "Department",
            "reqd": 0
        }
    ]
};
