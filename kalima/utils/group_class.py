# Copyright (c) 2024, e2next and contributors
# For license information, please see license.txt
import random
import frappe
import json


@frappe.whitelist()
def fetch_students(selected_modules, stage, department, semester, study_system, year):
    if not selected_modules or not department:
        frappe.throw("Please select at least one module and ensure department is selected.")

    selected_modules = frappe.parse_json(selected_modules)

    if not selected_modules:
        frappe.throw("No modules selected.")

    # Convert selected_modules to a tuple for SQL query
    selected_modules_tuple = tuple(selected_modules)

    # SQL to get all prerequisites for the selected modules
    prerequisites_query = """
        SELECT DISTINCT module
        FROM `tabPrerequisites Modules`
        WHERE parent IN %s
    """

    prerequisites = frappe.db.sql(prerequisites_query, (selected_modules_tuple,), as_dict=True)
    prerequisites_modules = [row['module'] for row in prerequisites]

    # Prepare the base SQL query to fetch students
    base_query = """
        SELECT student.name, student.full_name_in_arabic
        FROM `tabStudent` AS student
        WHERE student.final_selected_course = %s 
        and  student.stage = %s 
        and  student.semester = %s 
        and  student.study_system = %s 
        and  student.year = %s 
    """
    query_params = [department,stage, semester, study_system, year]

    if prerequisites_modules:
        # Convert prerequisites_modules to a tuple for SQL query
        prerequisites_modules_tuple = tuple(prerequisites_modules)

        # Extend the query to include the prerequisite filter considering "Completed" status
        base_query += """
            AND student.name IN (
                SELECT enrolled.parent
                FROM `tabStudent Enrolled Modules` AS enrolled
                WHERE enrolled.module IN %s
                AND enrolled.status = 'Completed'
                GROUP BY enrolled.parent
                HAVING COUNT(DISTINCT enrolled.module) = %s
            )
        """
        query_params.extend([prerequisites_modules_tuple, len(prerequisites_modules)])

    # Execute the query
    students = frappe.db.sql(base_query, query_params, as_dict=True)

    return students

@frappe.whitelist()
def create_classes(group_title, year, stage, semester, department, group_class_modules, students, divisions):
    group_class_modules = json.loads(group_class_modules)
    students = json.loads(students)
    create_class(group_title, group_class_modules, year, stage, semester, department, students, divisions)
    return "Classes created successfully."

def create_class(group_title, group_class_modules, year, stage, semester, department, students, divisions):
    divisions = int(divisions)
    # Shuffle the students list to randomize the distribution
    random.shuffle(students)
    
    # Calculate the number of students per division
    students_per_division = len(students) // divisions
    # In case there are leftover students, calculate the remainder
    remainder = len(students) % divisions

    # Iterate over the number of divisions and create classes
    for i in range(divisions):
        # Calculate the start and end index for the current division
        start_index = i * students_per_division
        end_index = start_index + students_per_division
        if i == divisions - 1:  # Add the remainder to the last division
            end_index += remainder
        
        # Get the students for the current division
        current_students = students[start_index:end_index]
        
        # Create a new class for the current division
        new_class = frappe.get_doc({
            "doctype": "Class",
            "title": f"{group_title} Group {i+1}",
            "stage": stage,
            "semester": semester,
            "year": year,
            "department": department,
        })
        
        for std in current_students:
            new_class.append("student_list", {"student": std})
            stud = frappe.get_doc("Student", std)
            
            for mod in group_class_modules:
                mody = frappe.db.get_value("Presented Module", mod, "name")
                
                if mody is not None:
                    new_class.append("class_modules", {"module": mody})
                
                stud.append("enrolled_modules", {
                    "module": mod,
                    "status": "Ongoing",
                })
                
            stud.save()
        
        new_class.save()