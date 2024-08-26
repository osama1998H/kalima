var selected_student ;//="سعد صالح احمد محمد";
var naming_maps = {};
var student_classes = [];

frappe.pages['student-portal'].on_page_load = async function (wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: __('Student Portal'),
        single_column: true
    });
    var main_template = frappe.render_template('student_portal', {
        teacher_name: __('test')
    }, page.main);
    var $container = $(wrapper).find('.layout-main-section');
    $container.html(main_template);

    await get_current_user_student();
    await get_classes();
    await content_manager();
}

async function get_classes() {
    let response = await frappe.call({
        method: 'kalima.utils.utils.get_student_classes',
        args: {
            student_name: selected_student
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
                    { label: __('Date'), fieldname: 'date' },
                    { label: __('Module'), fieldname: 'module' },
                    { label: __('Status'), fieldname: 'status' },
                    { label: __('Leave'), fieldname: 'leave' }
                ];
                await attendance(contentColumn, columns);
            }

            if (template === 'exam-results') {
                await exam_results(contentColumn);
            }

            if (template === 'lecture-schedule') {
                const columns = [
                    { label: __('Class'), fieldname: 'class' },
                    { label: __('Module'), fieldname: 'module' },
                    { label: __('Module Name'), fieldname: 'module_name' },
                    { label: __('Day'), fieldname: 'day' },
                    { label: __('Start'), fieldname: 'start' },
                    { label: __('Finish'), fieldname: 'finish' }
                ];
                await populateTableNewX(__('Class Timetable'), contentColumn, columns);
            }

            if (template === 'modules') {
                const columns = [
                    { label: __('Class'), fieldname: 'class' },
                    { label: __('Title'), fieldname: 'title' },
                    { label: __('Module'), fieldname: 'module' },
                    { label: __('Description'), fieldname: 'description' },
                    { label: __('Session files'), fieldname: 'session_files' },
                ];
                await populateCards(__('Class Session'), contentColumn, columns);
            }
            if (template === 'tasks') {
                await displayTasks(contentColumn);
            }
        });
    });

    if (!dont_click) {
        document.querySelectorAll('.first-button').forEach(btn => {
            btn.click();
        });
    }
}

async function populateTableNew(doctype, container, columns) {
    // Fetch data from Frappe
    const data = await frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: doctype,
            filters: {
                'class': ['in', student_classes]
            },
            fields: ['module', 'name', ...columns.map(col => col.fieldname)],
            // limit_page_length: 15
        }
    });

    // Group data by module
    const groupedData = data.message.reduce((acc, row) => {
        const module = row.module || __('Unknown Module'); // Handle cases where module is null
        if (!acc[module]) {
            acc[module] = [];
        }
        acc[module].push(row);
        return acc;
    }, {});

    // Generate a unique identifier for each module
    let moduleCounter = 0;

    for (const [module, records] of Object.entries(groupedData)) {
        console.log("groupedData");
        console.log(groupedData);
        console.log(module);
        moduleCounter++;

        // Create collapse button
        const collapseButton = document.createElement('button');
        collapseButton.className = 'btn btn-primary my-2';
        collapseButton.type = 'button';
        collapseButton.setAttribute('data-toggle', 'collapse');
        collapseButton.setAttribute('data-target', `#collapseModule${moduleCounter}`);
        collapseButton.setAttribute('aria-expanded', 'false');
        collapseButton.setAttribute('aria-controls', `collapseModule${moduleCounter}`);
        collapseButton.innerHTML = `${module} <span class="bi bi-chevron-down"></span>`;

        // Create collapse container
        const collapseContainer = document.createElement('div');
        collapseContainer.className = 'collapse';
        collapseContainer.id = `collapseModule${moduleCounter}`;

        // Create table for each module
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

        thead.appendChild(tr);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        // Populate table rows
        records.forEach((row, index) => {
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

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        collapseContainer.appendChild(table);

        // Append elements to the container
        container.appendChild(collapseButton);
        container.appendChild(document.createElement('br'));
        container.appendChild(collapseContainer);
        container.appendChild(document.createElement('br'));
        container.appendChild(document.createElement('hr'));
        container.appendChild(document.createElement('br'));
    }
}


async function populateTableNewX(doctype, container, columns) {
    // Fetch data from Frappe
    const data = await frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: doctype,
            filters: {
                'class': ['in', student_classes]
            },
            fields: ['module', 'name', ...columns.map(col => col.fieldname)],
            // limit_page_length: 15
        }
    });

    // Group data by module
    const groupedData = data.message.reduce((acc, row) => {
        const module = row.module_name || __('Unknown Module'); // Handle cases where module is null
        if (!acc[module]) {
            acc[module] = [];
        }
        acc[module].push(row);
        return acc;
    }, {});

    // Generate a unique identifier for each module
    let moduleCounter = 0;

    for (const [module, records] of Object.entries(groupedData)) {
        console.log("groupedData");
        console.log(groupedData);
        console.log(module);
        moduleCounter++;

        // Create collapse button
        const collapseButton = document.createElement('button');
        collapseButton.className = 'btn btn-primary my-2';
        collapseButton.type = 'button';
        collapseButton.setAttribute('data-toggle', 'collapse');
        collapseButton.setAttribute('data-target', `#collapseModule${moduleCounter}`);
        collapseButton.setAttribute('aria-expanded', 'false');
        collapseButton.setAttribute('aria-controls', `collapseModule${moduleCounter}`);
        collapseButton.innerHTML = `${module} <span class="bi bi-chevron-down"></span>`;

        // Create collapse container
        const collapseContainer = document.createElement('div');
        collapseContainer.className = 'collapse';
        collapseContainer.id = `collapseModule${moduleCounter}`;

        // Create table for each module
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

        thead.appendChild(tr);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        // Populate table rows
        records.forEach((row, index) => {
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

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        collapseContainer.appendChild(table);

        // Append elements to the container
        container.appendChild(collapseButton);
        container.appendChild(document.createElement('br'));
        container.appendChild(collapseContainer);
        container.appendChild(document.createElement('br'));
        container.appendChild(document.createElement('hr'));
        container.appendChild(document.createElement('br'));
    }
}
async function populateCards(doctype, container, columns) {
    var data;
    let response = await frappe.call({
        method: 'kalima.utils.utils.get_sessions',
        args:
        {
            // student_classes: student_classes,
            student_name: selected_student
        }
    });
    if (response.message) {
        student_classes = response.message;
        console.log(response.message);
        data = response;
    }

    // Group data by module
    const groupedData = data.message.reduce((acc, row) => {
        const module = row.module || 'Unknown Module'; // Handle cases where module is null
        if (!acc[module]) {
            acc[module] = [];
        }
        acc[module].push(row);
        return acc;
    }, {});

    // Generate a unique identifier for each group
    let groupCounter = 0;
    for (const [group, records] of Object.entries(groupedData)) {
        groupCounter++;
    
        // Create collapse button for the module group
        const collapseButton = document.createElement('button');
        collapseButton.className = 'btn btn-primary my-2';
        collapseButton.type = 'button';
        collapseButton.setAttribute('data-toggle', 'collapse');
        collapseButton.setAttribute('data-target', `#collapseGroup${groupCounter}`);
        collapseButton.setAttribute('aria-expanded', 'false');
        collapseButton.setAttribute('aria-controls', `collapseGroup${groupCounter}`);
        collapseButton.innerHTML = `${group} <span class="bi bi-chevron-down"></span>`;
    
        // Create collapse container for the module group
        const collapseContainer = document.createElement('div');
        collapseContainer.className = 'collapse';
        collapseContainer.id = `collapseGroup${groupCounter}`;
    
        // Create cards for each record within the module group
        records.forEach((record, index) => {
            const cardContainer = document.createElement('div');
            cardContainer.className = 'card mb-3 w-100';
            cardContainer.style.border = '1px solid #ddd';
            cardContainer.style.borderRadius = '8px';
            cardContainer.style.padding = '16px';
            cardContainer.style.marginBottom = '16px';
    
            // Create card header (collapsible button)
            const cardHeader = document.createElement('button');
            cardHeader.className = 'btn btn-link text-left w-100';
            cardHeader.type = 'button';
            cardHeader.setAttribute('data-toggle', 'collapse');
            cardHeader.setAttribute('data-target', `#collapseCard${groupCounter}-${index}`);
            cardHeader.setAttribute('aria-expanded', 'false');
            cardHeader.setAttribute('aria-controls', `collapseCard${groupCounter}-${index}`);
            cardHeader.innerHTML = `${record.title} - ${record.issue_date} <span class="bi bi-chevron-down"></span>`;
    
            // Create card collapse container
            const cardCollapseContainer = document.createElement('div');
            cardCollapseContainer.className = 'collapse';
            cardCollapseContainer.id = `collapseCard${groupCounter}-${index}`;
    
            // Create card body
            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';
    
            // Add card content
            columns.forEach(col => {
                if (col.fieldname !== 'title' && col.fieldname !== 'issue_date') {
                    if (col.fieldname === 'session_files' && record[col.fieldname]) {
                        const cardText = document.createElement('p');
                        cardText.className = 'card-text';
                        cardText.innerHTML = `<strong>${col.label}:</strong> `;
                        const files = record[col.fieldname];
                        files.forEach(file => {
                            const link = document.createElement('a');
                            link.href = file;
                            link.target = '_blank';
                            link.className = 'btn btn-primary my-1';
                            const fileName = file.split('/').pop();
                            link.textContent = fileName;
                            cardText.appendChild(link);
                            cardText.appendChild(document.createElement('br'));
                        });
                        cardBody.appendChild(cardText);
                    } else {
                        const cardText = document.createElement('p');
                        cardText.className = 'card-text';
                        cardText.innerHTML = `<strong>${col.label}:</strong> ${record[col.fieldname] || ''}`;
                        cardBody.appendChild(cardText);
                    }
                }
            });
    
            cardCollapseContainer.appendChild(cardBody);
            cardContainer.appendChild(cardHeader);
            cardContainer.appendChild(cardCollapseContainer);
            collapseContainer.appendChild(cardContainer);
        });
    
        // Append elements to the container
        container.appendChild(collapseButton);
        container.appendChild(document.createElement('br'));
        container.appendChild(collapseContainer);
        container.appendChild(document.createElement('br'));
        container.appendChild(document.createElement('hr'));
        container.appendChild(document.createElement('br'));
    }
    
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

    // Generate a unique identifier for each module
    let moduleCounter = 0;

    for (const [module, records] of Object.entries(groupedData)) {
        moduleCounter++;

        // Create collapse button
        const collapseButton = document.createElement('button');
        const br = document.createElement('br');

        collapseButton.className = 'btn btn-primary';
        collapseButton.type = 'button';
        collapseButton.setAttribute('data-toggle', 'collapse');
        collapseButton.setAttribute('data-target', `#collapseModule${moduleCounter}`);
        collapseButton.setAttribute('aria-expanded', 'false');
        collapseButton.setAttribute('aria-controls', `collapseModule${moduleCounter}`);
        collapseButton.innerHTML = __(`${module}`);

        // Create collapse container
        const collapseContainer = document.createElement('div');
        collapseContainer.className = 'collapse';
        collapseContainer.id = `collapseModule${moduleCounter}`;

        // Append collapse button and container to the main container
        container.appendChild(collapseButton);
        container.appendChild(collapseContainer);
        container.appendChild(document.createElement('br'));
        container.appendChild(document.createElement('br'));

        // Add table to the collapse container
        collapseContainer.appendChild(createTable(records, columns));
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
        const year = result.stage || __('Unknown Year'); // Handle cases where year is null
        if (!acc[year]) {
            acc[year] = [];
        }
        acc[year].push(result);
        return acc;
    }, {});

    // Sort years in descending order
    const sortedYears = Object.keys(resultsByYear).sort((a, b) => b - a);

    sortedYears.forEach((year, index) => {
        // Create collapse button
        const collapseButton = document.createElement('button');
        collapseButton.className = 'btn btn-primary my-2';
        collapseButton.type = 'button';
        collapseButton.setAttribute('data-toggle', 'collapse');
        collapseButton.setAttribute('data-target', `#collapseYear${index}`);
        collapseButton.setAttribute('aria-expanded', 'false');
        collapseButton.setAttribute('aria-controls', `collapseYear${index}`);
        collapseButton.innerHTML = __(`${year} <span class="bi bi-chevron-down"></span>`);

        // Create collapse container
        const collapseContainer = document.createElement('div');
        collapseContainer.className = 'collapse';
        collapseContainer.id = `collapseYear${index}`;

        // Create table for each year
        const table = document.createElement('table');
        table.className = 'table table-striped table-bordered my-2';
        table.id = `table-${year}`;

        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Create header row
        const headerRow = document.createElement('tr');
        [__('Module'), __('Round'), __('Exam Max Result'), __('Result'), __('Status'), __('Cheating'), __('Present')].forEach(text => {
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

        // Append elements to the container
        container.appendChild(collapseButton);
        container.appendChild(document.createElement('br'));
        collapseContainer.appendChild(table);
        container.appendChild(collapseContainer);
        container.appendChild(document.createElement('br'));
        container.appendChild(document.createElement('hr'));
        container.appendChild(document.createElement('br'));
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

async function displayTasks(container) {
    var data;
    let response = await frappe.call({
        method: 'kalima.utils.utils.get_student_tasks',
        args: {
            student_name: selected_student
        }
    });
    if (response.message) {
        data = response.message;
        console.log(data);
    }

    // Group data by class
    const groupedData = data.reduce((acc, row) => {
        const studentClass = row.class || __('Unknown Class'); // Handle cases where class is null
        if (!acc[studentClass]) {
            acc[studentClass] = [];
        }
        acc[studentClass].push(row);
        return acc;
    }, {});

    // Generate a unique identifier for each group
    let groupCounter = 0;
    for (const [studentClass, records] of Object.entries(groupedData)) {
        groupCounter++;

        // Create header for the class group
        const classHeader = document.createElement('h3');
        classHeader.className = 'mt-4';
        classHeader.textContent = __(studentClass);
        container.appendChild(classHeader);

        // Create collapse container for the class group
        const collapseContainer = document.createElement('div');
        collapseContainer.className = 'mb-3';

        // Create cards for each record within the class group
        records.forEach((record, index) => {
            const cardContainer = document.createElement('div');
            cardContainer.className = 'card mb-3 w-100';
            cardContainer.style.border = '1px solid #ddd';
            cardContainer.style.borderRadius = '8px';
            cardContainer.style.padding = '16px';
            cardContainer.style.marginBottom = '16px';

            // Create card header (collapsible button)
            const cardHeader = document.createElement('button');
            cardHeader.className = 'btn btn-link text-left w-100';
            cardHeader.type = 'button';
            cardHeader.setAttribute('data-toggle', 'collapse');
            cardHeader.setAttribute('data-target', `#collapseCard${groupCounter}-${index}`);
            cardHeader.setAttribute('aria-expanded', 'false');
            cardHeader.setAttribute('aria-controls', `collapseCard${groupCounter}-${index}`);
            cardHeader.innerHTML = __(`${record.title} - ${record.creation || ''} <span class="bi bi-chevron-down"></span>`);

            // Create card collapse container
            const cardCollapseContainer = document.createElement('div');
            cardCollapseContainer.className = 'collapse';
            cardCollapseContainer.id = `collapseCard${groupCounter}-${index}`;

            // Create card body
            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';

            // Add card content
            for (const key in record) {
                if (key !== 'title' && key !== 'creation' && record[key]) {
                    if (key === 'file') {
                        const cardText = document.createElement('p');
                        cardText.className = 'card-text';
                        cardText.innerHTML = `<strong>${__('Files')}:</strong> `;
                        const files = record[key].split(', ');
                        files.forEach(file => {
                            const link = document.createElement('a');
                            link.href = file;
                            link.target = '_blank';
                            link.className = 'btn btn-primary my-1';
                            const fileName = file.split('/').pop();
                            link.textContent = __(fileName);
                            cardText.appendChild(link);
                            cardText.appendChild(document.createElement('br'));
                        });
                        cardBody.appendChild(cardText);
                    } else {
                        const cardText = document.createElement('p');
                        cardText.className = 'card-text';
                        cardText.innerHTML = `<strong>${__(key)}:</strong> ${__(record[key])}`;
                        cardBody.appendChild(cardText);
                    }
                }
            }

            cardCollapseContainer.appendChild(cardBody);
            cardContainer.appendChild(cardHeader);
            cardContainer.appendChild(cardCollapseContainer);
            collapseContainer.appendChild(cardContainer);
        });

        // Append elements to the container
        container.appendChild(collapseContainer);
    }
}
