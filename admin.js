// JavaScript Document

var sfp_admin = function() {
	var getColumnDataAttr = function(col_id, attr) {
		var th = $("#dataTable th.title[data-id=\"" + col_id + "\"]");
		return th.attr("data-" + attr);
	};
	var newRowCounter = 0;
	var dataChanges = [];
	var structureChanges = [];
	var structureAdds = [];
	var structureDels = [];
	var makeCheckable = function(arr) {
		Object.defineProperty(arr,"has",{enumerable:false,value:function(toCheck) {
			var toReturn = false;
			var forEachFunction = function(el) {
				if (el.toString()==toCheck.toString()) {
					toReturn = true;
				}
			};
			this.forEach(forEachFunction);
			return toReturn;
		}});
	};
	var originalValues = {};
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
			var newRow = $("<tr class=\"isNew\">" + html + "</tr>");
			$(newRow).find("input").val("");
			$(newRow).find("textArea").val("");
			var colID = "newRow" + newRowCounter; 
			var colIDInput = $(newRow).find("input[data-role='colID']").first();
			colIDInput.attr("data-orgcolid",colID).val(colID);
			colIDInput.on("change",function() {
				sfp_admin.parseNewColId($(this));
				sfp_admin.duplicateHandler($(this),colID);
			});
			$(newRow).insertBefore(beforeRow);
			structureAdds.push("newRow" + newRowCounter);
			newRowCounter++;                 	
		},
		parseNewColId: function(theInput) {
			var uVal = theInput.val();
			console.log(uVal);
			uVal = uVal.replace(/^\s+|\s+$/g,''); //trim trailing spaces
			uVal = uVal.replace(/^[0-9]+/,''); //trim leading numerals
			uVal = uVal.replace(/^\s+|\s+$/g,''); //trim trailing spaces again
			uVal = uVal.replace(" ","_"); //replace spaces with underscores
			uVal = uVal.replace(/\W/g, '') //remove remaining non alphanumeric characters
			theInput.val(uVal);
		},
		deleteRow: function(theRow) {
			var col_id = $(theRow).find("input[data-role='colID']").attr("data-orgcolid");
			$(theRow).addClass("deleted");
			$(theRow).find(":input").prop("disabled",true);
			$(theRow).find("div.deleteButton").html("Undelete").attr("data-function","restore");
			structureDels.push(col_id);
		},
		undeleteRow: function(theRow) {
			var col_id = $(theRow).find("input[data-role='colID']").attr("data-orgcolid");
			$(theRow).removeClass("deleted");
			$(theRow).find(":input").removeProp("disabled");
			$(theRow).find("div.deleteButton").html("Delete").attr("data-function","delete");
			structureDels = $.grep(structureDels,function(value) {return value!=col_id});
			var theMode = $(theRow).find("select.dataModeSelector").val();
			
			sfp_admin.modeSelected(theMode,theRow);
		},
		modeSelected: function(mode,row) {
			var roundInput = $(row).find("input[data-role='roundTo']").first();
			if (mode != "numeric") {
				roundInput.attr("data-oldData",roundInput.val());
				roundInput.val("");
				roundInput.attr("disabled","disabled");
			} else {
				if (roundInput.is("[data-oldData]")) roundInput.val(roundInput.attr("data-oldData"));
				roundInput.removeAttr("disabled data-oldData");	
			}
		},
		duplicateHandler: function(obj,col_id) {
			var duplicate = sfp_admin.isDuplicateCheck(obj);
			if (duplicate) {
				alert("Error - ID must be unique");
				obj.val(originalValues[col_id]);
				return false;
			} 
			return true;
		},
		storeOriginalColIDs: function() {
			var colIdInputs = $("#structureTable input[data-role='colID']");
			colIdInputs.each(function() {
				$(this).attr("data-orgColID",$(this).val());
			});
		},
		structureFocus: function(inputObj) {
			var col_id, row;
			row = inputObj.parents("tr").first();
			col_id_input = row.find("input[data-role='colID']").first();
			col_id = row.find("input[data-role='colID']").first().attr("data-orgcolid");
			originalValues[col_id] = inputObj.val();
		},
		structureChange: function(inputObj) {
			var col_id, attr, row, col_id_input;
			
			row = inputObj.parents("tr").first();
			col_id_input = row.find("input[data-role='colID']").first();
			col_id = row.find("input[data-role='colID']").first().attr("data-orgcolid");
			attr = inputObj.attr("data-role");
			if (attr == "colID") {
				sfp_admin.parseNewColId(col_id_input);
				if (sfp_admin.duplicateHandler(inputObj,col_id) == false) return false;
			}
			addToListOfStructureChanges(col_id,attr);
			
		},
		getStructureOrder: function() {
			var trs = $("#structureTable tbody tr");
			var toReturn = [];
			trs.each(function(i,el) {
				if ($(el).hasClass("isNew")) {
					toReturn.push($(el).find("input[data-role='colID']").val());
				} else {
					toReturn.push($(el).find("input[data-role='colID']").attr("data-orgcolid"));
				}
			});
			return toReturn;
		},
		save : function(mode) {
			var postData;
			var makeNull = function(str) {
				if (str=="") return null;
				else return str;
			};
			postData = {};
			postData.changes = [];
			postData.mode = mode;
			if (mode == "data") {
				var changes = sfp_admin.getListOfChanges();
				$.each(changes,function(i,change) {
					postData.changes.push({
						address: change,
						actual: makeNull($("tr[data-state='" + change[0] + "'] input#input_actual_" + change[1]).val()),
						override: makeNull($("tr[data-state='" + change[0] + "'] input#input_override_" + change[1]).val())
					});
				});
			} else if (mode == "structure") {
				postData.additions = [];
				postData.deletions = [];
				postData.order = sfp_admin.getStructureOrder();
				$.each(structureAdds, function(i, el) {
					if ($.inArray(el,structureDels)==-1) {
						var toPush = {};
						var row = $("#structureTab table input[data-orgcolid='" + el + "']").parents("tr").first();
						row.find(":input").each(function(i,elem) {
							var value = $(elem).val();
							if ($(elem).attr("data-role")=="longName") value = value.replace(/\r\n|\r|\n/g,"<br />");
							toPush[$(elem).attr("data-role")] = value;
						});
						toPush.orgcolid = el;
						postData.additions.push(toPush);
					}
				});
				$.each(structureDels, function(i, el) {
					if ($.inArray(el,structureAdds)==-1) {
						postData.deletions.push(el);	
					}
				});
				var changes = sfp_admin.getListOfStructureChanges();
				$.each(changes,function(i,change) {
					var row = $("input[data-orgcolid='" + change[0] + "']").parents("tr").first();
					var value = row.find("[data-role='"+change[1] + "']").val();
					if (change[1] == "longName") {
						value = value.replace(/\r\n|\r|\n/g,"<br />");
					}
					postData.changes.push({
						address: change,
						change: makeNull(value),
					});
				});
			} else {return false;}
			
			$.post("saveData.php",{data:postData},function(returnData) {
				$("#responseFromServer" + (mode=="structure" ? "Structure" : "")).html(returnData);
				sfp_admin.clearListOfChanges();
			});
			//console.log(postData);
			
			
			
		},
		saveData: function() {
			sfp_admin.save("data");
		},
		saveStructure: function() {
			sfp_admin.save("structure");
		},
		deleteFunction: function(row,mode) {
			if (mode=="delete") {
				sfp_admin.deleteRow(row);
			} else if (mode == "restore") {
				sfp_admin.undeleteRow(row);	
			} else {
				console.log("button handler incorrect");	
			}
		},
		isDuplicateCheck: function(inputObj) {
			var id = $(inputObj).val();
			var row = $(inputObj).parents("tr").first();
			var isDuplicate = false;
			$("#structureTable input[data-role='colID']").not("tr.deleted input").each(function(i,el) {
				
				//don't check against self
				if (row.find("input[data-role='colID']").attr("data-orgcolid") != $(el).attr("data-orgcolid")) {
					if (id == $(el).val()) isDuplicate=true;
				}
			});
			return isDuplicate;
		}
	}
}();

$(document).ready(function() {
	
	sfp_admin.writeDataDisplay();
	sfp_admin.storeOriginalColIDs();
	
	$("#dataTable").on("change", "input[type='text']", function() {
		var state = $(this).parent().parent().attr("data-state");
		var dataID = $(this).parent().attr("data-id");
		sfp_admin.writeData(state,dataID);
	});
	
	$("#saveData").click(function() {
		sfp_admin.saveData();
	});
	
	$("#saveStructureData").click(function() {
		sfp_admin.saveStructure();
	});
	
	//Note that this isn't delegated - new rows are handled differently
	$("#structureTable :input").on("change",function() {
		sfp_admin.structureChange($(this));
	});
	
	//The rest are all delegated so they work for newly created rows
	$("#structureTable").on("focus","input[data-role='colID']",function() {
		sfp_admin.structureFocus($(this));
	});
	
	$("#tabPicker").on("click",".tab", function() {
		sfp_admin.switchTab(this.id);
	});
	
	$("#columnPicker").on("change", "select", function() {
		var selectedColumns = $(this).val();
		sfp_admin.changeColumns(selectedColumns);
	});
	
	$("#structureTable").on("click","div.upArrow", function() {
		var row = $(this).parents("tr")[0];
		sfp_admin.moveRow("up",row);
	});
	
	$("#structureTable").on("click","div.downArrow",function() {
		var row = $(this).parents("tr")[0];
		sfp_admin.moveRow("down",row);
	});
	
	$("#structureTable").on("click","div.deleteButton",function() {
		var row = $(this).parents("tr")[0];
		var mode = $(this).attr("data-function");
		sfp_admin.deleteFunction(row,mode);
	});
	
	$("#structureTable").on("change","select.dataModeSelector", function() {
		var row = $(this).parents("tr")[0];
		sfp_admin.modeSelected($(this).val(),row);
	});
	
	$("#structureTable").on("click","button[data-role='addDataColumn']",sfp_admin.addRowClickFunction);
	
});