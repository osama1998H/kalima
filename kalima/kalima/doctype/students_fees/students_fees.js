

frappe.ui.form.on("Students Fees", {
    refresh(frm) {


        frm.set_query("item", () => ({
            "filters": {
                "is_stock_item": 0,
            }
        }));
        frm.add_custom_button(__('Fetch Student'), async function () {
            var students = await frappe.db.get_list('Student', {
                filters: [
                    ['year', '=', frm.doc.year],
                    ['stage', '=', frm.doc.stage],
                    ['semester', '=', frm.doc.semester],
                    ['study_system', '=', frm.doc.study_system],
                    ['fee_category', '=', frm.doc.fee_category],
                ],
                fields: ['name', 'full_name_in_arabic', 'discount'],
                // start: 10,
                // page_length: 20,
                // as_list: True
            });
            var temp_list = [];

            for (let element of students) {
                var discount_type = await frappe.db.get_value("Constant", element.discount, 'type');
                var discount_value = 0;
                console.log("discount_type.message");
                console.log(discount_type.message);
                if (discount_type.message != undefined) {
                    if (discount_type.message.type == "Percentage") {
                        discount_value = await frappe.db.get_value("Constant", element.discount, 'percentage');
                        discount_value = frm.doc.fee_amount * (discount_value.message.percentage / 100);
                    }
                    else {
                        discount_value = await frappe.db.get_value("Constant", element.discount, 'amount');
                        discount_value = discount_value.message.amount;
                    }
                } else {

                }


                var amnt_aftr_disc = frm.doc.fee_amount;
                if (discount_value != null) {
                    amnt_aftr_disc -= discount_value;

                }

                temp_list.push({
                    student: element.name,
                    study_type: frm.doc.study_system,
                    discount_type: element.discount,
                    amount: frm.doc.fee_amount,
                    amount_after_discount: amnt_aftr_disc,
                });
            }
            frm.set_value('students_fees', temp_list);
            frm.refresh_field('students_fees');
            var total_amount = 0;
            frm.doc.students_fees.forEach(element => {
                total_amount += element.amount_after_discount;
            });

            frm.set_value('total_amount', total_amount);
            frm.refresh_field('total_amount');

        }).addClass('bg-success', 'text-white').css({
            "color": "white",
        });
        if (frm.doc.docstatus === 1 && (frm.doc.transfer_date == null && frm.doc.transfer_date == undefined)) {

            frm.add_custom_button(__('Create Invoices'), async function () {
                await frappe.call({
                    method: 'kalima.kalima.doctype.students_fees.students_fees.create_invoices',
                    args: {
                        docname: frm.doc.name
                    },
                    callback: function (r) {
                        if (!r.exc) {
                            frappe.msgprint(__('Invoices created successfully!'));
                        }
                    }
                });

            }).addClass('bg-secondary', 'text-white').css({
                "color": "white",
            });
        }
        if (frm.doc.docstatus === 1 && (frm.doc.transfer_date == null && frm.doc.transfer_date == undefined)) {

            frm.add_custom_button(__('Cancel Invoices'), async function () {
                await frappe.call({
                    method: 'kalima.kalima.doctype.students_fees.students_fees.cancel_invoices',
                    args: {
                        docname: frm.doc.name
                    },
                    callback: function (r) {
                        if (!r.exc) {
                            frappe.msgprint(__('Invoices Canceled successfully!'));
                        }
                    }
                });

            }).addClass('bg-info', 'text-white').css({
                "color": "white",
            });
        }


        frm.fields_dict['students_fees'].grid.wrapper.on('mouseover', 'input[data-fieldname="discount_type"]', async function (e) {

            let $row = $(this).closest('.grid-row');
            let row = frm.fields_dict['students_fees'].grid.grid_rows[$row.index()].doc;

            var discount_type = await frappe.db.get_value("Constant", row.discount_type, 'type');
            var discount_value = 0;

            if (discount_type.message != undefined) {
                if (discount_type.message.type == "Percentage") {
                    discount_value = await frappe.db.get_value("Constant", row.discount_type, 'percentage');
                    discount_value = row.amount * (discount_value.message.percentage / 100);
                } else {
                    discount_value = await frappe.db.get_value("Constant", row.discount_type, 'amount');
                    discount_value = discount_value.message.amount;
                }
            }

            var amnt_aftr_disc = row.amount;
            if (discount_value != null) {
                amnt_aftr_disc -= discount_value;
            }

            frappe.model.set_value(row.doctype, row.name, 'amount_after_discount', amnt_aftr_disc);
            update_total_amount(frm);
        });

        function update_total_amount(frm) {
            var total_amount = 0;
            frm.doc.students_fees.forEach(element => {
                total_amount += element.amount_after_discount;
            });
            frm.set_value('total_amount', total_amount);
            frm.refresh_field('total_amount');
        }


        frm.set_query("item", "addon_fees", function (doc, cdt, cdn) {
            return {
                filters: {
                    is_stock_item: 0
                }
            };
        });
        frm.set_query("income_account", "addon_fees", function (doc, cdt, cdn) {
            return {
                filters: {
                    is_group: 0
                }
            };
        });


        // frm.fields_dict['addon_fees'].grid.wrapper.on('change', 'input[data-fieldname="item"]', function (e) {
        //     // Your custom code to execute when the 'qty' field changes
        //     console.log("Quantity field in child table row changed.");

        //     // Example: recalculate total
        //     frm.trigger('calculate_total');
        // });


    },

    calculate_total: function (frm) {
        console.log("Quasdasdasdasdsdnged.");

    }

});

frappe.ui.form.on("Addon Fees", "item", async function (frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    var item_price = await frappe.db.get_list("Item Price", {
        filters: {
            item_code: row.item
        },
        fields:["name","price_list_rate"]
    })

    row.amount = item_price[0].price_list_rate;
    frm.refresh_field("addon_fees");
});