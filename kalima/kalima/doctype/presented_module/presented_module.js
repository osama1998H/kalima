frappe.ui.form.on("Presented Module", {
  department(frm) {
		frm.set_query("module", function() {
			return {
				filters: [
					["department", "=",frm.doc.department]
				]
			}
		});
	},

  // Trigger the calculations when the form is loaded or refreshed
  refresh: function (frm) {
    calculate_total_hours(frm);
  },

  validate: function (frm) {
    validate_total_hours(frm);
  },
  ects: function (frm) {
    frm.set_value("swl", frm.doc.ects * 25);
    frm.set_value("usswl", frm.doc.sswl - frm.doc.swl);
  },
  // sswl: function(frm) {
  //     frm.set_value("usswl",frm.doc.sswl - frm.doc.swl );
  // },
  // Trigger calculations and validations when any field related to hours changes
  number_of_weeks: function (frm) {
    calculate_total_hours(frm);
  },
  hours_per_week: function (frm) {
    validate_hours_per_week(frm, "hours_per_week");
    calculate_total_hours(frm);
  },
  number_of_weeks_online: function (frm) {
    calculate_total_hours(frm);
  },
  hours_per_week_online: function (frm) {
    validate_hours_per_week(frm, "hours_per_week_online");
    calculate_total_hours(frm);
  },
  number_of_weeks_circles: function (frm) {
    calculate_total_hours(frm);
  },
  hours_per_week_circles: function (frm) {
    validate_hours_per_week(frm, "hours_per_week_circles");
    calculate_total_hours(frm);
  },
  number_of_weeks_training: function (frm) {
    calculate_total_hours(frm);
  },
  hours_per_week_training: function (frm) {
    validate_hours_per_week(frm, "hours_per_week_training");
    calculate_total_hours(frm);
  },
  number_of_weeks_practical: function (frm) {
    calculate_total_hours(frm);
  },
  hours_per_week_practical: function (frm) {
    validate_hours_per_week(frm, "hours_per_week_practical");
    calculate_total_hours(frm);
  },
  number_of_weeks_laboratory: function (frm) {
    calculate_total_hours(frm);
  },
  hours_per_week_laboratory: function (frm) {
    validate_hours_per_week(frm, "hours_per_week_laboratory");
    calculate_total_hours(frm);
  },

  // Trigger calculations and validations when any field related to unscheduled hours changes
  number_of_weeks_prepare: function (frm) {
    calculate_total_hours_unscheduled(frm);
  },
  hours_per_week_prepare: function (frm) {
    validate_hours_per_week(frm, "hours_per_week_prepare");
    calculate_total_hours_unscheduled(frm);
  },
  number_of_weeks_lecture: function (frm) {
    calculate_total_hours_unscheduled(frm);
  },
  hours_per_week_lecture: function (frm) {
    validate_hours_per_week(frm, "hours_per_week_lecture");
    calculate_total_hours_unscheduled(frm);
  },
  number_of_weeks_daily: function (frm) {
    calculate_total_hours_unscheduled(frm);
  },
  hours_per_week_daily: function (frm) {
    validate_hours_per_week(frm, "hours_per_week_daily");
    calculate_total_hours_unscheduled(frm);
  },
  number_of_weeks_exam: function (frm) {
    calculate_total_hours_unscheduled(frm);
  },
  hours_per_week_exam: function (frm) {
    validate_hours_per_week(frm, "hours_per_week_exam");
    calculate_total_hours_unscheduled(frm);
  },
});

// Function to calculate and update total hours for each section
function calculate_total_hours(frm) {
  // In Class Hours
  let in_class_total = frm.doc.number_of_weeks * frm.doc.hours_per_week || 0;
  frm.set_value("total_hours", in_class_total);

  // Online Hours
  let online_total =
    frm.doc.number_of_weeks_online * frm.doc.hours_per_week_online || 0;
  frm.set_value("total_hours_online", online_total);

  // Study Circles
  let circles_total =
    frm.doc.number_of_weeks_circles * frm.doc.hours_per_week_circles || 0;
  frm.set_value("total_hours_circles", circles_total);

  // Training Hours
  let training_total =
    frm.doc.number_of_weeks_training * frm.doc.hours_per_week_training || 0;
  frm.set_value("total_hours_training", training_total);

  // Practical Hours
  let practical_total =
    frm.doc.number_of_weeks_practical * frm.doc.hours_per_week_practical || 0;
  frm.set_value("total_hours_practical", practical_total);

  // Laboratory Hours
  let laboratory_total =
    frm.doc.number_of_weeks_laboratory * frm.doc.hours_per_week_laboratory || 0;
  frm.set_value("total_hours_laboratory", laboratory_total);

  // Validate total hours
  validate_total_hours(frm);
}

// Function to calculate and update total hours for unscheduled section
function calculate_total_hours_unscheduled(frm) {
  // Project Preparation
  let prepare_total =
    frm.doc.number_of_weeks_prepare * frm.doc.hours_per_week_prepare || 0;
  frm.set_value("total_hours_prepare", prepare_total);

  // Daily Lecture Preparation
  let lecture_total =
    frm.doc.number_of_weeks_lecture * frm.doc.hours_per_week_lecture || 0;
  frm.set_value("total_hours_lecture", lecture_total);

  // Daily Exam Preparation
  let daily_total =
    frm.doc.number_of_weeks_daily * frm.doc.hours_per_week_daily || 0;
  frm.set_value("total_hours_daily", daily_total);

  // Exam Preparation
  let exam_total =
    frm.doc.number_of_weeks_exam * frm.doc.hours_per_week_exam || 0;
  frm.set_value("total_hours_exam", exam_total);

  // Validate total hours
  validate_total_hours_unscheduled(frm);
}

// Function to validate hours per week
function validate_hours_per_week(frm, fieldname) {
  if (frm.doc[fieldname] > 30) {
    frappe.msgprint(__("Hours per Week cannot exceed 30"));
    frm.set_value(fieldname, 30);
  }
}

// Function to validate total hours against sswl
function validate_total_hours(frm) {
  let total_hours_combined =
    frm.doc.total_hours +
    frm.doc.total_hours_online +
    frm.doc.total_hours_circles +
    frm.doc.total_hours_training +
    frm.doc.total_hours_practical +
    frm.doc.total_hours_laboratory;

  frm.set_value("sswl", total_hours_combined);
  frm.set_value("swl", frm.doc.ects * 25);
  frm.set_value("usswl", frm.doc.swl - frm.doc.sswl);

  // if (total_hours_combined > frm.doc.sswl) {
  //     frappe.throw(__('The sum of all total hours cannot exceed SSWL'));
  // }
}

// Function to validate total hours against usswl
function validate_total_hours_unscheduled(frm) {
  let total_hours_combined_unscheduled =
    frm.doc.total_hours_prepare +
    frm.doc.total_hours_lecture +
    frm.doc.total_hours_daily +
    frm.doc.total_hours_exam;

  if (total_hours_combined_unscheduled > frm.doc.usswl) {
    frappe.throw(
      __("The sum of all unscheduled total hours cannot exceed USSWL")
    );
  }
}
