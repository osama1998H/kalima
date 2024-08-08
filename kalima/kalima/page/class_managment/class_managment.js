var selected_class;
var selectedTeacher;
var current_class;
var naming_maps = {};
var called = false;

frappe.pages['class-managment'].on_page_load = async function (wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: __('Class Management'),
        single_column: true
    });
    var main_template = frappe.render_template('class_managment', {
        teacher_name: "test"
    }, page.main);
    var $container = $(wrapper).find('.layout-main-section');
    $container.html(main_template);

    await teacher_field(page);
}

async function teacher_field(page) {
    const teacherSelector = frappe.ui.form.make_control({
        parent: page.wrapper.find('#teacher-holder'),
        df: {
            fieldtype: "Link",
            options: "Employee",
            fieldname: "employee",
            label: __("Select Teacher"),
            placeholder: __("Teacher"),
            reqd: 1,
            change: async () => {
                selectedTeacher = teacherSelector.get_value();
                await class_field(page, selectedTeacher);
            }
        }
    });
    teacherSelector.refresh();
}

async function class_field(page, teacher) {
    await frappe.call({
        method: "kalima.utils.utils.get_classes_for_teacher",
        args: {
            teacher_name: teacher
        },
        callback: function (response) {
            if (response.message) {
                page.wrapper.find('#class-holder').empty();

                const classSelector = frappe.ui.form.make_control({
                    parent: page.wrapper.find('#class-holder'),
                    df: {
                        fieldtype: "Link",
                        options: "Class",
                        fieldname: "class",
                        label: __("Select Class"),
                        placeholder: __("Class"),
                        get_query(doc, cdt, cdn) {
                            return {
                                filters: [
                                    ['name', 'in', response.message],
                                ]
                            };
                        },
                        reqd: 1,
                        change: async () => {
                            selected_class = classSelector.get_value();
                            current_class = await frappe.db.get_doc("Class", selected_class, fields = ["student_list"]);
                            if (!called)
                                await content_manager();
                        }
                    }
                });

                classSelector.refresh();
            } else {
                console.log(__("No classes found for the teacher."));
            }
        }
    });
}

async function content_manager(dont_click = false) {
    called = true;
    var contentColumn = document.querySelector("#content");
    document.querySelectorAll('.btn-secondary').forEach(button => {
        button.addEventListener('click', async function () {
            document.querySelectorAll('.btn-secondary').forEach(btn => {
                btn.classList.remove('btn-info');
                btn.classList.remove('active');
            });
            this.classList.add('btn-info');
            this.classList.add('active');

            contentColumn.innerHTML = ''; 
            var templateName = this.textContent.replace(/\s+/g, '-').toLowerCase(); 
            var cnt = frappe.render_template(templateName, {}, contentColumn);
            contentColumn.innerHTML = cnt;

            if (templateName != 'student-list' && templateName != 'dissolution') {
                createFormDialogNew(templateName);
            }

            if (templateName === 'sessions-list') {
                const columns = [
                    { label: __('Title'), fieldname: 'title' },
                    { label: __('Issue Date'), fieldname: 'issue_date' },
                    { label: __('Expiration Date'), fieldname: 'expiration_date' }
                ];
                await populateTable('Class Session', contentColumn, columns);
            } else if (templateName == "continuous-exam-list") {
                const columns = [
                    { label: __('Title'), fieldname: 'title' },
                    { label: __('Type'), fieldname: 'type' },
                    { label: __('Date'), fieldname: 'date' }
                ];
                await populateTable('Class Continuous Exam', contentColumn, columns);
            } else if (templateName == "assignment-list") {
                const columns = [
                    { label: __('Title'), fieldname: 'title' },
                    { label: __('From Date'), fieldname: 'from_date' },
                    { label: __('Percentage'), fieldname: 'percentage' },
                    { label: __('Marked On'), fieldname: 'marked_on' }
                ];
                await populateTable('Assignments and Tasks', contentColumn, columns);
            } else if (templateName == "exam-schedule") {
                const columns = [
                    { label: __('Date'), fieldname: 'date' },
                    { label: __('Time'), fieldname: 'time' },
                ];
                await populateTable('Exam Schedule', contentColumn, columns);
            } else if (templateName == "attendance-entry") {
                const columns = [
                    { label: __('Date'), fieldname: 'date' },
                    { label: __('Presented Module'), fieldname: 'module' }
                ];
                await populateTable('Student Attendance Entry', contentColumn, columns);
            } else if (templateName == "time-table") {
                const columns = [
                    { label: __('Class'), fieldname: 'class' },
                    { label: __('Day'), fieldname: 'day' },
                    { label: __('Start'), fieldname: 'start' },
                    { label: __('Finish'), fieldname: 'finish' }
                ];
                await populateTable('Class Timetable', contentColumn, columns);
            } else if (templateName == "student-list") {
                populateStudents(contentColumn);
            } else if (templateName == "dissolution") {
                populateStudents(contentColumn);
            }
        });
    });

    if (!dont_click) {
        document.querySelectorAll('.first-button').forEach(btn => {
            btn.click();
        });
    }
}


async function populateTable(doctype, container, columns) {
    const data = await frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: doctype,
            fields: ['name', ...columns.map(col => col.fieldname)],
            limit_page_length: 15
        }
    });

    const table = document.createElement('table');
    table.classList.add('table', 'border', 'rounded', 'table-hover');
    table.style.borderRadius = '30px';

    const thead = document.createElement('thead');
    const tr = document.createElement('tr');

    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = "#";
    tr.appendChild(th);

    columns.forEach(col => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.textContent = col.label;
        tr.appendChild(th);
    });

    const editTh = document.createElement('th');
    editTh.scope = 'col';
    editTh.textContent = __('Edit');
    tr.appendChild(editTh);

    thead.appendChild(tr);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    data.message.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.classList.add('clickable-row');

        tr.addEventListener('click', () => {
            frappe.open_in_new_tab = true;
            frappe.set_route(`/app/${toKebabCase(doctype)}/${row.name}`);
        });

        const th = document.createElement('th');
        th.scope = 'row';
        th.textContent = index + 1;
        tr.appendChild(th);

        columns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = row[col.fieldname] || '';
            tr.appendChild(td);
        });

        const editTd = document.createElement('td');
        const editButton = document.createElement('button');
        editButton.classList.add('btn', 'btn-primary', 'btn-sm');
        editButton.textContent = __('Edit');
        editButton.addEventListener('click', () => {
            console.log(__('Editing row {0}', [index + 1]));
        });
        editTd.appendChild(editButton);
        tr.appendChild(editTd);

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
}

async function populateStudents(container) {
    const table = document.createElement('table');
    table.classList.add('table', 'border', 'rounded', 'table-hover');
    table.style.borderRadius = '30px';

    const thead = document.createElement('thead');
    const tr = document.createElement('tr');

    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = "#";
    tr.appendChild(th);

    const columns = [
        { fieldname: 'student', label: __('Student') },
    ];

    columns.forEach(col => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.textContent = col.label;
        tr.appendChild(th);
    });

    thead.appendChild(tr);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    current_class.student_list.forEach((student, index) => {
        const tr = document.createElement('tr');
        tr.classList.add('clickable-row');

        const th = document.createElement('th');
        th.scope = 'row';
        th.textContent = index + 1;
        tr.appendChild(th);

        columns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = student[col.fieldname] || '';
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
}

function createFormDialogNew(templateName) {

    const parent = $('#main-div');
    if (parent.length === 0) {
        console.error("Parent element not found");
        return;
    }
    const button = $('<button class="btn btn-success border hover">Create New</button>').appendTo(parent);

    button.click(async function () {
        var fields = [];
        var default_module = null;
        current_class.class_modules.forEach(element => {
            if (element.teacher = selectedTeacher) {
                default_module = element.module;
            }

        });
        if (templateName == "sessions-list") {
            fields = [
                {
                    label: __('Class'),
                    fieldname: 'class',
                    fieldtype: 'Link',
                    options: 'Class',
                    default: selected_class,
                    reqd: 1,
                    read_only: 1
                },
                {
                    label: __('Title'),
                    fieldname: 'title',
                    fieldtype: 'Data'
                },
                {
                    label: __('Module'),
                    fieldname: 'module',
                    fieldtype: 'Link',
                    options: "Presented Module",
                    default: default_module,
                    read_only: default_module == null ? 0 : 1
                },
                {
                    fieldname: 'column_break_inyc',
                    fieldtype: 'Column Break'
                },
                {
                    label: __('Issue Date'),
                    fieldname: 'issue_date',
                    fieldtype: 'Date'
                },
                {
                    label: __('Expiration Date'),
                    fieldname: 'expiration_date',
                    fieldtype: 'Date'
                },
                {
                    fieldname: 'section_break_inyc',
                    fieldtype: 'Section Break'
                },
                {
                    label: __('Description'),
                    fieldname: 'description',
                    fieldtype: 'Text Editor'
                },
                {
                    label: __('Session Files'),
                    fieldname: 'session_files',
                    fieldtype: 'Table',
                    cannot_add_rows: false,
                    in_place_edit: false,
                    fields: [
                        { fieldname: 'file', fieldtype: 'Attach', in_list_view: 1, label: __('File') },
                        { fieldname: 'description', fieldtype: 'Data', in_list_view: 1, label: __('Description') }
                    ]
                },
            ];
        } else if (templateName == "continuous-exam-list") {
            var opt = current_class.class_modules.map(module => module.module_name).join('\n');
            
            fields = [
                {
                    fieldname: "class",
                    fieldtype: "Link",
                    label: __("Class"),
                    default: selected_class, read_only: 1,
                    options: "Class",
                    reqd: 1
                },
                {
                    fieldname: "title",
                    fieldtype: "Data",
                    label: __("Title")
                },
                {
                    fieldname: "type",
                    fieldtype: "Select",
                    label: __("Type"),
                    options: __("Normal Exam\nAttendance\nProject\nSeminar\nQuiz\nMidterm")
                },
                {
                    label: __('Module'),
                    fieldname: 'module',
                    fieldtype: 'Select',
                    options: opt
                },
                {
                    fieldname: "column_break_bltp",
                    fieldtype: "Column Break"
                },
                {
                    fieldname: "date",
                    fieldtype: "Date",
                    label: __("Date"),
                    reqd: 1
                }, 
                {
                    fieldname: "percentage",
                    fieldtype: "Percent",
                    label: __("Percentage"),
                    reqd: 1,
                    change: async () => {
                        document.querySelector('input[data-fieldname="percentage"]').addEventListener('change', function () {
                            let percentageValue = this.value;
                            let markedOnField = document.querySelector('input[data-fieldname="marked_on"]');
                            markedOnField.value = percentageValue;
                        });
                    }
                },
                {
                    fieldname: "marked_on",
                    fieldtype: "Int",
                    label: __("Marked On"),
                    reqd: 1
                },
                {
                    fieldname: "section_break_gahv",
                    fieldtype: "Section Break"
                },
                {
                    fieldname: "button_fill_students",
                    fieldtype: "Button",
                    label: __("Fill Students"),
                    click: function () {
                        fillStudents();
                    }
                },
                {
                    label: __('Continuous Exam Result'),
                    fieldname: 'continuous_exam_result',
                    fieldtype: 'Table',
                    cannot_add_rows: false,
                    in_place_edit: false,
                    fields: [
                        { fieldname: 'student_code', fieldtype: 'Data', in_list_view: 1, label: __('Student Code') },
                        { fieldname: 'student_name', fieldtype: 'Link', options: 'Student', in_list_view: 1, label: __('Student Name') },
                        { fieldname: 'department', fieldtype: 'Link', options: 'Department', label: __('Department') },
                        {
                            fieldname: 'score', fieldtype: 'Float', in_list_view: 1,
                            label: __('Score'),
                            change: async function () {
                                const row = this;
                                const score = row.doc.score || 0;
                                const percentage = d.get_value('percentage') || 1;
                                const markedOn = d.get_value('marked_on') || 1;
                                row.doc.net_score = (score / markedOn) * percentage;
                                d.fields_dict['continuous_exam_result'].grid.refresh();
                                console.log(__('Score changed. New Net Score: {0}', [row.doc.net_score]));
                            }
                        },
                        { fieldname: 'net_score', fieldtype: 'Float', in_list_view: 0, read_only: 1, label: __('Net Score') },
                        {
                            fieldname: 'is_absent', fieldtype: 'Check', in_list_view: 1, label: __('Is Absent'),
                            change: async function () {
                                const row = this;
                                if (row.doc.is_absent) {
                                    row.doc.net_score = 0;
                                    row.doc.score = 0;
                                    d.fields_dict['continuous_exam_result'].grid.refresh();
                                }
                            }
                        },
                        { fieldname: 'Description', fieldtype: 'Data', in_list_view: 0, label: __('Description') },
                    ],
                    label: __('Score')
                },
                { fieldname: 'Description', fieldtype: 'Data', in_list_view: 1, label: __('Description') },
            ];
        } else if (templateName == "assignment-list") {
            fields = [
                {
                    fieldname: "class",
                    fieldtype: "Link",
                    label: __("Class"),
                    default: selected_class, read_only: 1,
                    options: "Class"
                },
                {
                    fieldname: "title",
                    fieldtype: "Data",
                    label: __("Title")
                }, 
                {
                    fieldname: "percentage",
                    fieldtype: "Percent",
                    label: __("Percentage")
                },
                {
                    label: __('Module'),
                    fieldname: 'module',
                    fieldtype: 'Link',
                    options: "Presented Module",
                    default: default_module,
                    read_only: default_module == null ? 0 : 1
                },
                {
                    fieldname: "column_break_bltp",
                    fieldtype: "Column Break"
                },
                {
                    fieldname: "from_date",
                    fieldtype: "Date",
                    label: __("From Date")
                }, 
                {
                    fieldname: "to_date",
                    fieldtype: "Date",
                    label: __("To Date")
                },
                {
                    fieldname: "marked_on",
                    fieldtype: "Float",
                    label: __("Marked On")
                },
                {
                    fieldname: "section_break_gahv",
                    fieldtype: "Section Break"
                }, 
                {
                    fieldname: "description",
                    fieldtype: "Text Editor",
                    label: __("Description")
                },
                {
                    label: __('Assignment Files'),
                    fieldname: 'assignment_files',
                    fieldtype: 'Table',
                    cannot_add_rows: false,
                    in_place_edit: false,
                    fields: [
                        { fieldname: 'file', fieldtype: 'Attach', in_list_view: 1, label: __('File') },
                        { fieldname: 'description', fieldtype: 'Data', in_list_view: 1, label: __('Description') },
                    ]
                },
            ];
        } else if (templateName == "exam-schedule") {
            fields = [
                {
                    fieldname: "class",
                    fieldtype: "Link",
                    label: __("Class"),
                    default: selected_class, read_only: 1,
                    options: "Class"
                },
                {
                    label: __('Module'),
                    fieldname: 'module',
                    fieldtype: 'Link',
                    options: "Presented Module",
                    default: default_module,
                    read_only: default_module == null ? 0 : 1
                },
                {
                    fieldname: "date",
                    fieldtype: "Date",
                    label: __("Date")
                }, 
                {
                    fieldname: "time",
                    fieldtype: "Time",
                    label: __("Time")
                },
            ];
        } else if (templateName == "attendance-entry") {
            fields = [
                {
                    fieldname: "class",
                    fieldtype: "Link",
                    label: __("Class"),
                    default: selected_class,
                    read_only: 1,
                    hidden: 1,
                    options: "Class"
                }, 
                {
                    fieldname: "teacher",
                    fieldtype: "Link",
                    label: __("Teacher"),
                    default: selectedTeacher,
                    read_only: 1,
                    options: "Employee",
                    hidden: 1
                },
                {
                    fieldname: "year",
                    fieldtype: "Link",
                    in_list_view: 1,
                    label: __("Year"),
                    options: "Educational Year",
                    reqd: 1,
                    default: current_class.year,
                    hidden: 1
                },
                {
                    fieldname: "department",
                    fieldtype: "Link",
                    in_list_view: 1,
                    label: __("Department"),
                    options: "Department",
                    reqd: 1,
                    default: current_class.department,
                    hidden: 1
                }, 
                {
                    fieldname: "date",
                    fieldtype: "Date",
                    label: __("Date"),
                    default: frappe.datetime.nowdate(),
                    reqd: 1
                },
                {
                    label: __('Module'),
                    fieldname: 'module',
                    fieldtype: 'Link',
                    options: "Presented Module",
                    default: default_module,
                    read_only: default_module == null ? 0 : 1
                },
                {
                    fieldname: "column_break_wvoi",
                    fieldtype: "Column Break"
                },
                {
                    fieldname: "module",
                    fieldtype: "Link",
                    label: __("Presented Module"),
                    options: "Presented Module",
                    hidden: 1,
                    default: current_class.module,
                },
                {
                    fieldname: "semester",
                    fieldtype: "Select",
                    label: __("Semester"),
                    options: __("Fall Semester\nSpring Semester\nShort Semester\nAnnual"),
                    hidden: 1,
                    default: current_class.semester,
                }, 
                {
                    fieldname: "stage",
                    fieldtype: "Select",
                    label: __("Stage"),
                    options: __("First Year\nSecond Year\nThird Year\nFourth Year\nFifth Year"),
                    hidden: 1,
                    default: current_class.stage,
                },
                {
                    fieldname: "section_break_fsrg",
                    fieldtype: "Section Break"
                },
            ];
        
            let student_count = current_class.student_list.length;
            let column_count = Math.ceil(student_count / 3);
        
            current_class.student_list.forEach((element, index) => {
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
                    label: element.student
                });
        
                naming_maps[element.name] = element.student;
            });
        
            if (student_count % column_count !== 0) {
                fields.push({
                    fieldname: `column_break_${Math.floor(student_count / column_count)}`,
                    fieldtype: "Column Break"
                });
            }
        } else if (templateName == "time-table") {
            fields = [
                {
                    fieldname: "class",
                    fieldtype: "Link",
                    label: __("Class"),
                    options: "Class"
                }, 
                {
                    fieldname: "teacher",
                    fieldtype: "Link",
                    label: __("Teacher"),
                    options: "Employee",
                    default: selectedTeacher, read_only: 1,
                },
                {
                    fieldname: "day",
                    fieldtype: "Link",
                    options: "Week Day",
                    label: __("Day"),
                },
                {
                    label: __('Module'),
                    fieldname: 'module',
                    fieldtype: 'Link',
                    options: "Presented Module",
                    default: default_module,
                    read_only: default_module == null ? 0 : 1
                },
                {
                    fieldname: "column_break_wvoi",
                    fieldtype: "Column Break"
                },
                {
                    fieldname: "start",
                    fieldtype: "Time",
                    label: __("Start")
                },
                {
                    fieldname: "finish",
                    fieldtype: "Time",
                    label: __("Finish")
                }, 
                {
                    fieldname: "section_break_fsrg",
                    fieldtype: "Section Break"
                },
                {
                    fieldname: "description",
                    fieldtype: "Small Text",
                    label: __("Description")
                },
            ];
        }
        
        async function fillStudents() {
            // Simulate fetching student data (you can replace this with actual data fetching logic)
            let students = [];
        
            console.log(current_class.student_list);
        
            current_class.student_list.forEach(element => {
                students.push({
                    student_code: element.student,
                    student_name: element.student // Assuming the student name is stored in the same field
                });
            });
        
            let tableField = d.fields_dict['continuous_exam_result'].grid;
        
            // Clear existing rows
            tableField.df.data = [];
        
            // Add new rows directly to the grid's data array
            students.forEach(student => {
                tableField.df.data.push({
                    student_code: student.student_code,
                    student_name: student.student_name,
                    // department: student.department || __('N/A'), // Default value or actual if available
                    // score: student.score || 0, // Default value or actual if available
                    // net_score: (student.score || 0) / (d.get_value('marked_on') || 1) * (d.get_value('percentage') || 1) // Ensure no division by zero
                });
            });
        
            tableField.refresh();
        }
        
        let d = new frappe.ui.Dialog({
            title: __('Enter details'),
            fields: fields,
            size: 'large', // small, large, extra-large
            primary_action_label: __('Submit'),
            async primary_action(values) {
                // console.log(values);
                if (templateName == "attendance-entry") {
                    values["attednance"] = [];
                    var idx = 1;
                    var today = new Date();
                    var dayNumber = today.getDay();
                    var weekdayNames = [__('Sunday'), __('Monday'), __('Tuesday'), __('Wednesday'), __('Thursday'), __('Friday'), __('Saturday')];
                    var currentDay = weekdayNames[dayNumber];
                    // Call the custom server-side method
                    var tt = await frappe.call({
                        method: 'kalima.utils.utils.get_class_timetable',
                        args: {
                            selected_class: selected_class,
                            selected_teacher: selectedTeacher,
                            current_day: currentDay
                        }
                    });
                    var lecture_time = tt.message["lecture_duration"];
        
                    for (const [key, value] of Object.entries(naming_maps)) {
                        if (values[key] == 1) {
                            values["attednance"].push({
                                "idx": idx,
                                "__islocal": true,
                                "student": value, // Access the name directly
                                "status": __('Present'),
                                "number_of_hours": parseFloat(lecture_time),
                                "attendance_duration": parseFloat(lecture_time),
                            });
                            idx++;
                        }
                    }
                }
                // return;
                if (templateName == "sessions-list") {
                    var creation_fields = {
                        doctype: 'Class Session',
                        class: values.class,
                        title: values.title,
                        module: values.module,
                        issue_date: values.issue_date,
                        expiration_date: values.expiration_date,
                        session_files: values.session_files,
                        description: values.description
                    }
                } else if (templateName == "continuous-exam-list") {
                    values.continuous_exam_result.forEach(element => {
                        element["net_score"] = (element.score / values.marked_on) * values.percentage;
                    });
                    console.log(values);
        
                    var creation_fields = {
                        doctype: 'Class Continuous Exam',
                        class: values.class,
                        title: values.title,
                        type: values.type,
                        date: values.date,
                        module: values.module,
                        score: values.score,
                        marked_on: values.marked_on,
                        continuous_exam_result: values.continuous_exam_result,
                        percentage: values.percentage
                    }
                } else if (templateName == "assignment-list") {
                    var creation_fields = {
                        doctype: 'Assignments and Tasks',
                        class: values.class,
                        title: values.title,
                        from_date: values.from_date,
                        module: values.module,
                        to_date: values.to_date,
                        description: values.description,
                        marked_on: values.marked_on,
                        assignment_files: values.assignment_files,
                        percentage: values.percentage
                    }
                } else if (templateName == "exam-schedule") {
                    var creation_fields = {
                        doctype: 'Exam Schedule',
                        date: values.date,
                        class: values.class,
                        module: values.module,
                        time: values.time,
                    }
                } else if (templateName == "attendance-entry") {
                    var creation_fields = {
                        doctype: 'Student Attendance Entry',
                        year: values.year,
                        class: values.class,
                        semester: values.semester,
                        department: values.department,
                        module: values.module,
                        module: values.module,
                        date: values.date,
                        teacher: values.teacher,
                        attednance: values.attednance,
                    }
                } else if (templateName == "time-table") {
                    var creation_fields = {
                        doctype: 'Class Timetable',
                        class: values.class,
                        day: values.day,
                        start: values.start,
                        module: values.module,
                        finish: values.finish,
                        teacher: values.teacher,
                        description: values.description,
                    }
                }
                frappe.call({
                    method: 'frappe.client.insert',
                    args: {
                        doc: creation_fields
                    },
                    callback: function (response) {
                        if (!response.exc) {
                            frappe.msgprint(__('Record created successfully!'));
                            var contentColumn = document.querySelector("#content");
                            refresh(templateName, contentColumn);
                            d.hide();
                        } else {
                            frappe.msgprint(__('An error occurred while creating the record.'));
                        }
                    }
                });
                // d.hide();
        
                // await content_manager(true);
        
            }
        });
        
        d.show();
    });


    const btn = $('<button class="btn btn-info border hover">View List</button>').appendTo(parent);
    btn.click(async function () {
        const encodedClass = encodeURIComponent(selected_class);

        let url = "";
        if (templateName == "attendance-entry") {
            url = `/app/student-attendance-entry?class=${encodedClass}`;
        } else if (templateName == "sessions-list") {
            url = `/app/class-session?class=${encodedClass}`;
        } else if (templateName == "continuous-exam-list") {
            url = `/app/class-continuous-exam?class=${encodedClass}`;
        } else if (templateName == "assignment-list") {
            url = `/app/assignments-and-tasks?class=${encodedClass}`;
        } else if (templateName == "exam-schedule") {
            url = `/app/exam-schedule?class=${encodedClass}`;
        } else if (templateName == "time-table") {
            url = `/app/class-timetable?class=${encodedClass}`;
        }

        if (url !== "") {
            window.open(url, '_blank');
        }
    });

}


function toKebabCase(str) {
    return str.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
}

async function refresh(templateName, contentColumn) {

    contentColumn.innerHTML = ''; // Clear the content column
    var cnt = frappe.render_template(templateName, {}, contentColumn);
    contentColumn.innerHTML = cnt;

    if (templateName != 'student-list' && templateName != 'dissolution') {
        createFormDialogNew(templateName);
    }

    if (templateName === 'sessions-list') {
        const columns = [
            { label: __('Title'), fieldname: 'title' },
            { label: __('Issue Date'), fieldname: 'issue_date' },
            { label: __('Expiration Date'), fieldname: 'expiration_date' }
        ];
        await populateTable('Class Session', contentColumn, columns);
    } else if (templateName == "continuous-exam-list") {
        const columns = [
            { label: __('Title'), fieldname: 'title' },
            { label: __('Type'), fieldname: 'type' },
            { label: __('Date'), fieldname: 'date' }
        ];
        await populateTable('Class Continuous Exam', contentColumn, columns);
    } else if (templateName == "assignment-list") {
        const columns = [
            { label: __('Title'), fieldname: 'title' },
            { label: __('From Date'), fieldname: 'from_date' },
            { label: __('Percentage'), fieldname: 'percentage' },
            { label: __('Marked On'), fieldname: 'marked_on' }
        ];
        await populateTable('Assignments and Tasks', contentColumn, columns);
    } else if (templateName == "exam-schedule") {
        const columns = [
            { label: __('Date'), fieldname: 'date' },
            { label: __('Time'), fieldname: 'time' },
        ];
        await populateTable('Exam Schedule', contentColumn, columns);
    } else if (templateName == "attendance-entry") {
        const columns = [
            { label: __('Date'), fieldname: 'date' },
            { label: __('Presented Module'), fieldname: 'module' }
        ];
        await populateTable('Student Attendance Entry', contentColumn, columns);
    } else if (templateName == "time-table") {
        const columns = [
            { label: __('Class'), fieldname: 'class' },
            { label: __('Day'), fieldname: 'day' },
            { label: __('Start'), fieldname: 'start' },
            { label: __('Finish'), fieldname: 'finish' }
        ];
        await populateTable('Class Timetable', contentColumn, columns);
    } else if (templateName == "student-list") {
        populateStudents(contentColumn);
    }

}
