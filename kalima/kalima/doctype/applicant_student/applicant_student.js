// Copyright (c) 2024, e2next and contributors
// For license information, please see license.txt

frappe.ui.form.on("Applicant Student", {
    refresh(frm) {
        if (!frm.is_new() && frm.doc.admission_status != "Accepted") {
            frm.add_custom_button(__('Admit Student'), function () {
                let d = new frappe.ui.Dialog({
                    title: 'Enter details',
                    fields: [
                        {
                            label: 'Department',
                            fieldname: 'department',
                            fieldtype: 'Link',
                            // options: "Faculty Department",
                            options: "Department",
                            reqd: 1,
                            get_query: function () {
                                return {
                                    filters: [
                                        ['name', 'in', frm.doc.prefered_departments.map(dept => dept.department)]
                                    ]
                                };
                            }
                        },
                        {
                            label: 'Study System',
                            fieldname: 'study_system',
                            fieldtype: 'Select',
                            options: "Morning\nEvening",
                            reqd: 1,
                        }
                    ],
                    size: 'small', // small, large, extra-large 
                    primary_action_label: 'Admit',
                    primary_action(values) {

                        var progressIndicator = frappe.show_progress('Loading..', 70, 100, 'Please wait');

                        frappe.call({
                            method: "kalima.kalima.doctype.applicant_student.applicant_student.admit_student",
                            args: {
                                doc_name: cur_frm.doc.name,
                                department: values["department"],
                                study_system: values["study_system"]
                            },
                            callback: function (response) {
                                if (response.message) {
                                    progressIndicator.hide();
                                    frappe.msgprint(__('Student document {0} created successfully.', [response.message]));
                                }
                            }
                        });
                        d.hide();
                    }
                });

                d.show();
            }).addClass('bg-success', 'text-white').css({
                "color": "white",
            });
        }


        function numberToArabicWords(num) {
            const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
            const tens = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
            const teens = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
            const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];
            
            if (num < 10) return ones[num];
            if (num < 20) return teens[num - 10];
            if (num < 100) return (num % 10 === 0 ? "" :  ones[num % 10]) +" و " + tens[Math.floor(num / 10)] ;
            if (num < 1000) return hundreds[Math.floor(num / 100)] + (num % 100 === 0 ? "" : " و " + numberToArabicWords(num % 100));
        
            return num.toString(); // for simplicity, return number as string for numbers >= 1000
        }
        
        function convertToWords(num) {
            let integerPart = Math.floor(num);
            let decimalPart = Math.round((num - integerPart) * 100);
        
            let integerPartInWords = numberToArabicWords(integerPart);
            let decimalPartInWords = decimalPart > 0 ? numberToArabicWords(decimalPart) + " بالمئة" : "";
        
            return integerPartInWords + (decimalPartInWords ? " و " + decimalPartInWords : "");
        }


        frm.fields_dict['ministry_exam_results'].grid.wrapper.on('change', 'input[data-fieldname="mark"]', function (e) {
            if (frm.doc.ministry_exam_results.length > 0) {
                var ttl = 0;
                frm.doc.ministry_exam_results.forEach(element => {
                    ttl += parseFloat(element.mark);
                });
                var avg = ttl / frm.doc.ministry_exam_results.length;
        
                frm.set_value('total', ttl);
                frm.set_value('average', avg);
        
                console.log(ttl);
                console.log(convertToWords(ttl));

                
                frm.set_value('total_in_words', convertToWords(ttl));
                frm.set_value('final_average', convertToWords(avg));
        
                frm.refresh_field('total');
                frm.refresh_field('average');

                frm.refresh_field('total_in_words');
                frm.refresh_field('final_average');
            }
        });


        if (frm.doc.admission_status == "Accepted") {
            disable_all_fields(frm);
        }


    },

    validate(frm) {
        if (frm.doc.application_channel != "Martyrs") {
                    if (frm.doc.prefered_departments.length > 4) {
                        frappe.throw(__('You can Only Select 4 departments'))
                    }
                }
        else if (frm.doc.prefered_departments.length > 6) {
                        frappe.throw(__('You can Only Select 6 departments'))
                    }


    },
});



function disable_all_fields(frm) {
    $.each(frm.fields_dict, function(fieldname, field) {
        frm.set_df_property(fieldname, 'read_only', 1);
    });
    frm.refresh_fields();
}