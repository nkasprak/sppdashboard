// JavaScript Document

var sfp_admin = function() {
	var getColumnDataAttr = function(col_id, attr) {
		var th = $("#dataTable th.title[data-id=\"" + col_id + "\"]");
		return th.attr("data-" + attr);
	};
	var newRowCounter = 0;
	var dataChanges = [];
	var dataChangesByAddress = {};
	var structureChanges = [];
	var structureAdds = [];
	var structureDels = [];
	var yearAdds = [];
	var yearDels = [];
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
	makeCheckable(yearAdds);
	makeCheckable(yearDels);
	var addToListOfChanges = function(state,col_id,year) {
		if (typeof(year)=="undefined") year=0;
		if (!dataChanges.has([state,col_id,year])) dataChanges.push([state,col_id,year]);
		dataChangesByAddress[state + "_" + col_id + "_" + year] = {
			actual:	$("#dataTable tr[data-state=\"" + state + "\"] td.actual[data-id=\"" + col_id + "\"] textArea").val(),
			override: $("#dataTable tr[data-state=\"" + state + "\"] td.override[data-id=\"" + col_id + "\"] textArea").val(),
		}
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
		getListOfChangesByAddress : function() {
			return dataChangesByAddress;
		},
		getListOfStructureChanges: function() {
			return structureChanges;
		},
		clearListOfChanges: function() {
			while(dataChanges.length > 0) {
				dataChanges.pop();	
			}
			for (adr in dataChangesByAddress) {
				delete dataChangesByAddress[adr];
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
			var override_value;
			var displayTd;
			var parentTr;
			var attrs = sfp_admin.getAttrs(col_id);
			for (var i = 0;i<actual_tds.length;i++) {
				actual_value = $(actual_tds[i]).val();
				display_value = sfpdashboard_shared_functions.formatData(attrs,actual_value);
				parentTr = $(actual_tds[i]).parents("#dataTable tr.state");
				override_value = $(parentTr).find("td #input_override_" + col_id).first().val();
				
				displayTd = $(parentTr).children("td.display[data-id=\""+col_id+"\"]");
				if (override_value == "") $(displayTd).html(display_value);
				else $(displayTd).html(override_value);
			}
		},
		writeData: function(state,col_id) {
			var attrs = sfp_admin.getAttrs(col_id);
			var actualSelector = "#dataTable tr[data-state='" + state + "'] textArea#input_actual_" + col_id;	
			var overrideSelector = "#dataTable tr[data-state='" + state + "'] textArea#input_override_" + col_id;	
			var actual_value = $(actualSelector).val();
			var year = 0;
			var th = $("#dataTable thead th.title[data-id=\"" + col_id + "\"]");
			if (typeof(th.attr("data-year")) !== "undefined") {
				year = th.attr("data-year");
			}
			if ($(overrideSelector).val() != "") {var toWrite = $(overrideSelector).val();}
			else {var toWrite = sfpdashboard_shared_functions.formatData(attrs,actual_value);}
			var displaySelector = "#dataTable tr[data-state='" + state + "'] td.display[data-id='" + col_id + "']";
			$(displaySelector).html(toWrite);
			addToListOfChanges(state,col_id,year);
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
			var map = {"pickData":"dataTab","pickStructure":"structureTab","pickTabs":"tabsTab"};
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
		addRowAtEndClickFunction: function() {
			var row = $("#structureTable").find("tr").last()[0];
			sfp_admin.addNewRow(row,true);
		},
		addNewRow: function(beforeRow,insertAfter) {
			if (typeof(insertAfter)==="undefined") insertAfter = false;
			var html = $(beforeRow).html();
			var newRow = $("<tr class=\"isNew\">" + html + "</tr>");
			newRow.find("ul.years").remove();
			$(newRow).find("input").val("");
			$(newRow).find("textArea").html("");
			var colID = "newRow" + newRowCounter; 
			var colIDInput = $(newRow).find("input[data-role='colID']").first();
			colIDInput.attr("data-orgcolid",colID).val(colID);
			colIDInput.on("change",function() {
				sfp_admin.parseNewColId($(this));
				sfp_admin.duplicateHandler($(this),colID);
			});
			if (insertAfter) {
				$(newRow).insertAfter(beforeRow);
			} else {
				$(newRow).insertBefore(beforeRow);
			}
			structureAdds.push("newRow" + newRowCounter);
			newRowCounter++;                 	
		},
		parseNewColId: function(theInput) {
			var uVal = theInput.val();
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
					var adrString = change[0] + "_" + change[1] + "_" + change[2];
					var toPush = {
						address: change,
						actual: makeNull(dataChangesByAddress[adrString].actual),
						override: makeNull(dataChangesByAddress[adrString].override)
					}
					if (change[2] != 0) toPush.year = change[2];
					postData.changes.push(toPush);
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
							if (typeof($(elem).attr("data-role")) !== "undefined") {
								toPush[$(elem).attr("data-role")] = value;
							}
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
				postData.yearAdds = yearAdds;
				postData.yearDels = yearDels;
		
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
				//if (mode=="structure") window.location.reload();
				//else sfp_admin.clearListOfChanges();
				window.location.reload();
			});
			
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
		},
		yearAdd: function(elem) {
			var year = $(elem).siblings("input").first().val();
			var yearsInList = [];
			var ul = $(elem).parents("td").first().children("ul");
			if (ul.length == 0) {
				$(elem).parents("td").first().prepend($("<ul class=\"years\">"));
			}
			var lis =$(elem).parents("td").first().children("ul").first().find("li span.year");
			$.each(lis,function() {
				yearsInList.push($(this).text()*1);
			});
			for (var i = 0;i<yearsInList.length;i++) {
				if (year == yearsInList[i]) {
					console.log("duplicate");
					return false;	
				}
			}
			year = Math.round(year);
			if (!isNaN(year)) {
				var colID = $(elem).parents("tr").first().find("input[data-role='colID']").attr("data-orgcolid");
				var toAdd = [colID,year];
				if (!yearAdds.has(toAdd)) {
					$(elem).parents("td").first().children("ul").first().append(
						"<li><span class=\"year\">" + year + "</span> <span class=\"yDelete\">[x]</span></li>"
					);
					if (yearDels.has(toAdd)) {
						yearDels.splice(yearDels.indexOf(toAdd),1);
					} else {
						yearAdds.push(toAdd);
					}
				}
			}
		},
		yearDel: function(elem) {
			var colID = $(elem).parents("tr").first().find("input[data-role='colID']").attr("data-orgcolid");
			var year = $(elem).siblings("span.year").first().html();
			var toAdd = [colID,year];
			if (yearAdds.has(toAdd)) {
				yearAdds.splice(yearAdds.indexOf(toAdd)-1,1);
			} else if (!yearDels.has(toAdd)) {
				yearDels.push(toAdd);
			}
			$(elem).parents("li").first().remove();
		},
		tabUp: function(elem) {
			var row = $(elem).parents("tr").first();
			var prevRow = $(row).prev("tr");
			if (prevRow.length > 0) {
				row.detach();
				prevRow.before(row);
			}
		},
		tabDown: function(elem) {
			var row = $(elem).parents("tr").first();
			var nextRow = $(row).next("tr");
			if (nextRow.length > 0) {
				row.detach();
				nextRow.after(row);
			}
		},
		saveTabs: function() {
			var i, rows = $("#tabsTable tbody tr"), postObj = [], name;
		
			for (i=0;i<rows.length;i++) {
				name = $(rows[i]).find("input[data-role=\"tab_title\"]").first().val().replace(/[^a-zA-Z0-9 ]/g, '').substring(0,31);
				postObj.push({
					tabID: $(rows[i]).children("td").first().text(),
					tabName: name,
					order: i
				});
			}
			$.post("saveData.php", {data:{mode:"tabs",data:postObj}}, function(e) {
				
			});
		}
	};
}();

$(document).ready(function() {
	
	sfp_admin.writeDataDisplay();
	sfp_admin.storeOriginalColIDs();
	
	$("#dataTable").on("change", "textArea", function() {
		var state = $(this).parent().parent().attr("data-state");
		var dataID = $(this).parent().attr("data-id");
		sfp_admin.writeData(state,dataID);
	});
	
	(function() {
	
		var autogrowF = function(e) {
			$(e).css("height","auto");
			$(e).autogrow({onInitialize:true,animate:false});
			$(e).css("overflow-y","scroll");
		}
		
		$("#dataTable textArea").click(function() {
			autogrowF(this);
		});
		
		$("#dataTable textArea").on("keypress", function() {
			var e = this;
			clearTimeout(sfp_admin.growTimer);
			sfp_admin.growTimer = setTimeout(function() {
				autogrowF(e)
			},500);
		});
	
	})();
	
	
	
	$("#dataTable textArea").blur(function() {
		var b = this;
		setTimeout(function() {
			$(b).css("height","15px");
			$(b).css("overflow-y","auto");
		},10);
	});
	
	$("#dataTable th select").change(function(e) {
		var year = $(this).val();
		$(this).parents("th").first().attr("data-year",year);
		var colkey = $(this).data("colkey");
		var url = "../getDataSubset.php?year=" + year + "&col=" + colkey;
		$.get(url,function(d) {
			var theData, colid, colData, baseSelector, overrideData, sortData, roundFactor, displayData, existingChanges, theChange;
			colid = d.colID;
			colData = sfp_admin.getAttrs(colid);
			existingChanges = sfp_admin.getListOfChangesByAddress();
			//make blank first
			$("#dataTable td.actual[data-id=\"" + colid + "\"] textArea").text("");
			$("#dataTable td.override[data-id=\"" + colid + "\"] textArea").text("");
			for (var i=0;i<d.data.length;i++) {
				theData = d.data[i];
				baseSelector = "#dataTable tr[data-state=\"" + theData.state + "\"] td.";
				if (theData.override_data == null && theData.sort_data == null) {
					$(baseSelector + "actual[data-id=\"" + colid + "\"] textArea").text("");
					$(baseSelector + "override[data-id=\"" + colid + "\"] textArea").text("");
				} else {
					overrideData = theData.override_data;
					sortData = theData.sort_data;
					
					theChange = theData.state + "_" + colid + "_" + year;
					if (existingChanges[theChange]) {
						overrideData = existingChanges[theChange].override;
						sortData = existingChanges[theChange].actual;
					}
					
					displayData = sortData;
					if (colData.roundto !== null) {
						roundFactor = Math.pow(10,colData.roundto);
						displayData = Math.round(displayData*roundFactor)/roundFactor;	
					}
					if (colData.prepend) displayData = colData.prepend + ("" + displayData);
					if (colData.append) displayData = colData.append + ("" + displayData);
					$(baseSelector + "actual[data-id=\"" + colid + "\"] textArea").text(sortData);
					//$(baseSelector + "display[data-id=\"" + colid + "\"]").text(displayData);
					if (overrideData) {
						//$(baseSelector + "display[data-id=\"" + colid + "\"]").text(overrideData);
						$(baseSelector + "override[data-id=\"" + colid + "\"] textArea").text(overrideData);
					}
				}
			}
		});
	});
	
	$("#saveData").click(function() {
		sfp_admin.saveData();
	});
	
	$("#getSpreadsheetLink").click(function() {
		var selectedColumns = $("#columnPicker select.columns").val();
		var requestObj = {};
		for (var i = 0;i<selectedColumns.length;i++) {
			requestObj[selectedColumns[i]] = 1;	
		}
		var url = "getSpreadsheet.php?" + $.param(requestObj);
		window.location.href = url;
	});
	
	$("#saveStructureData").click(function() {
		sfp_admin.saveStructure();
	});
	
	//Note that this isn't delegated - new rows are handled differently
	$("#structureTable :input").not(".yAddYear").on("change",function() {
		sfp_admin.structureChange($(this));
	});
	
	//The rest are all delegated so they work for newly created rows
	$("#structureTable").on("focus","input[data-role='colID']",function() {
		sfp_admin.structureFocus($(this));
	});
	
	$("#tabPicker").on("click",".tab", function() {
		sfp_admin.switchTab(this.id);
	});
	
	$("#columnPicker").on("change", "select.columns", function() {
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
	
	$("#structureTable").on("click","span.yAdd",function() {
		sfp_admin.yearAdd(this);
	});
	
	$("#structureTable").on("click","span.yDelete",function() {
		sfp_admin.yearDel(this);
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
	
	$("#addNewRowAtEnd").on("click", sfp_admin.addRowAtEndClickFunction);
	
	$("#tabsTable").on("click", "a.upLink", function() {
		 sfp_admin.tabUp(this);
	});
	$("#tabsTable").on("click", "a.downLink", function() {
		sfp_admin.tabDown(this);
	});
	$("#tabsTable a.saveTabs").on("click", sfp_admin.saveTabs);
	
});