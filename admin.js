// JavaScript Document

var sfp_admin = function() {
	var getColumnDataAttr = function(col_id, attr) {
		var th = $("#dataTable th.title[data-id=\"" + col_id + "\"]");
		return th.attr("data-" + attr);
	}
	return {
		writeDataDisplay: function() {
			var headers = $("#dataTable th.title");
			var colname;
			for (var i = 0;i<headers.length;i++) {
				colname = $(headers[i]).attr("data-id");
				sfp_admin.writeDisplayOfColumn(colname);
			}	
		},
		
		writeDisplayOfColumn: function(col_id) {
			var actual_tds = $("#dataTable td #input_actual_" + col_id);
			var actual_value;
			var display_value;
			var displayTd;
			var parentTr;
			var attrs = {
				roundto: getColumnDataAttr(col_id,"roundto"),
				mode: getColumnDataAttr(col_id,"mode"),
				prepend: getColumnDataAttr(col_id,"prepend"),
				append: getColumnDataAttr(col_id,"append")
			};
			for (var i = 0;i<actual_tds.length;i++) {
				actual_value = $(actual_tds[i]).val();
				display_value = sfpdashboard_shared_functions.formatData(attrs,actual_value);
				parentTr = $(actual_tds[i]).parents("#dataTable tr.state");
				displayTd = $(parentTr).children("td.display[data-id=\""+col_id+"\"]");
				$(displayTd).html(display_value);
			}
		}
		
	}
}();

$(document).ready(function() {
	
	sfp_admin.writeDataDisplay();
	
});