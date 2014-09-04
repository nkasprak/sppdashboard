// JavaScript Document

var sfp_admin = function() {
	var getColumnDataAttr = function(col_id, attr) {
		var th = $("#dataTable th.title[data-id=\"" + col_id + "\"]");
		return th.attr("data-" + attr);
	};
	var newRowCounter = 0;
	var dataChanges = [];
	var structureChanges = [];
	var makeCheckable = function(arr) {
		Object.defineProperty(arr,"has",{enumerable:false,value:function(toCheck) {
			this.forEach(function (el) {
				if (el.toString()==toCheck.toString()) return true;
			});
			return false;
		}});
	};
	
	makeCheckable(dataChanges);
	makeCheckable(structureChanges);
	var addToListOfChanges = function(state,col_id) {
		if (!dataChanges.has([state,col_id])) dataChanges.push([state,col_id]);
	};
	var addToListOfStructureChanges = function(col_id,attr) {
		if (!structureChanges.has([col_id,attr])) structureChanges.push([col_id,attr]);
	};
	return {
		writeDataDisplay: function() {
			var headers = $("#dataTable th.title");
			var colname;
			for (var i = 0;i<headers.length;i++) {
				colname = $(headers[i]).attr("data-id");
				sfp_admin.writeDisplayOfColumn(colname);
			}	
		},
		getAttrs: function(col_id) {
			return {
				roundto: getColumnDataAttr(col_id,"roundto"),
				mode: getColumnDataAttr(col_id,"mode"),
				prepend: getColumnDataAttr(col_id,"prepend"),
				append: getColumnDataAttr(col_id,"append")
			}
		},
		getListOfChanges: function() {
			return dataChanges;
		},
		getListOfStructureChanges: function() {
			return structureChanges;
		},
		clearListOfChanges: function() {
			while(dataChanges.length > 0) {
				dataChanges.pop();	
			}
		},
		clearListOfStructureChanges: function() {
			while (structureChanges.length > 0) {
				structureChanges.pop();	
			}
		},
		writeDisplayOfColumn: function(col_id) {
			var actual_tds = $("#dataTable td #input_actual_" + col_id);
			var actual_value;
			var display_value;
			var displayTd;
			var parentTr;
			var attrs = sfp_admin.getAttrs(col_id);
			for (var i = 0;i<actual_tds.length;i++) {
				actual_value = $(actual_tds[i]).val();
				display_value = sfpdashboard_shared_functions.formatData(attrs,actual_value);
				parentTr = $(actual_tds[i]).parents("#dataTable tr.state");
				displayTd = $(parentTr).children("td.display[data-id=\""+col_id+"\"]");
				$(displayTd).html(display_value);
			}
		},
		writeData: function(state,col_id) {
			var attrs = sfp_admin.getAttrs(col_id);
			var actualSelector = "#dataTable tr[data-state='" + state + "'] input#input_actual_" + col_id;	
			var overrideSelector = "#dataTable tr[data-state='" + state + "'] input#input_override_" + col_id;	
			var actual_value = $(actualSelector).val();
			if ($(overrideSelector).val() != "") {var toWrite = $(overrideSelector).val();}
			else {var toWrite = sfpdashboard_shared_functions.formatData(attrs,actual_value);}
			var displaySelector = "#dataTable tr[data-state='" + state + "'] td.display[data-id='" + col_id + "']";
			$(displaySelector).html(toWrite);
			addToListOfChanges(state,col_id);
		},
		changeColumns: function(theColumns) {
			sfp_admin.hideAllColumns();
			sfp_admin.showColumns(theColumns);	
		},
		hideAllColumns: function() {
			$("#dataTable th[data-id], #dataTable td[data-id]").hide();
		},
		showColumns: function(colIds) {
			colIds.forEach(function(col_id) {
				var selector = "#dataTable th[data-id='"+col_id+"'], #dataTable td[data-id='"+col_id+"']";
				$(selector).show();
			});
		},
		switchTab: function(pickerID) {
			$(".tabBody").hide();
			var map = {"pickData":"dataTab","pickStructure":"structureTab"};
			$("#" + map[pickerID]).show();
		},
		moveRow: function(direction,theRow) {
			if (direction == "up") {
				var priorRow = $(theRow).prev("tr");
				if (priorRow.length > 0) {
					$(theRow).detach();
					$(theRow).insertBefore(priorRow);
				}
			} else if (direction == "down") {
				var nextRow = $(theRow).next("tr");
				if (nextRow.length > 0) {
					$(theRow).detach();
					$(theRow).insertAfter(nextRow);
				}
			}
		},
		addRowClickFunction: function() {
			var row = $(this).parents("tr")[0];
			sfp_admin.addNewRow(row);
		},
		addNewRow: function(beforeRow) {
			var html = $(beforeRow).html();
			var newRow = $("<tr>" + html + "</tr>");
			$(newRow).find("input").val("");
			$(newRow).find("textArea").val(""); 
			$(newRow).find("button.addDataColumn").click(sfp_admin.addRowClickFunction);
			$(newRow).find("div.upArrow").click(function() {
				var row = $(this).parents("tr")[0];
				sfp_admin.moveRow("up",row);
			});
			$(newRow).find("div.downArrow").click(function() {
				var row = $(this).parents("tr")[0];
				sfp_admin.moveRow("down",row);
			});
			$(newRow).find("input[data-role='colID']").first().attr("data-orgcolid","newRow" + newRowCounter);
			$(newRow).insertBefore(beforeRow);
			newRowCounter++;                 	
		},
		modeSelected: function(mode,row) {
			var roundInput = $(row).find("input[data-role='roundTo']").first();
			console.log(roundInput);
			if (mode != "numeric") {
				roundInput.attr("data-oldData",roundInput.val());
				roundInput.val("");
				roundInput.attr("disabled","disabled");
			} else {
				if (roundInput.is("[data-oldData]")) roundInput.val(roundInput.attr("data-oldData"));
				roundInput.removeAttr("disabled data-oldData");	
			}
		},
		storeOriginalColIDs: function() {
			var colIdInputs = $("#structureTable input[data-role='colID']");
			colIdInputs.each(function() {
				$(this).attr("data-orgColID",$(this).val());
			});
		},
		structureChange: function(inputObj) {
			var col_id, attr, row;
			row = inputObj.parents("tr").eq(0);
			col_id = row.find("input[data-role='colID']").first().val();
			attr = inputObj.attr("data-role");
		},
	}
}();

$(document).ready(function() {
	
	sfp_admin.writeDataDisplay();
	sfp_admin.storeOriginalColIDs();
	
	$("#dataTable input[type='text']").change(function() {
		var state = $(this).parent().parent().attr("data-state");
		var dataID = $(this).parent().attr("data-id");
		sfp_admin.writeData(state,dataID);
	});
	
	$("#structureTable :input").change(function() {
		sfp_admin.structureChange($(this));
	});
	
	$("#saveData").click(function() {
		var dataChanges = sfp_admin.getListOfChanges();
		var postData = [];
		var makeNull = function(str) {
			if (str=="") return null;
			else return str;
		};
		
		dataChanges.forEach(function(change) {
			postData.push({
				address: change,
				actual: makeNull($("tr[data-state='" + change[0] + "'] input#input_actual_" + change[1]).val()),
				override: makeNull($("tr[data-state='" + change[0] + "'] input#input_override_" + change[1]).val())
			});
		});
		
		$.post("saveData.php",{data:postData},function(returnData) {
			$("#responseFromServer").html(returnData);
			sfp_admin.clearListOfChanges();
		});
	});
	
	$("#tabPicker .tab").click(function() {
		sfp_admin.switchTab(this.id);
	});
	
	$("#columnPicker select").change(function() {
		var selectedColumns = $(this).val();
		sfp_admin.changeColumns(selectedColumns);
	});
	
	$("div.upArrow").click(function() {
		var row = $(this).parents("tr")[0];
		sfp_admin.moveRow("up",row);
	});
	
	$("div.downArrow").click(function() {
		var row = $(this).parents("tr")[0];
		sfp_admin.moveRow("down",row);
	});
	
	$("select.dataModeSelector").change(function() {
		var row = $(this).parents("tr")[0];
		sfp_admin.modeSelected($(this).val(),row);
	});
	
	$("button[data-role='addDataColumn']").click(sfp_admin.addRowClickFunction);
	
});