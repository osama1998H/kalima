frappe.ui.form.on("Lend Book", {
    refresh(frm) {
        if (!frm.is_new() &&  frm.doc.is_returned != 1) {
            frm.add_custom_button(__('Return'), async function () {
                frm.set_value('is_returned', 1);
                frm.set_value('return_date', frappe.datetime.now_datetime()); // Assign the current date and time
                frm.save_or_update(); // Save the document after setting the values
            });
        }
    },
});
