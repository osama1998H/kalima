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
                            form.set_value('exam_max_mark', doc.exam_max_mark);

                            // Get the stage and department from the selected module
                            frappe.db.get_doc('Presented Module', doc.module).then(module_doc => {
                                form.set_value('stage', module_doc.stage);
                                let department = module_doc.department;
                                console.log(module_doc.academic_system_type);

                                if (module_doc.academic_system_type == "Annual") {
                                    form.fields_dict['exam_type'].df.hidden = 0;
                                    form.fields_dict['exam_type'].df.options = "Annual Final Exam\nAnnual Half Year Exam";
                                }
                                else if(module_doc.academic_system_type == "Coursat") {
                                    form.fields_dict['exam_type'].df.hidden = 1;
                                    form.fields_dict['exam_type'].df.reqd = 0;
                                    form.fields_dict['exam_type'].df.options = "First Course Exam\nSecond Course Exam\nCourse Try Exam";
                                }
                                else if(module_doc.academic_system_type == "Bologna") {
                                    form.fields_dict['exam_type'].df.hidden = 1;
                                }

                                form.fields_dict['exam_type'].refresh();


                                form.set_value('academic_system_type', module_doc.academic_system_type);
                                fetch_students(prototype);
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
            }, {
                fieldtype: 'Float',
                fieldname: 'exam_max_mark',
                label: 'Exam max mark',
                read_only: 1,
                default: 0
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
            {
                fieldtype: 'Select',
                fieldname: 'exam_type',
                reqd: 1,
                label: 'Exam Type',
                default: null,
                options: ' \nCourse Final Exam\nAnnual Final Exam\nAnnual Half Year Exam',
            },
        ],
        body: page.body
    });

    form.make();

    // Function to fetch students and display them in a table
    function fetch_students(prototype) {
        frappe.call({
            method: 'kalima.utils.utils.get_student_from_prototype',
            args: {
                prototype: prototype
            },
            callback: function (response) {
                if (response.message) {
                    let students = response.message;
                    display_students(students);

                }
            }
        });
    }

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
    
        var bulics = form.get_value('exam_max_mark');
        if (bulics == 0 || bulics == undefined) {
            bulics = 50;
        }
    
        students.forEach(student => {
            table_html += `
                <tr>
                    <td>${student.name}</td>
                    <td>${bulics}</td>
                    <td><input type="number" class="form-control final-result" placeholder="Final Result" min="0" max="50" required></td>
                    <td>
                        <select class="form-control">
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </td>
                    <td><input type="checkbox" class="form-control cheating-checkbox"></td>
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
        $container.append(table_html);
    
        // Add event listener to final result inputs to update the status
        $container.find('.final-result').on('input', function () {
            var finalResult = $(this).val();
            var statusSelect = $(this).closest('tr').find('.status');
    
            if (finalResult >((bulics/2)-1)) {
                statusSelect.val('Passed');
            } else {
                statusSelect.val('Failed');
            }
        });
    
        // Add event listener to cheating checkboxes
        $container.find('.cheating-checkbox').on('change', function () {
            var $row = $(this).closest('tr');
            var $finalResult = $row.find('.final-result');
            var $statusSelect = $row.find('.status');
    
            if ($(this).is(':checked')) {
                $finalResult.val(0).prop('disabled', true);
                $statusSelect.val('Failed');
            } else {
                $finalResult.prop('disabled', false).val(''); // Re-enable and clear the final result
                $statusSelect.val('none'); // Clear the status selection
            }
        });
    // Add event listener to "Present" select dropdowns
$container.find('select.form-control').on('change', function () {
    var $row = $(this).closest('tr');
    var $finalResult = $row.find('.final-result');
    var $statusSelect = $row.find('.status');

    if ($(this).val() === 'No') {
        $finalResult.val(0).prop('disabled', true);
        $statusSelect.val('Failed');
    } else if (!$row.find('.cheating-checkbox').is(':checked')) {
        $finalResult.prop('disabled', false).val(''); // Re-enable and clear the final result
        $statusSelect.val('none'); // Clear the status selection if not already marked as cheating
    }
});
        // Add event listener to submit button to collect data and make frappe.call
        $container.find('.submit-results').on('click', function () {
            let prototype = form.get_value('Prototype');
            let module = form.get_value('module');
            let teacher = form.get_value('teacher');
            let round = form.get_value('round');
            let stage = form.get_value('stage');
            let exam_type = form.get_value('exam_type');
            let academic_system_type = form.get_value('academic_system_type');
            let exam_max_mark = form.get_value('exam_max_mark');
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
                    type: stage,
                    academic_system_type: academic_system_type,
                    teacher: teacher,
                    exam_max_mark: exam_max_mark,
                    exam_type: exam_type,
    
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
