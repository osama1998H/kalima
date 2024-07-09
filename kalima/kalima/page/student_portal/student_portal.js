var selected_student = "سعد صالح احمد محمد" ;
var naming_maps = {};
var student_classes = [];

frappe.pages['student-portal'].on_page_load = async function (wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Student Portal',
        single_column: true
    });
    var main_template = frappe.render_template('student_portal', {
        teacher_name: "test"
    }, page.main);
    var $container = $(wrapper).find('.layout-main-section');
    $container.html(main_template);

    // await get_current_user_student();
    await get_classes();
    await content_manager();
}
async function get_classes() {

    let response = await frappe.call({
        method: 'kalima.utils.utils.get_student_classes',
        args:
        {
            student_name:selected_student
        }
    });
    if (response.message) {
        student_classes = response.message;
    }
}


async function content_manager(dont_click = false) {
    var contentColumn = document.querySelector("#content");
    document.querySelectorAll('.btn-secondary').forEach(button => {
        button.addEventListener('click', async function () {
            document.querySelectorAll('.btn-secondary').forEach(btn => {
                btn.classList.remove('btn-info');
                btn.classList.remove('active');
            });
            this.classList.add('btn-info');
            this.classList.add('active');

            contentColumn.innerHTML = ''; // Clear the content column
            var templateName = "basic";
            var template = this.textContent.replace(/\s+/g, '-').toLowerCase();
            var cnt = frappe.render_template(templateName, {}, contentColumn);
            contentColumn.innerHTML = cnt;

            if (template === 'attendance') {
                const columns = [
                    { label: 'Date', fieldname: 'date' },
                    { label: 'Module', fieldname: 'module' },
                    { label: 'Status', fieldname: 'status' },
                    { label: 'Leave', fieldname: 'leave' }
                ];
                await attendance(contentColumn, columns);
            }


            if (template === 'exam-results') {
                await exam_results(contentColumn);
            }

            if (template === 'lecture-schedule') {
                const columns = [
                    { label: 'Class', fieldname: 'class' },
                    { label: 'Module', fieldname: 'module' },
                    { label: 'Day', fieldname: 'day' },
                    { label: 'Start', fieldname: 'start' },
                    { label: 'Finish', fieldname: 'finish' }
                ];
                await populateTable('Class Timetable', contentColumn, columns);
            }

            if (template === 'modules') {
                const columns = [
                    { label: 'Class', fieldname: 'class' },
                    { label: 'Title', fieldname: 'title' },
                ];
                await populateTable('Class Session', contentColumn, columns);
            }

            if (template === 'tasks') {
                await populateTable('Exam Schedule', contentColumn, columns);
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
    // Fetch data from Frappe
    const data = await frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: doctype,
            filters:{
                'class': ['in',student_classes]
            },
            fields: ['name', ...columns.map(col => col.fieldname)],
            // limit_page_length: 15
        }
    });

    console.log("data");
    console.log(data);

    // Create table elements
    const table = document.createElement('table');
    table.classList.add('table', 'border', 'rounded', 'table-hover');
    table.style.borderRadius = '30px';  // Adjust the value as needed

    const thead = document.createElement('thead');
    const tr = document.createElement('tr');

    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = "#";
    tr.appendChild(th);

    // Create table header
    columns.forEach(col => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.textContent = col.label;
        tr.appendChild(th);
    });

    // Add "Edit" column header
    const editTh = document.createElement('th');
    editTh.scope = 'col';
    editTh.textContent = 'Edit';
    tr.appendChild(editTh);

    thead.appendChild(tr);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    // Populate table rows
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

        // Add "Edit" column
        const editTd = document.createElement('td');
        const editButton = document.createElement('button');
        editButton.classList.add('btn', 'btn-primary', 'btn-sm');
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => {
            // Add your edit functionality here
            console.log(`Editing row ${index + 1}`);
        });
        editTd.appendChild(editButton);
        tr.appendChild(editTd);

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
}

async function get_current_user_student() {
    let response = await frappe.call({
        method: 'kalima.utils.utils.get_current_user_student',
    });
    if (response.message) {
        selected_student = response.message.name;
    }
}

async function attendance(container, columns) {
    var data = await frappe.call({
        method: 'kalima.utils.utils.get_student_attendance',
        args: {
            student_name: selected_student
        }
    });

    const groupedData = groupBy(data.message, 'module');
    for (const [module, records] of Object.entries(groupedData)) {
        const moduleContainer = document.createElement('div');
        moduleContainer.innerHTML = `<h3>${module}</h3>`;
        container.appendChild(moduleContainer);
        moduleContainer.appendChild(createTable(records, columns));
    }
}


async function exam_results(container) {
    var data = await frappe.call({
        method: 'kalima.utils.utils.get_student_results',
        args: {
            student_name: selected_student
        }
    });
    console.log(data);

    // Group data by year
    const resultsByYear = data.message.reduce((acc, result) => {
        const year = result.stage || 'Unknown Year'; // Handle cases where year is null
        if (!acc[year]) {
            acc[year] = [];
        }
        acc[year].push(result);
        return acc;
    }, {});

    // Sort years in descending order
    const sortedYears = Object.keys(resultsByYear).sort((a, b) => b - a);

    // Create and append tables for each year
    sortedYears.forEach((year, index) => {
        const br = document.createElement('br');
        const hr = document.createElement('hr');
        const table = document.createElement('table');
        table.className = 'table table-striped table-bordered';
        table.id = `table-${year}`;
        table.style.display = index === 0 ? 'table' : 'none'; // Show the first table, hide others

        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Create header row
        const headerRow = document.createElement('tr');
        ['Module', 'Round', 'Exam Max Result', 'Result', 'Status', 'Cheating', 'Present'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            th.className = 'text-center';
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create data rows
        resultsByYear[year].forEach(result => {
            const row = document.createElement('tr');
            ['module', 'round', 'exam_max_result', 'result', 'status', 'cheating', 'present'].forEach(key => {
                const td = document.createElement('td');
                td.className = 'text-center';
                if (key === 'cheating' || key === 'present') {
                    td.innerHTML = result[key] ? '<i class="bi bi-check-lg"></i>' : '<i class="bi bi-x-lg"></i>';
                } else {
                    td.textContent = result[key];
                }
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        // Add year as collapsible title
        const yearTitle = document.createElement('h3');
        yearTitle.textContent = `${year} `;
        yearTitle.className = 'my-4';
        yearTitle.style.cursor = 'pointer';

        // Add arrow symbol
        const arrow = document.createElement('span');
        arrow.innerHTML = index === 0 ? '▼' : '▶';
        yearTitle.appendChild(arrow);

        // Add event listener to toggle table display
        yearTitle.addEventListener('click', function() {
            const table = document.getElementById(`table-${year}`);
            const isVisible = table.style.display === 'table';
            table.style.display = isVisible ? 'none' : 'table';
            arrow.innerHTML = isVisible ? '▶' : '▼';
        });

        container.appendChild(yearTitle);
        container.appendChild(table);
        container.appendChild(br);
        container.appendChild(hr);
        container.appendChild(br);
    });
}



function groupBy(array, key) {
    return array.reduce((result, currentValue) => {
        (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
        return result;
    }, {});
}

function createTable(records, columns) {
    const table = document.createElement('table');
    table.classList.add('table', 'border', 'rounded', 'table-hover');

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

    thead.appendChild(tr);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    records.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.classList.add('clickable-row');

        tr.addEventListener('click', () => {
            frappe.open_in_new_tab = true;
            frappe.set_route(`/app/student-attendance-entry/${row.name}`);
        });

        const th = document.createElement('th');
        th.scope = 'row';
        th.textContent = index + 1;
        tr.appendChild(th);

        columns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = row[col.fieldname] || '';
            if (col.fieldname === 'leave') {
                td.textContent = row[col.fieldname] ? "Yes" : "No";
            }
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    return table;
}




function toKebabCase(str) {
    return str.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
}
