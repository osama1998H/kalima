frappe.pages['student-result-sheet-1'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Result Sheet',
		single_column: true
	});
	var crv = 0;

	// Create a form container
	let form = new frappe.ui.FieldGroup({
		fields: [
			{
				fieldtype: 'Link',
				fieldname: 'department',
				label: 'Department',
				// options: 'Faculty Department', 
				options: 'Department',
				read_only: 0,
			},
			{
				fieldtype: 'Link',
				fieldname: 'module',
				label: 'Module',
				options: 'Presented Module', // Replace 'Doctype' with the actual doctype you want to link to
				read_only: 0
			},
			{
				fieldtype: 'Select',
				fieldname: 'semester',
				label: 'Semester',
				options: "Fall Semester\nSprint Semester\nShort Semester\nAnnual"
			},
			{
				fieldtype: 'Button',
				fieldname: 'fetch_students',
				label: 'Fetch Students',
				click: function () {
					let stage = form.get_value('stage');
					let department = form.get_value('department');
					let semester = form.get_value('semester');
					let module = form.get_value('module');
					let round = form.get_value('round');
					fetch_students(stage, department, semester,module,round);
				}
			},
			{
				fieldtype: 'Column Break',
				fieldname: 'clmn',
				options: 'Presented Module',
			},
		
			{
				fieldtype: 'Select',
				fieldname: 'stage',
				label: 'Stage',
				options: "First Year\nSecond Year\nThird Year\nFourth Year\nFifth Year\nBologna"

			},
			{
				fieldtype: 'Select',
				fieldname: 'round',
				label: 'Round',
				options:"First\nSecond\nThird"
			},
			{
				fieldtype: 'Section Break',
				fieldname: 'scnb',
				label: '',
			},
			{
				fieldtype: 'Float',
				fieldname: 'curve',
				label: 'Curve',
				onchange: function (v) {
                    let curve = form.get_value('curve');
					crv = curve;
					let stage = form.get_value('stage');
					let department = form.get_value('department');
					let semester = form.get_value('semester');
					let module = form.get_value('module');
					let round = form.get_value('round');
					fetch_students(stage, department, semester,module,round);
                }
			},
		],
		body: page.body
	});

	form.make();

	// Function to fetch students and display them in a table
	function fetch_students(stage, department, semester,module,round) {
		frappe.call({
			method: 'kalima.utils.utils.get_student_sheet',
			args: {
				stage: stage,
				department: department,
				module: module,
				semester: semester,
				round: round,
			},
			callback: function (response) {
				if (response.message) {
					console.log("response.message");
					console.log(response.message);
					let students = response.message;
					display_students(students);

				}
			}
		});

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
                            <th>Student</th>
                            <th>Formative Assessment (40%)</th>
                            <th>Midterm (10%)</th>
                            <th>Final (50%)</th>
                            <th>Curve</th>
                            <th>Attended the Exam</th>
                            <th>Result</th>
                            <th>Status</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
        `;


		students.forEach(student => {
			var res = student.formative_assessment +student.midterm +student.final_exam_result + crv;
			var status = "Failed";
			if(res > 49)
				{
					status = "Passed"
				}

			table_html += `
                <tr>
                    <td>${student.name}</td>
					<td><input readonly value="${student.formative_assessment}" type="number" class="form-control final-result" placeholder="Final Result" min="0" max="40" required></td>
					<td><input readonly value="${student.midterm}" type="number" class="form-control final-result" placeholder="Midterm" min="0" max="10" required></td>
					<td><input readonly value="${student.final_exam_result}" type="number" class="form-control final-result" placeholder="Final" min="0" max="50" required></td>
					<td><input readonly value="${crv}" type="number" class="form-control final-result" placeholder="" min="0" max="50" required></td>
					<td><input readonly value="${student.present}" value="Yes" type="text" class="form-control final-result" required></td>
					<td><input readonly value="${res}" value="60" type="text" class="form-control final-result" required></td>
					<td><input readonly value="${status}" value="60" type="text" class="form-control final-result"></td>
					<td><input type="text" class="form-control final-result" placeholder="Notes"></td>

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

		$container.find('.submit-results').on('click', function() {

		});
	}
}
