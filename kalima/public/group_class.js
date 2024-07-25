// Copyright (c) 2024, e2next and contributors
// For license information, please see license.txt

frappe.ui.form.on("Group Class", {
    faculty(frm) {
        const faculty = frm.doc.faculty;
        frm.set_query("department", function () {
            return {
                filters: {
                    "faculty": faculty
                }
            };
        });
    },
    department(frm) {
        pres(frm);
    },
    after_save: function (frm) {
    },
    async refresh(frm) {
        await pres(frm);
        if (!frm.is_new()) {
            frm.add_custom_button(__('Generate Classes'), function () {
                const selected_modules = [];
                const department = frm.doc.department;
        
                // Get selected modules
                frm.fields_dict.presented_modules.$wrapper.find('input[type="checkbox"]:checked').each(function () {
                    selected_modules.push($(this).val());
                });
        
                if (selected_modules.length === 0 || !department) {
                    return;
                }
                generate_classes(frm);
            }).addClass('bg-success', 'text-white').css({
                "color": "white",
            });
        }
    }
});


frappe.ui.form.on("Group Class", "fetch_students", function (frm) {
    fetch_students(frm);
});

async function pres(frm) {
    // Ensure both faculty and department are selected
    const faculty = frm.doc.faculty;
    const stage = frm.doc.stage;
    const department = frm.doc.department;

    if (faculty && department) {
        // Fetch presented modules based on the selected department and faculty
        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "Presented Module",
                filters: {
                    "faculty": faculty,
                    "stage": stage,
                    "department": department
                },
                fields: ["module"]
            },
            callback: function (r) {
                if (r.message) {
                    // Create an HTML form with checkboxes from the fetched modules
                    let html = '<div class="form-check">';

                    r.message.forEach(function (module, index) {
                        html += `
                              <div class="form-check">
                                  <input class="form-check-input my-1" type="checkbox" name="modules" value="${module.module}" id="module_${index}">
                                  <label class="form-check-label my-1" for="module_${index}">
                                      ${module.module}
                                  </label>
                              </div><br>`;
                    });

                    html += '</div>';
                    frm.set_value('modules_html', html);

                    // Set the HTML content to the presented_modules field
                    frm.fields_dict.presented_modules.$wrapper.html(html);
                }
            }
        });
    } else {
        // Clear the presented_modules field if faculty or department is not selected
        frm.fields_dict.presented_modules.$wrapper.html('');
    }
}

function fetch_students(frm) {
    const selected_modules = [];
    const department = frm.doc.department;

    // Get selected modules
    frm.fields_dict.presented_modules.$wrapper.find('input[type="checkbox"]:checked').each(function () {
        selected_modules.push($(this).val());
    });

    if (selected_modules.length === 0 || !department) {
        frappe.msgprint(__('Please select at least one module and ensure department is selected.'));
        return;
    }

    frappe.call({
        method: "kalima.kalima.doctype.group_class.group_class.fetch_students",
        args: {
            selected_modules: JSON.stringify(selected_modules),
            department: department
        },
        callback: function (r) {
            if (r.message) {
                // Determine the number of tables and rows per table
                let studentsPerTable = Math.ceil(r.message.length / 3);

                // Initialize the HTML string
                let html = '<div class="row">';

                // Loop through to create 3 tables
                for (let tableIndex = 0; tableIndex < 3; tableIndex++) {
                    html += '<div class="col-md-4"><table class="table table-bordered">';
                    html += `
                        <thead>
                            <tr>
                                <th>Checkbox</th>
                                <th>Full Name in Arabic</th>
                            </tr>
                        </thead>
                        <tbody>`;

                    // Add rows for the current table
                    for (let i = tableIndex * studentsPerTable; i < (tableIndex + 1) * studentsPerTable && i < r.message.length; i++) {
                        let student = r.message[i];
                        html += `
                            <tr id="row_${i}" class="clickable-cell" data-index="${i}">
                                <td>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="students" value="${student.name}" id="student_${i}">
                                        <label class="form-check-label" for="student_${i}"></label>
                                    </div>
                                </td>
                                <td class="clickable-cell-content">
                                    ${student.full_name_in_arabic}
                                </td>
                            </tr>`;
                    }

                    html += '</tbody></table></div>';
                }

                html += '</div>';
                frm.set_value('students_html', html);

                // Inject the HTML into the wrapper
                frm.fields_dict.students.$wrapper.html(html);

                // Add event listeners to handle cell click, checkbox toggle, and background color change
                r.message.forEach(function (student, index) {
                    let row = document.getElementById(`row_${index}`);
                    let checkbox = document.getElementById(`student_${index}`);

                    row.addEventListener('click', function (event) {
                        // Only toggle the checkbox and color if the click is not on the checkbox itself
                        if (event.target.type !== 'checkbox') {
                            checkbox.checked = !checkbox.checked;
                        }
                        updateRowStyle(row, checkbox);
                    });

                    checkbox.addEventListener('change', function () {
                        updateRowStyle(row, checkbox);
                    });
                });

                function updateRowStyle(row, checkbox) {
                    if (checkbox.checked) {
                        row.style.backgroundColor = 'lightgreen';
                        row.style.color = 'white';
                    } else {
                        row.style.backgroundColor = '';
                        row.style.color = '';
                    }
                }
            }
        },
        callback: function (r) {
            if (r.message) {
                // Determine the number of tables and rows per table
                let studentsPerTable = Math.ceil(r.message.length / 3);

                // Initialize the HTML string
                let html = '<div class="row">';

                // Loop through to create 3 tables
                for (let tableIndex = 0; tableIndex < 3; tableIndex++) {
                    html += '<div class="col-md-4"><table class="table table-bordered">';
                    html += `
                        <thead>
                            <tr>
                                <th>Checkbox</th>
                                <th>Full Name in Arabic</th>
                            </tr>
                        </thead>
                        <tbody>`;

                    // Add rows for the current table
                    for (let i = tableIndex * studentsPerTable; i < (tableIndex + 1) * studentsPerTable && i < r.message.length; i++) {
                        let student = r.message[i];
                        html += `
                            <tr id="row_${i}" class="clickable-cell" data-index="${i}">
                                <td>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="students" value="${student.name}" id="student_${i}">
                                        <label class="form-check-label" for="student_${i}"></label>
                                    </div>
                                </td>
                                <td class="clickable-cell-content">
                                    ${student.full_name_in_arabic}
                                </td>
                            </tr>`;
                    }

                    html += '</tbody></table></div>';
                }

                html += '</div>';
                frm.set_value('students_html', html);

                // Inject the HTML into the wrapper
                frm.fields_dict.students.$wrapper.html(html);

                // Add event listeners to handle cell click, checkbox toggle, and background color change
                r.message.forEach(function (student, index) {
                    let row = document.getElementById(`row_${index}`);
                    let checkbox = document.getElementById(`student_${index}`);

                    row.addEventListener('click', function (event) {
                        // Only toggle the checkbox and color if the click is not on the checkbox itself
                        if (event.target.type !== 'checkbox') {
                            checkbox.checked = !checkbox.checked;
                        }
                        updateRowStyle(row, checkbox);
                    });

                    checkbox.addEventListener('change', function () {
                        updateRowStyle(row, checkbox);
                    });
                });

                function updateRowStyle(row, checkbox) {
                    if (checkbox.checked) {
                        row.style.backgroundColor = 'lightgreen';
                        row.style.color = 'white';
                    } else {
                        row.style.backgroundColor = '';
                        row.style.color = '';
                    }
                }
            }
        }



    });
}


function generate_classes(frm) {
    const selected_modules = [];
    const selected_students = [];
    const department = frm.doc.department;

    // Get selected modules
    frm.fields_dict.presented_modules.$wrapper.find('input[type="checkbox"]:checked').each(function () {
        selected_modules.push($(this).val());
    });

    // Get selected students
    frm.fields_dict.students.$wrapper.find('input[type="checkbox"]:checked').each(function () {
        selected_students.push($(this).val());
    });

    if (selected_modules.length === 0 || selected_students.length === 0 || !department) {
        frappe.msgprint(__('Please select at least one module and one student, and ensure department is selected.'));
        return;
    }

    frappe.call({
        method: "kalima.kalima.doctype.group_class.group_class.create_classes",
        args: {
            group_class_doc: frm.doc,
            group_class_modules: selected_modules,
            students: selected_students
        },
        callback: function (r) {
            if (r.message) {
                frappe.msgprint(__('Classes have been successfully generated.'));
            }
        }
    });
}
