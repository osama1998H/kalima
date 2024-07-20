frappe.pages['student-result-entry'].on_page_load = function (wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Student Result Entry',
        single_column: true
    });

    // Create a form container
    let form = new frappe.ui.FieldGroup({
        fields: [
            {
                fieldtype: 'Link',
                fieldname: 'Prototype',
                label: 'Prototype',
                options: 'Question Prototype', // Replace 'Doctype' with the actual doctype you want to link to
                read_only: 0,
                onchange: function () {
                    let prototype = form.get_value('Prototype');
                    if (prototype) {
                        // Get the module and teacher from the selected Prototype
                        frappe.db.get_doc('Question Prototype', prototype).then(doc => {
                            form.set_value('module', doc.module);
                            form.set_value('teacher', doc.teacher);

                            // Get the stage and department from the selected module
                            frappe.db.get_doc('Presented Module', doc.module).then(module_doc => {
                                form.set_value('stage', module_doc.stage);
                                let department = module_doc.department;
                                console.log(module_doc.academic_system_type);
                                form.set_value('academic_system_type', module_doc.academic_system_type);

                                // Fetch students with the same stage and department
                                // fetch_students(module_doc.stage, department,);
                                fetch_students(doc.module);
                            });
                        });
                    }
                }
            },
            {
                fieldtype: 'Link',
                fieldname: 'module',
                label: 'Module',
                options: 'Presented Module', // Replace 'Doctype' with the actual doctype you want to link to
                read_only: 1
            },
            {
                fieldtype: 'Link',
                fieldname: 'teacher',
                label: 'Teacher',
                options: 'Employee', // Replace 'Doctype' with the actual doctype you want to link to
                read_only: 1
            },
            {
                fieldtype: 'Column Break',
                fieldname: 'clmn',
            },
            {
                fieldtype: 'Data',
                fieldname: 'stage',
                label: 'Stage',
                read_only: 1
            },            
            {
                fieldtype: 'Data',
                fieldname: 'academic_system_type',
                label: 'Academic system type',
                read_only: 1
            },
            {
                fieldtype: 'Select',
                fieldname: 'round',
                label: 'Round',
                options: 'First\nSecond\nThird',
            },
        ],
        body: page.body
    });

    form.make();

    // Function to fetch students and display them in a table
    function fetch_students(module) {
        frappe.call({
            method: 'kalima.utils.utils.get_student_from_prototype',
            args: {
                module: module
            },
            callback: function (response) {
                if (response.message) {
                    let students = response.message;
                    display_students(students);

                }
            }
        });
        // frappe.call({
        //     method: 'frappe.client.get_list',
        //     args: {
        //         doctype: 'Student',
        //         filters: {
        //             'stage': stage,
        //             'final_selected_course': department
        //         },
        //         fields: ['name', 'stage', 'final_selected_course']
        //     },
        //     callback: function (response) {
        //         if (response.message) {
        //             let students = response.message;
        //             display_students(students);

        //         }
        //     }
        // });
    }

    // Function to display students in a Bootstrap table
    function display_students(students) {
        // Check if a table already exists and remove it
        var $existingTable = $(wrapper).find('.student-table-container');
        if ($existingTable.length) {
            $existingTable.remove();
        }

        let table_html = `
            <div class="student-table-container">
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Student </th>
                            <th>Exam Mark</th>
                            <th>Final Result</th>
                            <th>Present</th>
                            <th>Cheating?</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        students.forEach(student => {
            table_html += `
                <tr>
                    <td>${student.name}</td>
                    <td>50</td>
                    <td><input type="number" class="form-control final-result" placeholder="Final Result" min="0" max="50" required></td>
                    <td>
                        <select class="form-control">
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </td>
                    <td><input type="checkbox" class="form-control"></td>
                    <td>                        
                        <select class="form-control status">
                            <option value="none"></option>
                            <option value="Passed">Passed</option>
                            <option value="Failed">Failed</option>
                        </select>
                    </td>
                </tr>
            `;
        });

        table_html += `
                    </tbody>
                </table>
                <button class="btn btn-primary submit-results">Submit Results</button>
            </div>
        `;

        var $container = $(wrapper).find('.layout-main-section');
        $container.append(table_html); // Append the table HTML instead of setting it

        // Add event listener to final result inputs to update the status
        $container.find('.final-result').on('input', function () {
            var finalResult = $(this).val();
            var statusSelect = $(this).closest('tr').find('.status');

            if (finalResult > 24) { // Use 49 instead of 24 as per your original request
                statusSelect.val('Passed');
            } else {
                statusSelect.val('Failed');
            }
        });

        // Add event listener to submit button to collect data and make frappe.call
        $container.find('.submit-results').on('click', function () {
            let prototype = form.get_value('Prototype');
            let module = form.get_value('module');
            let teacher = form.get_value('teacher');
            let round = form.get_value('round');
            let stage = form.get_value('stage');
            let academic_system_type = form.get_value('academic_system_type');
            let student_results = [];
            let valid = true;

            $container.find('tbody tr').each(function () {
                let final_result = $(this).find('.final-result').val();

                if (final_result === '' || final_result < 0 || final_result > 50) {
                    valid = false;
                    return false; // Exit the loop
                }

                let student_result = {
                    student_name: $(this).find('td:eq(0)').text(),
                    exam_mark: $(this).find('td:eq(1)').text(),
                    final_result: final_result,
                    present: $(this).find('select:eq(0)').val(),
                    cheating: $(this).find('input[type=checkbox]').prop('checked') ? 'Yes' : 'No',
                    status: $(this).find('select.status').val(),
                    prototype: prototype,
                    round: round,
                    module: module,
                    stage: stage,
                    academic_system_type: academic_system_type,
                    teacher: teacher
                };
                student_results.push(student_result);
            });

            if (!valid) {
                frappe.msgprint('Please ensure all students have a valid result between 0 and 50.');
                return;
            }

            frappe.call({
                method: 'kalima.utils.utils.submit_student_results',
                args: {
                    student_results: student_results
                },
                callback: function (response) {
                    if (response.message) {
                        frappe.msgprint('Results submitted successfully');
                        form.clear(); // Reset the form
                        var $existingTable = $(wrapper).find('.student-table-container');
                        if ($existingTable.length) {
                            $existingTable.remove();
                        }
                    }
                }
            });

        });
    }
}
