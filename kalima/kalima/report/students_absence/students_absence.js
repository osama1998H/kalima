// your_app_name/your_module/students_absence.js

frappe.query_reports["Students Absence"] = {
	"filters": [
		{
			"fieldname": "department",
			"label": __("Department"),
			"fieldtype": "Link",
			"options": "Department",
			"reqd": 0
		},
		{
			"fieldname": "stage",
			"label": __("Stage"),
			"fieldtype": "Select",
			"options": ["First Year",
				"Second Year",
				"Third Year",
				"Fourth Year",
				"Fifth Year"]
		},
		{
			"fieldname": "year",
			"label": __("Educational Year"),
			"fieldtype": "Link",
			"options": "Educational Year",
			"reqd": 0
		},
		{
			"fieldname": "class",
			"label": __("Class"),
			"fieldtype": "Link",
			"options": "Class",
			"reqd": 0
		},
		{
			"fieldname": "academic_system_type",
			"label": __("Academic System Type"),
			"fieldtype": "Select",
			"options": ["Morning", "Evening"]
		},
		{
			"fieldname": "semester",
			"label": __("Semester"),
			"fieldtype": "Select",
			"options": ["Fall Semester",
				"Spring Semester",
				"Short Semester"]
		}
	]
};
