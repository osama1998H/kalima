import frappe
from frappe.model.document import Document
from frappe import _
from datetime import datetime

class ExamHallDistribution(Document):
    def before_save(self):
        self.validate_time_overlap()
        self.fetch_students()
        

    def validate_time_overlap(self):
        # Get all existing records with the same classroom
        existing_records = frappe.get_all('Exam Hall Distribution',
                                          filters={'classroom': self.classroom},
                                          fields=['name', 'from_date', 'to_date', 'from_time', 'to_time'])

        for record in existing_records:
            # Skip the current record
            if record.name == self.name:
                continue

            # Fetch the current and record days from the child table
            current_days = {d.day for d in self.days}
            rcd = frappe.get_doc('Exam Hall Distribution', record.name)
            record_days = {d.day for d in rcd.days}
   
            # Check if there is an intersection of days
            if current_days & record_days:
                # Convert string dates to datetime.date objects
                current_from_date = datetime.strptime(str(self.from_date), '%Y-%m-%d').date()
                current_to_date = datetime.strptime(str(self.to_date), '%Y-%m-%d').date()
                record_from_date = datetime.strptime(str(record['from_date']), '%Y-%m-%d').date()
                record_to_date = datetime.strptime(str(record['to_date']), '%Y-%m-%d').date()

                # Convert string times to datetime.time objects
                current_from_time = datetime.strptime(str(self.from_time), '%H:%M:%S').time()
                current_to_time = datetime.strptime(str(self.to_time), '%H:%M:%S').time()
                record_from_time = datetime.strptime(str(record['from_time']), '%H:%M:%S').time()
                record_to_time = datetime.strptime(str(record['to_time']), '%H:%M:%S').time()

                # Combine dates with times
                current_from_datetime = datetime.combine(current_from_date, current_from_time)
                current_to_datetime = datetime.combine(current_to_date, current_to_time)
                record_from_datetime = datetime.combine(record_from_date, record_from_time)
                record_to_datetime = datetime.combine(record_to_date, record_to_time)

                # Check if the date ranges overlap
                if current_from_date <= record_to_date and current_to_date >= record_from_date:
                    # Check if the time ranges overlap
                    if not (current_to_time <= record_from_time or current_from_time >= record_to_time):
                        frappe.throw(_("Time overlap with existing record {0}").format(record.name))


                # Check if the date ranges overlap
                if current_from_date <= record_to_date and current_to_date >= record_from_date:
                    # Check if the time ranges overlap
                    if not (current_to_time <= record_from_time or current_from_time >= record_to_time):
                        # Now check for department, stage, and study_system overlap
                        for current_dept in self.exam_departments:
                            for record_dept in rcd.exam_departments:
                                if (current_dept.department == record_dept.department and 
                                    current_dept.stage == record_dept.stage and 
                                    current_dept.study_system == record_dept.study_system):
                                    frappe.throw(_("Department {0} with stage {1} and study system {2} overlaps with existing record {3}")
                                                 .format(current_dept.department, current_dept.stage, current_dept.study_system, record.name))

    def fetch_students(self):
            # Clear existing students in the students child table
            self.set('students', [])

            # Iterate through each department entry in the Exam Departments child table
            counter = 1
            for dept in self.exam_departments:
                # Fetch students matching the department, stage, and study_system filters
                matching_students = frappe.get_all('Student', 
                    filters={
                        'final_selected_course': dept.department,
                        'stage': dept.stage,
                        'study_system': dept.study_system
                    },
                    fields=['name', 'final_selected_course', 'stage', 'study_system']
                )

                # Add each matching student to the students child table
                for student in matching_students:
                    # Avoid adding duplicate students
                    if not any(s.student == student.name for s in self.students):
                        self.append('students', {
                            'student': student.name,
                            'class_code': str(counter),
                            'department': student.final_selected_course,
                            'stage': student.stage,
                            'study_system': student.study_system
                        })
                        
                counter = counter + 1


@frappe.whitelist()
def generate_distro_html(selfname):
    self = frappe.get_doc("Exam Hall Distribution", selfname)
    clsrm = frappe.get_doc("Classroom", self.classroom)
    num_columns = clsrm.columns
    distribution_type = self.distribution_type

    # Clear existing student_distro entries
    self.set('student_distro', [])

    # Fetch students
    self.fetch_students()

    departments = [dept.department for dept in self.exam_departments]

    if distribution_type == "XO":
        if len(departments) != 2:
            frappe.throw(_("XO distribution requires exactly 2 departments"))

        dept1_students = [s for s in self.students if s.department == departments[0]]
        dept2_students = [s for s in self.students if s.department == departments[1]]

        if len(dept1_students) == 0 or len(dept2_students) == 0:
            frappe.throw(_("XO distribution requires students from both departments"))

        html = """
            <table class="table table-bordered">
                <thead>
                    <tr>
        """
        for i in range(num_columns):
            html += f"<th>Column {i+1}</th>"
        html += "</tr></thead><tbody>"

        total_students = len(dept1_students) + len(dept2_students)
        num_rows = (total_students + num_columns - 1) // num_columns

        seating = [["" for _ in range(num_columns)] for _ in range(num_rows)]

        for i in range(num_rows):
            for j in range(num_columns):
                if (i % 2 == 0 and j % 2 == 0) or (i % 2 == 1 and j % 2 == 1):
                    if dept1_students:
                        seating[i][j] = dept1_students.pop(0)
                else:
                    if dept2_students:
                        seating[i][j] = dept2_students.pop(0)

        for i in range(1, num_rows):
            for j in range(num_columns):
                if seating[i][j] and seating[i-1][j] and seating[i][j].department == seating[i-1][j].department:
                    seating[i][j] = None

        for i in range(num_rows):
            html += "<tr>"
            for j in range(num_columns):
                student = seating[i][j]
                if student:
                    bg_color = "#ffffff" if student.department == departments[0] else "#eeeeee"
                    html += f"<td style='background-color:{bg_color};'>{student.student}</td>"
                    self.append('student_distro', {
                        'student': student.student,
                        'column': j + 1,
                        'row': i + 1
                    })
                else:
                    html += "<td></td>"
            html += "</tr>"
        html += "</tbody></table>"

    elif distribution_type == "Parallel":
        department_students = {dept: [s for s in self.students if s.department == dept] for dept in departments}

        max_students = max(len(students) for students in department_students.values())
        html = """
            <table class="table table-bordered">
                <thead>
                    <tr>
        """
        for i in range(num_columns):
            html += f"<th>Column {i+1}</th>"
        html += "</tr></thead><tbody>"

        for i in range(max_students):
            html += "<tr>"
            for j in range(num_columns):
                dept_index = j % len(departments)
                dept = departments[dept_index]
                if department_students[dept]:
                    student = department_students[dept].pop(0)
                    bg_color = "#ffffff" if dept_index % 2 == 0 else "#eeeeee"
                    html += f"<td style='background-color:{bg_color};'>{student.student}</td>"
                    self.append('student_distro', {
                        'student': student.student,
                        'column': j + 1,
                        'row': i + 1
                    })
                else:
                    html += "<td></td>"
            html += "</tr>"
        html += "</tbody></table>"

    else:
        frappe.throw(_("Invalid distribution type"))

    self.save()
    return {'html': html, 'student_distro': self.student_distro}



