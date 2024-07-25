frappe.ui.form.on("Outgoing", {
    async refresh(frm) {
        if (!frm.is_new() && frm.doc.docstatus != 1 && frm.doc.receivers_type == "Students") {
            frm.add_custom_button(__('Fetch Receivers'), async function () {
                if (frm.doc.receivers_type == "Students") {
                    await getEntitiesAndShowDialog("Student", ["name"], "name", "receive_student", "student");
                } else if (frm.doc.receivers_type == "Teachers") {
                    await getEntitiesAndShowDialog("Employee", ["name", "employee_name"], "employee_name", "receive_teachers", "teacher");
                } else if (frm.doc.receivers_type == "Departments") {
                    // var all_students = await frappe.db.get_list("Faculty Department", {
                    var all_students = await frappe.db.get_list("Department", {
                            fields: ['name', 'arabic_title']
                    });

                    var fields = [];
                    let student_count = all_students.length;
                    let column_count = Math.ceil(student_count / 3);

                    all_students.forEach((element, index) => {
                        let column_break = index % column_count === 0 ? {
                            fieldname: `column_break_${index}`,
                            fieldtype: "Column Break"
                        } : null;

                        if (column_break) {
                            fields.push(column_break);
                        }

                        fields.push({
                            fieldname: element.name,
                            fieldtype: "Check",
                            label: element.arabic_title,
                            default: 1 // Initially select all checkboxes
                        });
                    });

                    fields.push({
                        fieldtype: "HTML",
                        fieldname: "custom_buttons",
                        options: `
                            <div>
                                <button class="btn btn-primary btn-select-all">Select All</button>
                                <button class="btn btn-secondary btn-clear-all">Clear All</button>
                            </div>
                        `
                    });

                    let d = new frappe.ui.Dialog({
                        title: 'Select Students',
                        fields: fields,
                        size: 'large', // small, large, extra-large
                        primary_action_label: 'Add',
                        primary_action(values) {
                            let selected_students = [];
                            let new_child = [];

                            all_students.forEach((student) => {
                                if (values[student.name]) {
                                    selected_students.push(student.name);
                                }
                            });

                            selected_students.forEach((employee_name) => {
                                new_child.push({
                                    department: employee_name
                                });
                            });

                            frm.set_value("departments", new_child);
                            frm.refresh_field('departments');
                            d.hide();
                        }
                    });

                    d.show();

                    // Add event listeners for the custom buttons
                    d.$wrapper.find('.btn-select-all').on('click', function () {
                        fields.forEach((field) => {
                            if (field.fieldtype === "Check") {
                                d.set_value(field.fieldname, 1);
                            }
                        });
                    });

                    d.$wrapper.find('.btn-clear-all').on('click', function () {
                        fields.forEach((field) => {
                            if (field.fieldtype === "Check") {
                                d.set_value(field.fieldname, 0);
                            }
                        });
                    });
                }

                async function getEntitiesAndShowDialog(doctype, fieldsList, labelField, targetField, sub_field) {
                    var all_entities = await frappe.db.get_list(doctype, { fields: fieldsList });

                    var fields = [];
                    let entity_count = all_entities.length;
                    let column_count = Math.ceil(entity_count / 3);

                    all_entities.forEach((element, index) => {
                        let column_break = index % column_count === 0 ? {
                            fieldname: `column_break_${index}`,
                            fieldtype: "Column Break"
                        } : null;

                        if (column_break) {
                            fields.push(column_break);
                        }

                        fields.push({
                            fieldname: element.name,
                            fieldtype: "Check",
                            label: element[labelField],
                            default: 1 // Initially select all checkboxes
                        });
                    });

                    fields.push({
                        fieldtype: "HTML",
                        fieldname: "custom_buttons",
                        options: `
                            <div>
                                <button class="btn btn-primary btn-select-all">Select All</button>
                                <button class="btn btn-secondary btn-clear-all">Clear All</button>
                            </div>
                        `
                    });

                    let d = new frappe.ui.Dialog({
                        title: `Select ${doctype}`,
                        fields: fields,
                        size: 'large', // small, large, extra-large
                        primary_action_label: 'Add',
                        primary_action(values) {
                            let selected_entities = [];
                            let new_child = [];

                            all_entities.forEach((entity) => {
                                if (values[entity.name]) {
                                    selected_entities.push(entity.name);
                                }
                            });

                            selected_entities.forEach((entity_name) => {
                                let child = {};
                                child[sub_field] = entity_name;
                                new_child.push(child);
                            });

                            let combined_data = frm.doc[targetField] || [];
                            combined_data = combined_data.concat(new_child);

                            frm.set_value(targetField, combined_data); 
                            frm.refresh_field(targetField);
                            d.hide();
                        }
                    });

                    d.show();

                    // Add event listeners for the custom buttons
                    d.$wrapper.find('.btn-select-all').on('click', function () {
                        fields.forEach((field) => {
                            if (field.fieldtype === "Check") {
                                d.set_value(field.fieldname, 1);
                            }
                        });
                    });

                    d.$wrapper.find('.btn-clear-all').on('click', function () {
                        fields.forEach((field) => {
                            if (field.fieldtype === "Check") {
                                d.set_value(field.fieldname, 0);
                            }
                        });
                    });
                }

            }).addClass('bg-success', 'text-white').css({
                "color": "white",
            });
        }
    },
    async template(frm) { 
        if(frm.doc.template != null && frm.doc.template != undefined && frm.doc.template != "")
        {
            var terms = await frappe.db.get_doc("Terms and Conditions",frm.doc.template);
            frm.set_value("description",terms.terms);
            frm.refresh_field("description");
        }
    }
});
