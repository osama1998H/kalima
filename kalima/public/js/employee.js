frappe.ui.form.on('Employee', {
    onload: function(frm) {
        frm.fields_dict['custom_teaching_module'].grid.get_field('module').get_query = function(doc, cdt, cdn) {
            var row = locals[cdt][cdn];
            return {
                filters: {
                    'department': row.department
                }
            };
        };
    },

});

