// SFP Dashboard
// by Nicholas A. Kasprak
// CBPP
var sfpDashboard;
$(window).load(function() { //using window load rather than document ready seems to make the table layout more reliable
try {
	/*On the main page there's this chunk of code: 
		var ie7 = true;
		<!--[if lt IE 8]>
		<script type="text/javascript">
			var ie7 = false;
		</script>
		<![endif]-->*/
	if (ie7) return false;
	//Because if you're using Internet Explorer 7, we don't serve your kind here.*/
	
	sfpDashboard = function() {
		
		//private variable - use public setActiveTab() function to change
		var activeTab = 1;
		
		var footersNeedCalculation = {}; //indexed by tab, i.e. {1: true, 2: false} would 
										 //indicate that tab 1 needs its footer recalculated, 
										 //tab 2 does not

		var numTabs = $("ul#tabs li.tab").length;
		
		for (var i=1;i<=numTabs;i++) {
			footersNeedCalculation[i] = true;	
		}
		
		//storage for tasks to run every second
		var periodicTasks = {};
		var periodicTimer = setInterval(function() {
			for (task in periodicTasks) {
				try {
					periodicTasks[task]();
				} catch (ex) {
					console.log("error executing task " + task);	
				}
			}
		},5000);
		
		//private functions follow
		
		/*The "Freeze panes" - like behavior is accomplished through having three separate tables that look like
		one table. The following two functions synchronize the height/widths of the cells of the main table with 
		the left state names table and the top column names table. They are called using the public function
		syncCellCize()*/
		privateSyncWidths = function() {
			var accWidth = 0; //"accumulated width" - div wrapper around the table will be set to this
			$("th, td").removeAttr("width"); //reset existing width attributes
			
			//main table, first row (only need to set widths on one row) - as collection of <td> jQuery objects
			var rowOfCells = $($("#tabBodies .tab" + activeTab + " .mainTableArea table tfoot tr")[0]).children("td");
			
			//top table (column headers) - first (and only) row - as collection of <td> jQuery objects
			var rowOfHeaders = $($("#tabBodies .tab" + activeTab + " .topTableArea table tbody tr")[0]).children("td");
			
			var maxWidth; //used to store greater of "header" or main table cell width
			
			/*Loop through cells that are common to both header row and main row (although they should be the same 
			number of cells - if they don't there's a problem)*/
			for (var i = 0;i<Math.min(rowOfCells.length,rowOfHeaders.length);i++) {
				
				//Measure max width for this column - either the header column is wider or the table column is wider
				maxWidth = Math.max($(rowOfCells[i]).width(),$(rowOfHeaders[i]).width())*1;
				
				//Explicitly set this measured width on both the main table cell and the header cell
				$(rowOfCells[i]).attr("width",maxWidth);
				$(rowOfHeaders[i]).attr("width",maxWidth);
				
				/*Add it to the accumulated width, plus a fudge factor to ensure the wrapper around the table is a bid 
				wider than the table itself*/
				accWidth += (maxWidth+14);
			}
			//Set the wrapper width to the accumulated width.
			$("#tabBodies .tab" + activeTab + " .mainTableArea .tableWrapper").width(accWidth);
			
			//The top table wrapper is wider, becuase it isn't scrolled directly (no scrollbar of its own) and 
			//this ensures the scrolling syncs properly.
			$("#tabBodies .tab" + activeTab + " .topTableArea .tableWrapper").width(accWidth+300);
		};
		
		privateSyncHeights = function() {
			/*This is all basically the same as the syncWidths function, but no need to track accumulated
			height because the scrolling behaves a bit differently.*/
			$("th, td").removeAttr("height");
			var allRows = $("#tabBodies .tab" + activeTab + " .mainTableArea table tr");
			var leftRows = $("#tabBodies .tab" + activeTab + " .leftTableArea table tr");
			var maxHeight;
			for (var i = 0;i<Math.min(allRows.length,leftRows.length);i++) {
				var maxHeight = Math.max($($(allRows[i]).children("td")[0]).height(),$($(leftRows[i]).children("td")[0]).height());
				$($(leftRows[i]).children("td")[0]).attr("height",maxHeight);
				$($(allRows[i]).children("td")[0]).attr("height",maxHeight);
			}
		};
		
		
		/*This is assigned to the "table of contents" <li>s click event in the activateQuestionList() function.
		Gets the column id from the <li> class and triggers the scroll function.*/
		qListClick = function() {
			var id = this.className;
			sfpDashboard.scrollToColumn(id);
		};
		
		/*Returns the column number of a particular column id. Used here and there.*/
		returnColIndex = function(col_id) {
			var tabOfCol = getColumnDataAttr(col_id,"tabAssoc");
			var tds = $($("#tabBodies .tab" + tabOfCol + " .mainTableArea table tbody tr")[0]).children("td");
			for (var i = 0;i<tds.length;i++) {
				if ($(tds[i]).hasClass(col_id)) return i;	
			}
			return -1;
		};
		
		/*In HTML5 you can store data in arbitrary attributes with the "data-" prefix. I find this
		very useful. This function extracts column metadata from the <td> elements of the first row of the top header table,
		where I've stored it.*/
		getColumnDataAttr = function(col_id,attr) {
			var currentTab;
			var value;
			for (var i = 0;i<$("#tabBodies .tabBody").length;i++) {
				currentTab = $($("#tabBodies .tabBody")[i]);
				value = $($($(currentTab).find(".topTableArea table tbody").children("tr")[0]).children("td." + col_id)).attr("data-" + attr);
				if (typeof(value) != "undefined") return value;
			}
		};
		
		/*Used in handling dates in some columns. Returns the number of days into the year of a particular date.*/
		daysIntoYear = function(month,days) {
			month = month*1;
			var months = [0,31,28,31,30,31,30,31,31,30,31,30,31];
			var rVal = 0;
			for (var i = 1;i<month;i++) {
				rVal += (months[i]*1);	
			}
			rVal += (days*1);
			return rVal;
		}
		
		/*Public functions*/
		return {
			
			//Gets the currently displayed tab
			getActiveTab: function() {
				return activeTab;	
			},
			
			//Adds a function to be executed in the period tasks private method that runs every second (useful for background stuff)
			addPeriodicTask: function(taskID, task) {
				periodicTasks[taskID] = task;
			},
			
			removePeriodicTask: function(taskID) {
				delete periodicTasks[taskID];
			},
			
			//Changes the currently displayed tab
			setActiveTab: function(tabID) {
				activeTab = tabID;
				$("#tabBodies .tabBody").hide();
				$("#tabBodies .tab" + tabID).show();
				$("#tabs .tab").removeClass("selected");
				$("#tabs #tabPicker" + tabID).addClass("selected");
			},
			
			//Gets a list of column IDs for a particular tab.
			getColumnIds: function(tabID) {
				var toReturn = [];
				
				//Or all the tabs at once. If that's what you want.
				if (tabID == "all") {
					
					//Loop through each tab
					for (var i = 1;i<=$("#tabBodies .tabBody").length;i++) {
						
						//Get the tob row as a set of cells
						var tds = $($("#tabBodies .tab" + i + " .mainTableArea table tbody tr")[0]).children("td");
						
						//Loop through the cells and extract the column id from the class.
						for (var j = 0;j<tds.length;j++) {
							toReturn.push($(tds[j]).attr("class"));
						}
					}
				} else {
					
					//Same thing as above except only for one tab.
					var tds = $($("#tabBodies .tab" + tabID + " .mainTableArea table tbody tr")[0]).children("td");
					for (var i = 0;i<tds.length;i++) {
						toReturn.push($(tds[i]).attr("class"));	
					}
				}
				return toReturn;
			},
			
			/*Get the "short name" of the column from the table of contents.
			(It probably would be more consistent to store this as an HTML5 data- attribute
			and get it from there but it's already in the table of contents and we may as well 
			be economical.)*/
			getColumnShortName : function(colID) {
				var toc = $(".questionList ul li." + colID);
				return toc.html();
			},
			
			/*Loop through all the <li>s in the question lists and assign make them the qListClick
			function defined above.*/
			activateQuestionList: function() {
				var lists = $("div.questionList ul");
				var list;
				for (var i = 0; i<lists.length;i++) {
					list = $(lists[i]).children("li");
					for (var j = 0;j<list.length;j++) {
						$(list[j]).click(qListClick);	
					}
				}
			},
			
			/*Adjust various heights, widths, and so forth - needed whenever the main window is resized,
			a filter definition is added (since it pushes the main table down) and also in some other
			situations*/
			recalcLayout: function() {
				var tab = sfpDashboard.getActiveTab();
				var dataArea = $($("#tabBodies .tab" + tab + " .dataDisplayArea")[0]);
				var preHeight = dataArea.offset().top;
				var totalHeight = $(window).height() + $(window).scrollTop();
				var remainingHeight = totalHeight - preHeight;
				dataArea.height(remainingHeight);
				$(".tab" + tab + " .dataDisplayArea  .tableArea .topTableArea, .tab" + tab + " .dataDisplayArea .tableArea .topLeft").height(
					$(".tab" + tab + " .dataDisplayArea .tableArea .topTableArea table").height()
				);
				$(".tab" + tab + " .dataDisplayArea .tableArea .topLeft").width(
					$(".tab" + tab + " div.dataDisplayArea .tableArea div.leftTableArea").width()
				);
				$(".tab" + tab + " .dataDisplayArea .tableArea div.mainTableArea, .tab" + tab + " .dataDisplayArea .tableArea .leftTableArea").css(
					"margin-top",$("#tabBodies .tab" + tab + " .dataDisplayArea .tableArea .topTableArea table").height()
				);
			},
			
			/*Synchronize scrolling. Since we're dealing with three separate tables that look like one, this function runs
			whenever the main table is scrolled and ensures the other two tables scroll along with it.*/
			syncTableScroll : function() {
				var tab = sfpDashboard.getActiveTab();
				var mainTableArea = $("#tabBodies .tab" + tab + " .mainTableArea");
				var topTableArea = $("#tabBodies .tab" + tab + " .topTableArea");
				var leftTableArea = $("#tabBodies .tab" + tab + " .leftTableArea");
				var scrollLeft = mainTableArea.scrollLeft();
				var scrollTop = mainTableArea.scrollTop();
				topTableArea.scrollLeft(scrollLeft);
				leftTableArea.scrollTop(scrollTop);
			},
			
			/*Scroll the table to a particular column. Mainly used when clicking the table of contents/question list.*/
			scrollToColumn : function(colID) {
				var tab = sfpDashboard.getActiveTab();
				var cell = $(".tab" + tab + " div.topTableArea table td." + colID);
				var position = cell.position().left;
				var currentScroll = $(".tab" + tab + " div.topTableArea").scrollLeft();
				
				//ensures we don't go beyond the end of the table
				var target = Math.min(position+currentScroll,$(".tab" + tab + " div.topTableArea table").width() - $(".tab" + tab + " div.topTableArea").width()); 
				
				$(".tab" + tab + " div.topTableArea, .tab" + tab + " div.mainTableArea").animate({"scrollLeft":target},400);
			},
			
			/*Public method for private height/width synchronization functions described earlier*/
			syncCellSize: function() {
				privateSyncWidths();
				privateSyncHeights();
			},
			
			/*Makes the table all pretty by assigning the "alt" (light blue) class to every other row
			Needs to run at the start but also after a sort or a filter application*/
			assignAltClasses: function() {
				var tab = sfpDashboard.getActiveTab();
				
				/*The data-include attribute filters out any hidden cells. (Previously, I used :visible for this but
				I want to be able to do this in the background for hidden tabs)*/
				var leftTableRows = $("#tabBodies .tab" + tab + ' .leftTableArea table tbody tr[data-include="true"]');
				var mainTableRows = $("#tabBodies .tab" + tab + ' .mainTableArea table tbody tr[data-include="true"]');
				for (var i = 0;i<Math.max(leftTableRows.length,mainTableRows.length);i++) {
					if (leftTableRows[i]) $(leftTableRows[i]).removeClass("alt");
					if (mainTableRows[i]) $(mainTableRows[i]).removeClass("alt");
					if (i%2==0) {
						if (leftTableRows[i]) $(leftTableRows[i]).addClass("alt");
						if (mainTableRows[i]) $(mainTableRows[i]).addClass("alt");
					}
				}
			},
			
			/*This function runs every time a column picker in the "filter" area is changed, and
			ensures that the next select box, where the user picks the comparison to use (equal to, contains,
			more than, less than, etc.) has the correct options based on the data type (text, numeric, date, etc.)
			"filterIndex" is just the position of the <li> that contains the filter.*/
			filterColumnChange: function(filterIndex) {
				var activeTab = sfpDashboard.getActiveTab();
				
				//Figure out which column we're dealing with to start
				var colID = $("div#tabBodies div.tab" + activeTab + " ul.filters li.filter"+filterIndex+ " select.filterBy").val();
				
				//Switch everything to the default configuration - no date picker, standard text box input
				$("div#tabBodies div.tab" + activeTab + " ul.filters li.filter"+filterIndex+  " span.datePicker").hide();
				$("div#tabBodies div.tab" + activeTab + " ul.filters li.filter"+filterIndex+  " input.val").show();
				
				//Use metadata extraction function figure out what type of column this is (numeric, text, date?)...
				var mode = getColumnDataAttr(colID,"mode");
				
				///...and fill the next selector with different options depending on what was found
				switch (mode) {
					case "text":
					$("div#tabBodies div.tab" + activeTab + " ul.filters li.filter"+filterIndex+ " select.compare").html(
						'<option value="contains" selected>Contains</option>\
						<option value="equal">Is</option>'
					);
					break;
					case "numeric":
					$("div#tabBodies div.tab" + activeTab + " ul.filters li.filter"+filterIndex+ " select.compare").html(
						'<option value="equal" selected>Is Equal To</option>\
						 <option value="less">Is Less Than</option>\
						 <option value="more">Is Greater Than</option>'
					);
					break;
					case "date":
					$("div#tabBodies div.tab" + activeTab + " ul.filters li.filter"+filterIndex+ " select.compare").html(
						'<option value="equal" selected>Is Equal To</option>\
						 <option value="less">Is Before</option>\
						 <option value="more">Is After</option>'
					);
					//In this case, override the defaults set earlier.
					$("div#tabBodies div.tab" + activeTab + " ul.filters li.filter"+filterIndex+  " span.datePicker").show();
					$("div#tabBodies div.tab" + activeTab + " ul.filters li.filter"+filterIndex+  " input.val").hide();
					break;	
				}
			},
			
			/*Add a new filter!*/
			addFilter: function(tab_id) {
				/*Show the apply button and the remove button, neither of which should be visible if there are no filters. But if we're running
				this function here, there's going to be at least one, so turn 'em on.*/
				$("#tabBodies .tab" + tab_id + " ul.filters li.filterAdd span.extras").show();
				$("#tabBodies .tab" + tab_id + " div.filterArea button.apply").show();	
				
				/*Get all the filter <li>s*/
				var filters = $("#tabBodies .tab" + tab_id + " ul.filters li");
				
				/*Second to last <li> is the last actual filter*/
				var lastFilter = filters[filters.length-2]; 
				
				/*Final <li> isn't actually a filter - it's the "add filter" link*/
				var addLink = filters[filters.length - 1];
				
				/*Get all the column IDs*/
				var cols = sfpDashboard.getColumnIds("all");
				
				/*Check to make sure there are active filters to begin with - a length
				of 1 (add link only) means there aren't any. Purpose of this next block
				is to figure out the first column not being used as a filter and make that
				the default selection for the new one that's being added.*/
				if (filters.length > 1) {
					var usedFilters = [];
					
					/*Loop through current filters*/
					for (var i = 0;i<=filters.length-2;i++) {
						
						/*and store the filters that are already being used*/
						usedFilters.push($(filters[i]).children("select.filterBy").val());
					}
					
					var defaultValue;
					
					/*Loop through all the column IDs*/
					for (var i = 0;i<cols.length;i++) {
						
						/*...until we find the first column id that isn't already being used as a filter*/
						if (($.inArray(cols[i],usedFilters))==-1) {
							
							/*...and save that column id for later*/
							defaultValue = cols[i];
							break;
						}
					}
					
					/*also, figure out the numerical index of the final existing filter. This will just be 1,2,3, etc.)*/
					var lastFilterId = $(lastFilter).attr("class").replace("filter","")*1;
				} else {
					
					/*or even 0, if we don't have any yet.*/
					var lastFilterId = 0;
				}
				
				/*Start building an HTML string for the new filter <select> options.*/
				var optionsString = "";
				
				/*Loop through all the column ids...*/
				for (var i = 0;i<cols.length;i++) {
					
					/*and create options for each.*/
					optionsString += '<option value="' + cols[i] + '">' + sfpDashboard.getColumnShortName(cols[i]) + "</option>";
					if (i>0) {
						/*Add a "---" disabled break to separate tab groups*/
						if (getColumnDataAttr(cols[i],"tabAssoc") != getColumnDataAttr(cols[i-1],"tabAssoc")) optionsString += "<option value='0' disabled>---</option>";
					}
				}
				
				/*HTML of the whole damn <li>*/
				var htmlString = '<select class="filterBy">' + optionsString + '</select>&nbsp;\
                            		<select class="compare"></select>&nbsp;\
                            		<input size ="5" type="text" class="val" />&nbsp;\
									<span class="datePicker">\
										<select class="month">\
											<option value="1">January</option>\
											<option value="2">February</option>\
											<option value="3">March</option>\
											<option value="4">April</option>\
											<option value="5">May</option>\
											<option value="6">June</option>\
											<option value="7">July</option>\
											<option value="8">August</option>\
											<option value="9">September</option>\
											<option value="10">October</option>\
											<option value="11">November</option>\
											<option value="12">December</option>\
										</select>\
										<input size="3" type="text" class="day" />&nbsp;\
									</span>';
				var newFilter = document.createElement("li");
				
				//Filter index of the new filter is one above the current max index
				$(newFilter).addClass("filter" + (lastFilterId+1));
				$(newFilter).html(htmlString);
				
				//Add the new filter to the DOM before the final <li> for adding/removing filters.
				$(addLink).before(newFilter);
				
				/*If a good defaultValue was found up above, use it*/
				if (defaultValue) {
					$($(newFilter).children("select.filterBy")).val(defaultValue);
				}
				
				/*Assing the filterColumnChange function to the new filter*/
				$($(newFilter).children("select.filterBy")).change(function() {
					var filter = $(this).parent("li").attr("class").replace("filter","");
					sfpDashboard.filterColumnChange(filter);
				});
				
				/*Run filterColumnChange once so that next selector lines up with the default choice*/
				sfpDashboard.filterColumnChange(lastFilterId+1);
				
				/*and recalculate the layout (since the filter area has gotten taller)*/
				//sfpDashboard.recalcLayout();
				//sfpDashboard.syncCellSize();
			}, /*end addFilter()*/
			
			/*Fortunately, this is a bit simpler*/
			removeFilter: function(tab_id) {
				var filters = $("#tabBodies .tab" + tab_id + " ul.filters li");
				
				//If we're getting rid of the last filter, hide the remove/apply buttons*/
				if (filters.length == 2) {
					$("#tabBodies .tab" + tab_id + " ul.filters li span.extras").hide();
					$("#tabBodies .tab" + tab_id + " div.filterArea button.apply").hide();	
				}
				
				/*Check to make sure there's a filter to remove (in theory, there should be
				no way to trigger this unless there is, but may as well check)*/
				if (filters.length > 1)  {
					
					/*get rid of it*/
					var lastFilter = filters[filters.length-2];
					$(lastFilter).remove();
				}
				/*sfpDashboard.syncCellSize();
				sfpDashboard.recalcLayout();*/
			},
			
			/*Apply the currently displayed filters. This is a bit complicated, so here goes...*/
			applyFilters: function(tab_id) {
				footersNeedCalculation[tab_id] = true;
				sfpDashboard.filtersApplied[tab_id] = $("#tabBodies .tab" + tab_id + " ul.filters li").length;
				
				/*Loop through relevant DOM elements and extract the necessary data*/
				var filterArray = function() {
					var comparisons = [];
					var lis = $("#tabBodies .tab" + tab_id + " ul.filters li");
					for (var i = 0; i<lis.length-1; i++) {
						li = lis[i];
						privFilterBy = $(li).children("select.filterBy").val();
						privCompare = $(li).children("select.compare").val();
						privValue = $(li).children("input.val").val();
						privMonth = $(li).find("select.month").val();
						privDay = $(li).find("input.day").val();
						privUseDate = (getColumnDataAttr(privFilterBy,"mode") == "date") ? true : false;
						comparisons.push({
							filterBy: privFilterBy,
							compare: privCompare,
							value: privValue,
							month: privMonth,
							day: privDay,
							useDate: privUseDate
						});
					}
					return comparisons;
				}();
				
				/*Generalized comparison function to check if a filter applies to a particular row.
				cVal is the value of the cell, fVal is the value of the filter.*/
				var comparor = function(cVal,filterObj) {
					if (filterObj.useDate) {
						fVal = daysIntoYear(filterObj.month,filterObj.day);
					} else {
						fVal = filterObj.value;
					}
					switch (filterObj.compare) {
						case "equal":
						return (cVal == fVal);
						break;
						case "less":
						return (cVal*1 < fVal*1);
						break;
						case "more":
						return (cVal*1 > fVal*1); 
						break;
						case "contains":
						return (cVal.indexOf(fVal) > -1 ? true : false);
						break;	 
					};
				}
				
				/*Get all the rows of the main table(s)*/
				var mainTableTrs = $("#tabBodies .tabBody .mainTableArea table tbody tr");
				
				/*Loop through the table rows*/
				var state;
				var tr;
				var showRow;
				var cValue;
				for (var i = 0;i<mainTableTrs.length;i++) {
					tr = mainTableTrs[i];
					
					/*Get state from row class*/
					state = $(tr).attr("class").replace(" alt","");
					
					/*Default is to show the row, unless the filters tell us otherwise, so start with that*/
					showRow = true;
					
					/*Loop through each active filter*/
					for (var j = 0;j<filterArray.length;j++) {
						colId = filterArray[j].filterBy;
						
						/*Find the cell in this row corresponding to the filter being examined*/
						/*If the cell has special "sortData" (hidden numeric data in place of text) use that*/
						if ($(tr).find("td." + colId + " span.sortData").length > 0) {
							cValue = $(tr).find("td." + colId + " span.sortData").html();
							
						/*Otherwise just use the text of the cell*/
						} else if ($(tr).find("td." + colId).length > 0) {
							cValue = $(tr).children("td." + colId).html();
						} else {
							cValue = "notInThisTab";	
						}
						
						/*If the comparor function defined above tells us to hide it, hide it*/
						if (cValue != "notInThisTab") {
							if (comparor(cValue,filterArray[j]) == false) {
								showRow = false;
							}
						}
	
						/*Or if the cell is blank, hide it in that situation as well*/
						if (cValue == "") showRow = false;
					}
					
					/*Actually show/hide the row*/
					if (cValue != "notInThisTab") {
						if (showRow == false) {
							$("#tabBodies .tab" + tab_id + " table tr." + state).hide();
							$("#tabBodies .tab" + tab_id + " table tr." + state).attr("data-include", "false");
						} else {
							$("#tabBodies .tab" + tab_id + " table tr." + state).show();
							$("#tabBodies .tab" + tab_id + " table tr." + state).attr("data-include", "true");	
						}
					}
				} /*end loop through mainTableTrs*/
				
				/*Re-do all this stuff*/
				sfpDashboard.fillFooter();
				sfpDashboard.syncCellSize();
				sfpDashboard.recalcLayout();
				sfpDashboard.syncCellSize(); //this seems to need to be done both before and after.
				sfpDashboard.assignAltClasses();
				
			}, /*end applyFilters*/
			
			/*Sort the table using the tablesorter library*/
			/*See http://mottie.github.io/tablesorter/docs/ for more info*/
			/*This is a bit different than the standard tablesorter usage because of the three tables setup*/
			sortColumn: function(col_id) {
				var tab = sfpDashboard.getActiveTab();
				var sortOrder = 0;
				if (col_id == sfpDashboard.sortedColumns.col) {
					sortOrder = 1 - sfpDashboard.sortedColumns.sorted;
				}
				
				sfpDashboard.sortedColumns = {col:col_id,sorted:sortOrder};
				
				//need the index, not the id, because that's what tablesorter needs
				var colIndex;
				if (col_id=="default") {
					colIndex = 0;
					sfpDashboard.revertSort = true;	
					col_id = $("#tabBodies .tab" + sfpDashboard.getActiveTab() + " .topTableArea table tr:first td:first").attr("class");
				} else {
					colIndex = returnColIndex(col_id)
					sfpDashboard.revertSort = false;	
				}
				
				//a tablesorter sortArray - sort by the index, and then by nothing. (we're not doing a multi-level sort)
				var sorting = [[colIndex,sortOrder]];
				
				//this is for the left table (state names) - sorting by the first (and only) column (using hidden sort data). 
				var sortin2 = [[0		,0]];
				
				//sort the mainTable first
				$("#tabBodies .tab" + sfpDashboard.getActiveTab() + " .mainTableArea table").trigger("update");
				$("#tabBodies .tab" + sfpDashboard.getActiveTab() + " .mainTableArea table").trigger("sorton",[sorting]);
				
				sfpDashboard.revertSort = false;
				
				//sort left table in the same order by adding hidden data based on the order in the main table.
				//Get a collection of all the table cells in the main table in the column being sorted
				var mainTDs = $("#tabBodies .tab" + tab + " .mainTableArea table tbody td." + col_id);
				var state;
				
				//Loop through the cells in the column. They'll be in order of the sort, and the loop index corresponds to
				//the sort position.
				for (var i = 0;i<mainTDs.length;i++) {
					//Get the state from the class...
					state = $(mainTDs[i]).parent().attr("class").replace(" alt","");
					//Get the corresponding state cell from the left table, and remove any existing sortData...
					$("#tabBodies .tab" + tab + " .leftTableArea table tr." + state + " td span.sortData").remove();
					
					//and then add a new sortData element from the current loop index.
					var span = document.createElement("span");
					$(span).addClass("sortData");
					$(span).html(i);
					$("#tabBodies .tab" + tab + " .leftTableArea table tr." + state + " td").append($(span));
				}
				
				//Need to tell the tablesorter that the table's been updated with new sort data...
				$("#tabBodies .tab" + sfpDashboard.getActiveTab() + " .leftTableArea table").trigger("update");
				
				//and finally sort the left table.
				$("#tabBodies .tab" + sfpDashboard.getActiveTab() + " .leftTableArea table").trigger("sorton",[sortin2]);
				
				//and then do this stuff again.
				sfpDashboard.syncCellSize();
				sfpDashboard.assignAltClasses();
			},
			
			//Calculates median, mean, max, or min
			calcQuantity: function(col_id,mode) {
				
				//Shut it down if it's a text column.
				if (getColumnDataAttr(col_id,"mode") == "text") {
					return "&nbsp;";	
				} else {
					
					//var tab = sfpDashboard.getActiveTab();
					var tab = getColumnDataAttr(col_id,"tabAssoc");
					
					//Otherwise, get all the visible cells of the relevant column
					var tds = $("#tabBodies .tab" + tab + " .mainTableArea table tbody tr" + '[data-include="true"]' + " td." + col_id);
					
					//Loop through the cells and store the values in vArray;
					var vArray = [];
					var val;
					for (var i = 0;i<tds.length;i++) {
						if ($(tds[i]).children("span.sortData").length > 0) {
							val = $(tds[i]).children("span.sortData").html()*1;
						} else {
							val = $(tds[i]).html()*1;
						}
						if (val != "" && !isNaN(val)) vArray.push(val);
					}
					
					//sort the value array (so we can easily find the median)
					vArray.sort();
					
					//If there's no data to do anything with, shut it down
					if (vArray.length == 0) return "&nbsp;";
					
					//Next, do different things depending on the data we want
					switch (mode) {
						case "average":
						var total = 0;
						for (var i = 0;i<vArray.length;i++) {
							total += vArray[i];
						}
						return total/vArray.length;
						break;
						case "median":
						
						//for the median, need to handle it slightly differently depending if
						//there's an odd or even number of values, but fairly straightforward -
						//just get the middle element (or the average of two middle elements)
						if (vArray.length%2==0) {
							return (vArray[vArray.length/2-1] + vArray[vArray.length/2])/2;
						} else {
							return vArray[(vArray.length-1)/2];
						}	
						break;
						case "high":
							return Math.max.apply(Math,vArray);
						break;
						case "low":
							return Math.min.apply(Math,vArray);
						break;
						default:
						return "&nbsp;";
					}
				}
			},
			
			//Calculate max, min, average, median for all columns
			fillFooter: function(tabToFill) {
				
				//added this option to enable doing these calculations on hidden tabs in the background to speed up tab switching
				if (!tabToFill) tabToFill = sfpDashboard.getActiveTab();
				
				//get <tr>'s in the <tfoot> of the main table
				var footerTrs = $("#tabBodies .tab" + tabToFill + " .mainTableArea table tfoot tr");
				
				//Loop through each <tr>...
				var tr;
				var mode;
				var tds;
				var col_id;
				var quantity;
				var roundMultiplier;
				for (var i = 0;i<footerTrs.length;i++) {
					tr = $(footerTrs[i]);
					
					//get the mode (the thing we're calculating - average, median, max, or min) - from the <tr>'s class name
					mode = tr.attr("class").replace("row_","");
					
					//get a collection of the cells in the current <tr>
					tds = tr.children("td");
					
					//Loop through those...
					for (var j = 0;j<tds.length;j++) {
						
						//get column id
						col_id = $(tds[j]).attr("class");
						
						//actually calculate the thing (see above function);
						quantity = sfpDashboard.calcQuantity(col_id,mode);
						
						//prettify the result
						var attrs = {
							roundto: getColumnDataAttr(col_id,"roundto"),
							mode: getColumnDataAttr(col_id,"mode"),
							prepend: getColumnDataAttr(col_id,"prepend"),
							append: getColumnDataAttr(col_id,"append")
						}
						
						quantity = sfpdashboard_shared_functions.formatData(attrs,quantity);
						
						//write it to the table
						$(tds[j]).html(quantity);
					}
				}
				
				footersNeedCalculation[tabToFill] = false;
			},
			
			fillAllFooters: function() {
				for (var tabToFill in footersNeedCalculation) {
					if (footersNeedCalculation[tabToFill] == true) {
						sfpDashboard.fillFooter(tabToFill);	
					}
				}
			},
			
			//Slides the table of contents out of the way
			hideQuestionList: function() {
				$("div.questionList ul").css("width",$("div.questionList ul").width());
				$("div.questionList").animate({"width":"0px"},400,null,function() {
					$("div.questionList").hide();	
				});	
				$("div.tableArea").animate({"marginLeft":"0px"},400);
				$("div.tableArea div.openArrow").fadeIn(400);
			},
			
			//Brings it back
			showQuestionList: function() {
				$("div.questionList").show();
				$("div.tableArea div.openArrow").fadeOut(400);
				$("div.tableArea").animate({"marginLeft":"225px"},400);
				$("div.questionList").animate({"width":"225px"},400,null,function() {
					$("div.questionList ul").css("width","100%");	
				});
				
			},
			
			//get tabs that need footer recalcs
			getFootersNeedCalc: function() {
				return footersNeedCalculation;	
			},
			
			makeBarChart: function(parms,mode) {
				var dataset = parms.dataset;
				$("body").append($("<div id='backgroundOverlay' style='background-color:#000;opacity:0.2;height:100%;width:100%;position:absolute;top:0px;left:0px'></div>"));
				$("body").append($("<div id='chartGraphicContainer' style='background-color:transparent;height:100%;width:100%;position:absolute;top:0px;left:0px'></div>"));
				$("#chartGraphicContainer").append($("<div class='barChartGraphic'>"));
				$("#chartGraphicContainer .barChartGraphic").append("<div class='barChartGraphicTitle'><h3>" + $(".topTableArea table td." + dataset + " span.longName").text() + "</h3></div>");
				$("#chartGraphicContainer .barChartGraphic").append("<div class='barChartGraphicFlotCanvas'>");
				var barChartData = {};
				var columnData = $(".topTableArea table td." + dataset).data();
				if (mode == "allStatesOneYear") {
					$.each($(".mainTableArea table tr td." + dataset + " span.sortData"),function() {
						if ($(this).parents("td").first().is(":visible")) {
							var stateCode = $(this).parents("tr").first()[0].className.split(/\s+/)[0];
							if ($(this).text() != "") barChartData[stateCode] = $(this).text();
						}
					});
					var flotifyData = function(data) {
						var i=0, returnData = [], returnTicks = [];
						for (state in barChartData) {
							returnData[i] = [barChartData[state]*1,50-i-0.25];
							returnTicks[i] = [50-i,state];
							i++;
						}
						return {data: returnData, ticks:returnTicks};
					};
					var d=flotifyData(barChartData);
					var chartOptions = {
						yaxis: {
							ticks: d.ticks,
							tickLength:0
						},
						xaxis: {
							tickFormatter: function(t) {
								t = Math.round(t*Math.pow(10,columnData.roundto))/Math.pow(10,columnData.roundto);
								if (columnData.prepend) t = columnData.prepend + t;
								if (columnData.append) t = t + columnData.append;
								return t;
							},
						},
						series: {
							bars: {
								show: true,
								horizontal: true,
								barWidth:0.5,
								fill:1,
								stroke:0	
							}
						},
						grid: {
							borderWidth:0
						},
						colors: ["#0081a4" ]
					}
					sfpDashboard.activeChart = $.plot($("#chartGraphicContainer .barChartGraphicFlotCanvas"),[{data:d.data}],chartOptions);
				} else {
					var url = "getDataSubset.php?col=" + parms.colkey + "&state=" + parms.state;
					var stateName = $(".leftTableArea tr." + parms.state + " td span.state").first().text();
					$("#chartGraphicContainer .barChartGraphic .barChartGraphicTitle h3").prepend(stateName + ": ");
					$.get(url,function(data) {
						var flotifyData = function(d) {
							var i = 0,returnData = [],returnTicks=[];
							for (i=0;i<d.data.length;i++) {
								returnData[i] = [d.data[i].year,d.data[i].sort_data];	
							}
							return returnData;
						}
						var d = flotifyData(data);
						var chartOptions = {
							yaxis: {
								tickFormatter: function(t) {
									t = Math.round(t*Math.pow(10,columnData.roundto))/Math.pow(10,columnData.roundto);
									if (columnData.prepend) t = columnData.prepend + t;
									if (columnData.append) t = t + columnData.append;
									return t;
								},
								min:0
							},
							xaxis: {
								minTickSize:1,
								tickFormatter: function(y) {
									return Math.round(y) + "";	
								}
							},
							series: {
								shadowSize:0
							},
							grid: {
								borderWidth:0
							},
							colors: ["#0081a4" ]
								
						}
						sfpDashboard.activeChart = $.plot($("#chartGraphicContainer .barChartGraphicFlotCanvas"),[{data:d}],chartOptions);
					});
				}
				
			},
			
			clearBarChart: function() {
				$("#chartGraphicContainer .barChartGraphic").remove();
				$("#chartGraphicContainer").remove();
				$("#backgroundOverlay").remove();
				sfpDashboard.activeChart = null;
			},
		}
	}();
	
	//Some preliminary initial setup type things after defining all that above...
	sfpDashboard.setActiveTab(1);
	sfpDashboard.recalcLayout();
	
	//We're gonna do some fancy scrolling stuff, and we need to keep track whether we're scrolling the window using
	//this attribute, because IE handles the scroll event differently than Firefox or Chrome
	//and it's necessary to use setTimeout()
	sfpDashboard.isScrolling = false;
	
	$(window).scroll(function() {
		
		/*All this stuff is to make it possible to scroll the entire window down past the sort/filter area and see only the table, 
		while keeping the bottom of the table scroll area at the bottom of the window.*/
		
		//Delay everything slightly becuase IE fires this DURING the scroll, not after, which was causing an infinte loop
		setTimeout(function() {
			
			//Only do stuff if we're not scrolling
			if (sfpDashboard.isScrolling == false) {
				
				//Get the current scroll position of the whole window
				var scrollTop = $(window).scrollTop();
				
				//We don't want to scroll the main window past the top of the actual table itself
				var maxScroll = $("#tabBodies .tab" + sfpDashboard.getActiveTab() + " .topTableArea").offset().top;
				
				//So if we've scrolled past that limit, set up a new scroll event to bring us back
				if (scrollTop > maxScroll) {
					sfpDashboard.toScrollTo = maxScroll;
					sfpDashboard.isScrolling = true; //and prevent anything else scrolling-related from happening before then
					setTimeout(function() {
						if (scrollTop > maxScroll) $(window).scrollTop(sfpDashboard.toScrollTo);
						sfpDashboard.isScrolling = false;
					},5);
					
					//If we're at the max but there's still table left to scroll, scroll the table instead
					//$("#tabBodies .tab" + sfpDashboard.getActiveTab() + " .mainTableArea").scrollTop($("#tabBodies .tab" + sfpDashboard.getActiveTab() + " .mainTableArea").scrollTop() + (scrollTop - maxScroll));
					
				} else {
					setTimeout(function() {
						
						//if we haven't scrolled past the limited, recalculate the layout and make the available amount of space left to scroll
						//equal to the limit.
						sfpDashboard.recalcLayout();
						$("#wrapper").css("margin-bottom",(maxScroll-scrollTop) + "px");
					},5);
				}
				
				$("#backgroundOverlay").css("top",scrollTop + "px");
				$("#chartGraphicContainer").css("top",scrollTop + "px");
			}
		},50);
	});
	
	//Initial table scroll synchronization and other stuff that needs doin'
	$(".mainTableArea").scroll(sfpDashboard.syncTableScroll);
	
	//Ensures all rows (initially) are considered for alt class/footer calculation
	$(".mainTableArea table tbody tr, .leftTableArea table tbody tr").attr("data-include","true");
	
	sfpDashboard.assignAltClasses();
	sfpDashboard.activateQuestionList();
	sfpDashboard.fillFooter();
	sfpDashboard.syncCellSize();
	
	//necessary to make the tablesorting work
	$(".mainTableArea table, .leftTableArea table").addClass("tableSorter");
	sfpDashboard.sortedColumns = {col:"default",sorted:1}; //keeps track of column sort state
	sfpDashboard.sortOptions = {
		emptyTo: "bottom",
		textExtraction: function(node) {	
			var toReturn;
			if (sfpDashboard.revertSort == true) {
				toReturn = $(node).parent().attr("data-initialsort");
			} 
			if (typeof(toReturn)=="undefined") {
				var attr = $(node).children("span.sortData").html();
				if (typeof attr !== 'undefined' && attr !== false) {
					toReturn = attr;
				} else {
					toReturn = $(node).children("span.display").html();
				}
			}
			return toReturn;
		}
	};
	
	$(".mainTableArea table").tablesorter(sfpDashboard.sortOptions);
	$(".leftTableArea table").tablesorter(sfpDashboard.sortOptions);
	
	$(".topTableArea table td").click(function() {
		var col = this.className;
		sfpDashboard.sortColumn(col);
		$("select.sortBy").val(col);
	});
	
	$(".topTableArea table td select").click(function(e) {
		e.stopPropagation();
	});
	
	$(".topTableArea table td select").change(function(e) {
		var year = $(this).val();
		var colkey = $(this).data("colkey");
		var url = "getDataSubset.php?year=" + year + "&col=" + colkey;
		var tab = sfpDashboard.getActiveTab();
		$.get(url,function(d) {
			var theData, colid, colData, baseSelector, overrideData, sortData, roundFactor;
			colid = d.colID;
			colData = $(".tab" + tab + " .topTableArea table td." + colid).data();
			//make blank first
			$(".tab" + tab + " .mainTableArea table td." + colid).html("<span class=\"display\"></span><span class=\"sortData\"></span>");
			for (var i=0;i<d.data.length;i++) {
				theData = d.data[i];
				baseSelector = ".tab" + tab + " .mainTableArea table tr." + theData.state + " td." + colid;
				if (theData.override_data == null && theData.sort_data == null) {
					$(baseSelector + " span.display").html("");
					$(baseSelector + " span.sortData").html("");
				} else {
					overrideData = theData.sort_data;
					sortData = theData.sort_data;
					if (colData.roundto !== null) {
						roundFactor = Math.pow(10,colData.roundto);
						overrideData = Math.round(overrideData*roundFactor)/roundFactor;	
					}
					if (colData.prepend) overrideData = colData.prepend + ("" + overrideData);
					if (colData.append) overrideData = colData.append + ("" + overrideData);
					if (theData.override_data) overrideData = theData.override_data;
					$(baseSelector + " span.display").html(overrideData);
					$(baseSelector + " span.sortData").html(sortData);
					if (colData.mode == "numeric") $(baseSelector).append(" <div class='lineChartButton'></div>");
				}
			}
			sfpDashboard.fillFooter(tab);
		});
	});
	
	$("select.sortBy").change(function() {
		var col = this.value;
		sfpDashboard.sortColumn(col);
	});
	
	$(".topLeftHeaderText").click(function() {
		sfpDashboard.sortColumn("default");
	});
	
	/*Activate initial filter's column change functionality - this can probably be deleted
	because there is no longer an initial filter*/
	$("ul.filters select.filterBy").change(function() {
		var filter = $(this).parent("li").attr("class").replace("filter","");
		sfpDashboard.filterColumnChange(filter);
	});
	sfpDashboard.filterColumnChange(1);
	
	sfpDashboard.filtersApplied = [];
	
	//activate Add link
	$("ul.filters li.filterAdd span.add").click(function() {
		sfpDashboard.addFilter(sfpDashboard.getActiveTab());
	});
	
	//activate Remove link
	$("ul.filters li.filterAdd span.remove").click(function() {
		var tab = sfpDashboard.getActiveTab();
		sfpDashboard.removeFilter(tab);
		if (typeof(sfpDashboard.filtersApplied[tab]) == "undefined") sfpDashboard.filtersApplied[tab] = 0;
		if (sfpDashboard.filtersApplied[tab] > $("#tabBodies .tab" + tab + " ul.filters li").length) sfpDashboard.applyFilters(tab);
	});
	
	//activate filter apply button
	$(".filterArea button.apply").click(function() {
		sfpDashboard.applyFilters(sfpDashboard.getActiveTab());
	});
	
	//activate that little X in the corner of the table of contents
	$(".dataDisplayArea .questionList .xbox").click(function() {
		sfpDashboard.hideQuestionList();
	});
	
	//activate the thing that opens the TOC back up
	$(".dataDisplayArea .tableArea .openArrow").click(function() {
		sfpDashboard.showQuestionList();
	});
	
	//activate tab selection
	$("#tabs li.tab").click(function() {
		var clickedTab = $(this).attr("id").replace("tabPicker","");
		sfpDashboard.setActiveTab(clickedTab);
		sfpDashboard.assignAltClasses();
		var whichFooters = sfpDashboard.getFootersNeedCalc();
		if (whichFooters[clickedTab] == true) sfpDashboard.fillFooter();
		sfpDashboard.syncCellSize();
		sfpDashboard.recalcLayout();
	});
	
	sfpDashboard.addPeriodicTask("calculateFooters",function() {
		sfpDashboard.fillAllFooters();
	});
	
	$(".barChartButton").click(function(e) {
		e.stopPropagation();
		sfpDashboard.makeBarChart({dataset:$(this).parents("td")[0].className},"allStatesOneYear");
		$(window).trigger("scroll");
	});
	
	$(".mainTableArea td").on("click",".lineChartButton",function(e) {
		e.stopPropagation();
		var id = $(this).parents("td").first()[0].className;
		var state = $(this).parents("tr").first()[0].className.split(/\s+/)[0];
		var colkey = $(".topTableArea td." + id).data("column_key");
		sfpDashboard.makeBarChart({state:state,dataset:id,colkey:colkey},"oneStateAllYears");
		$(window).trigger("scroll");
	});
	
	$("body").on("click","#chartGraphicContainer",function(e) {
		sfpDashboard.clearBarChart();
		e.stopPropagation();
	});
	
	$("body").on("click","#chartGraphicContainer .barChartGraphic",function(e) {
		e.stopPropagation();
	});
	
	//recalculate layout on window resize
	$(window).resize(function() {
		try {
			sfpDashboard.recalcLayout();
		} catch (ex) {
			console.log(ex);	
		}
	});
	
	
	} catch (ex) {
		console.log(ex);	
	}
});
