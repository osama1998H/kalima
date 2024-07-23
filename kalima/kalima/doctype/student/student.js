

frappe.ui.form.on("Student", {
    refresh(frm) {

        frm.fields_dict['ministry_exam_results'].grid.wrapper.on('change', 'input[data-fieldname="mark"]', function (e) {
            if (frm.doc.ministry_exam_results.length > 0) {
                var ttl = 0;
                frm.doc.ministry_exam_results.forEach(element => {
                    ttl += element.mark;

                });
                frm.doc.total = ttl;
                frm.doc.average = ttl / frm.doc.ministry_exam_results.length;

                frm.set_value('total', ttl);
                frm.set_value('final_average', ttl / frm.doc.ministry_exam_results.length);

                frm.refresh_field('total');
                frm.refresh_field('final_average');
            }
        });


        if (frm.doc.study_status == "Hosted to" || frm.doc.study_status == "Transferred To") {
            Object.keys(frm.fields_dict).forEach(field => {
                frm.set_df_property(field, 'read_only', 1);
            });


            // Disable save
            frm.disable_save();
        }

        // Ensure all required fields are present
        if (frm.doc.academic_system_type == "Annual") {
            if (frm.doc.final_selected_course && frm.doc.semester && frm.doc.stage && frm.doc.academic_system_type) {
                // Fetch presented modules based on the student's department, semester, stage, and academic system type
                frappe.call({
                    method: "frappe.client.get_list",
                    args: {
                        doctype: "Presented Module",
                        filters: {
                            department: frm.doc.final_selected_course,
                            // semester: frm.doc.semester,
                            // stage: frm.doc.stage,
                            academic_system_type: frm.doc.academic_system_type
                        },
                        fields: ["name", "stage", "module", "module_name"]  // Adjust fields as per your DocType structure
                    },
                    callback: function (r) {
                        if (r.message) {

                            // Organize modules by stage
                            let stages = ["First Year", "Second Year", "Third Year", "Fourth Year", "Fifth Year"];
                            let stageModules = {};

                            stages.forEach(stage => {
                                stageModules[stage] = [];
                            });

                            r.message.forEach(function (module) {
                                if (stageModules[module.stage]) {
                                    stageModules[module.stage].push(module);
                                }
                            });

                            // Find the maximum number of modules in any stage to determine the number of rows needed
                            let maxModules = Math.max(...stages.map(stage => stageModules[stage].length));

                            // Generate HTML table
                            let html = `
                            <table class="table table-bordered">
                                <thead>
                                    <tr>
                        `;

                            stages.forEach(stage => {
                                html += `<th>${stage}</th>`;
                            });

                            html += `</tr></thead><tbody>`;

                            // Create rows for modules
                            for (let i = 0; i < maxModules; i++) {
                                html += `<tr>`;
                                stages.forEach(stage => {
                                    let module = stageModules[stage][i];
                                    let cellContent = "";
                                    let cellStyle = "";

                                    if (module) {

                                        // Find the enrolled module in the student's data
                                        let enrolledModule = frm.doc.enrolled_modules.find(em => em.module === module.name);

                                        cellContent = module.module_name;
                                        cellContent = module.module;
                                        if (enrolledModule) {
                                            if (enrolledModule.status === "Ongoing") {
                                                cellStyle = "background-color: yellow;";
                                            } else if (enrolledModule.status === "Passed") {
                                                cellStyle = "background-color: lightgreen;";
                                            } else if (enrolledModule.status === "Failed") {

                                                cellStyle = "background-color: orange;";
                                                cellContent = cellContent + " - " + enrolledModule.try_number + " Try";

                                            }
                                        }


                                    }

                                    html += `<td style="${cellStyle}">${cellContent}</td>`;
                                });
                                html += `</tr>`;
                            }

                            html += `</tbody></table>`;

                            // Set the HTML content in the HTML field
                            frm.fields_dict['module_visualization'].html(html);
                        } else {
                            // If no modules found, show a message
                            frm.fields_dict['module_visualization'].html("<p>No modules found for the selected filters.</p>");
                        }
                    }
                });
            } else {
                // If required fields are missing, show a message
                frm.fields_dict['module_visualization'].html("<p>Please ensure the department, semester, stage, and academic system type are set.</p>");
            }
        } else if (frm.doc.academic_system_type == "Coursat") {
            if (frm.doc.final_selected_course && frm.doc.semester && frm.doc.stage && frm.doc.academic_system_type) {
                // Fetch presented modules based on the student's department, semester, stage, and academic system type
                frappe.call({
                    method: "frappe.client.get_list",
                    args: {
                        doctype: "Presented Module",
                        filters: {
                            department: frm.doc.final_selected_course,
                            academic_system_type: frm.doc.academic_system_type
                        },
                        fields: ["name", "stage", "module", "module_name", "semester"]  // Adjust fields as per your DocType structure
                    },
                    callback: function (r) {
                        if (r.message) {
            
                            // Organize modules by stage and semester
                            let stages = ["First Year", "Second Year", "Third Year", "Fourth Year", "Fifth Year"];
                            let semesters = ["Fall Semester", "Spring Semester"];
                            let stageModules = {};
            
                            stages.forEach(stage => {
                                stageModules[stage] = {
                                    "Fall Semester": [],
                                    "Spring Semester": []
                                };
                            });
            
                            r.message.forEach(function (module) {
                                if (stageModules[module.stage] && stageModules[module.stage][module.semester]) {
                                    stageModules[module.stage][module.semester].push(module);
                                }
                            });
            
                            // Find the maximum number of modules in any stage and semester to determine the number of rows needed
                            let maxModules = Math.max(...stages.map(stage => Math.max(stageModules[stage]["Fall Semester"].length, stageModules[stage]["Spring Semester"].length)));
            
                            // Generate HTML table
                            let html = `
                            <table class="table table-bordered">
                                <thead>
                                    <tr>
                            `;
            
                            stages.forEach(stage => {
                                html += `<th colspan="2">${stage}</th>`;
                            });
            
                            html += `</tr><tr>`;
            
                            stages.forEach(stage => {
                                semesters.forEach(semester => {
                                    html += `<th>${semester}</th>`;
                                });
                            });
            
                            html += `</tr></thead><tbody>`;
            
                            // Create rows for modules
                            for (let i = 0; i < maxModules; i++) {
                                html += `<tr>`;
                                stages.forEach(stage => {
                                    semesters.forEach(semester => {
                                        let module = stageModules[stage][semester][i];
                                        let cellContent = "";
                                        let cellStyle = "";
            
                                        if (module) {
                                            // Find the enrolled module in the student's data
                                            let enrolledModule = frm.doc.enrolled_modules.find(em => em.module === module.name);
            
                                            cellContent = module.module_name;
                                            cellContent = module.module;
                                            if (enrolledModule) {
                                                if (enrolledModule.status === "Ongoing") {
                                                    cellStyle = "background-color: yellow;";
                                                } else if (enrolledModule.status === "Passed") {
                                                    cellStyle = "background-color: lightgreen;";
                                                } else if (enrolledModule.status === "Failed") {
                                                    cellStyle = "background-color: orange;";
                                                    cellContent = cellContent + " - " + enrolledModule.try_number + " Try";
                                                }
                                            }
                                        }
            
                                        html += `<td style="${cellStyle}">${cellContent}</td>`;
                                    });
                                });
                                html += `</tr>`;
                            }
            
                            html += `</tbody></table>`;
            
                            // Set the HTML content in the HTML field
                            frm.fields_dict['module_visualization'].html(html);
                        } else {
                            // If no modules found, show a message
                            frm.fields_dict['module_visualization'].html("<p>No modules found for the selected filters.</p>");
                        }
                    }
                });
            } else {
                // If required fields are missing, show a message
                frm.fields_dict['module_visualization'].html("<p>Please ensure the department, semester, stage, and academic system type are set.</p>");
            }
            

        }

        frm.add_custom_button(__('Pass Year Check'), function () {
            let dialog = new frappe.ui.Dialog({
                title: __('Pass Year Check'),
                fields: [
                    {
                        label: __('Passed'),
                        fieldname: 'passed',
                        fieldtype: 'Check',
                        reqd: 1
                    },
                    {
                        label: __('Module Link'),
                        fieldname: 'module_link',
                        fieldtype: 'Link',
                        options: 'Presented Module',
                        reqd: 1
                    }
                ],
                primary_action_label: __('Submit'),
                primary_action: function (data) {
                    dialog.hide();
                    frappe.call({
                        method: "kalima.utils.utils.update_student_stage",
                        args: {
                            student_name: frm.doc.name,
                            passed: data.passed,
                            module: data.module_link,
                        },
                        callback: function (r) {
                            if (r.message) {
                                frappe.msgprint(__('Student stage updated successfully'));
                            } else {
                                frappe.msgprint(__('An error occurred while updating the student stage'));
                            }
                        }
                    });
                }
            });

            dialog.show();
        });


    },
});
