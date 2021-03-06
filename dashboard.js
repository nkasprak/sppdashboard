// SFP Dashboard
// by Nicholas A. Kasprak
// CBPP
/*jshint multistr: true */
var startTime = new Date().getTime();
var sfpDashboard;
$(window).load(function() { //using window load rather than document ready seems to make the table layout more reliable
"use strict";
try {
	/*On the main page there's this chunk of code: 
		ie7 = true;
		<!--[if lt IE 8]>
		<script type="text/javascript">
			var ie7 = false;
		</script>
		<![endif]-->*/
	if (ie7) {return false;}
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
		/*var periodicTimer = */setInterval(function() {
			for (var task in periodicTasks) {
				if (periodicTasks.hasOwnProperty(task)) {
					try {
						periodicTasks[task]();
					} catch (ex) {
						console.log("error executing task " + task);	
					}
				}
			}
		},5000);
		
		var tabIsScrollingRight = false;
		var tabIsScrollingLeft = false;
		var tabScrollingTimer;
		var fLoopI;
		var fLoopJ;
		var fLoopILength;
		var fLoopJLength;
		var fLoopRunning = false;
		var neededTabs;
		var filterApplicationInProgress = false;
		var savedFilterArray;
		
		//private functions follow
		
		/*The "Freeze panes" - like behavior is accomplished through having three separate tables that look like
		one table. The following two functions synchronize the height/widths of the cells of the main table with 
		the left state names table and the top column names table. They are called using the public function
		syncCellCize()*/
		var privateSyncWidths = function() {
			var accWidth = 0; //"accumulated width" - div wrapper around the table will be set to this
			$("th, td").removeAttr("width"); //reset existing width attributes
			
			//main table, first row (only need to set widths on one row) - as collection of <td> jQuery objects
			var rowOfCells = $($("#tabBodies .tab" + activeTab + " .mainTableArea table tfoot tr")[0]).children("td");
			
			//top table (column headers) - first (and only) row - as collection of <td> jQuery objects
			var rowOfHeaders = $($("#tabBodies .tab" + activeTab + " .topTableArea table tbody tr")[0]).children("td");
			
			var maxWidth; //used to store greater of "header" or main table cell width
			
			/*Loop through cells that are common to both header row and main row (although they should be the same 
			number of cells - if they don't there's a problem)*/
			for (var i = 0,ii=Math.min(rowOfCells.length,rowOfHeaders.length);i<ii;i++) {
				
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
		
		var privateSyncHeights = function() {
			/*This is all basically the same as the syncWidths function, but no need to track accumulated
			height because the scrolling behaves a bit differently.*/
			//$("th, td").removeAttr("height");
			$("#tabBodies .tab" + activeTab + " th, #tabBodies .tab" + activeTab + " td, #tabBodies .tab" + activeTab + " .mainTableArea table, #tabBodies .tab" + activeTab + " .leftTableArea table").css("height","auto");
			var allRows = $("#tabBodies .tab" + activeTab + " .mainTableArea table tr");
			var leftRows = $("#tabBodies .tab" + activeTab + " .leftTableArea table tr");
			var maxHeight;
			for (var i = 0,ii=Math.min(allRows.length,leftRows.length);i<ii;i++) {
				maxHeight = Math.max($($(allRows[i]).children("td")[0]).height(),$($(leftRows[i]).children("td")[0]).height());
				//$($(leftRows[i]).children("td")[0]).attr("height",maxHeight);
				//$($(allRows[i]).children("td")[0]).attr("height",maxHeight);
				
				$($(leftRows[i]).children("td")[0]).css("height",maxHeight + "px");
				$($(allRows[i]).children("td")[0]).css("height",maxHeight + "px");
			}
			maxHeight = Math.max($(".leftTableArea > .tableWrapper > table").height(),
								 $(".mainTableArea > .tableWrapper > table").height());
			$(".leftTableArea > .tableWrapper > table, .mainTableArea > .tableWrapper > table").height(maxHeight);
		};
		
		
		/*This is assigned to the "table of contents" <li>s click event in the activateQuestionList() function.
		Gets the column id from the <li> class and triggers the scroll function.*/
		var qListClick = function() {
			var id = this.className;
			sfpDashboard.scrollToColumn(id);
		};
		
		/*Returns the column number of a particular column id. Used here and there.*/
		var returnColIndex = function(col_id) {
			var tabOfCol = getColumnDataAttr(col_id,"tabAssoc");
			var tds = $($("#tabBodies .tab" + tabOfCol + " .mainTableArea table tbody tr")[0]).children("td");
			for (var i = 0,ii=tds.length;i<ii;i++) {
				if ($(tds[i]).hasClass(col_id)) {return i;}	
			}
			return -1;
		};
		
		/*In HTML5 you can store data in arbitrary attributes with the "data-" prefix. I find this
		very useful. This function extracts column metadata from the <td> elements of the first row of the top header table,
		where I've stored it.*/
		var getColumnDataAttr = function(col_id,attr) {
			var value = $(".topTableArea td." + col_id).attr("data-" + attr);
			return value;
		};
		
		/*Used in handling dates in some columns. Returns the number of days into the year of a particular date.*/
		var daysIntoYear = function(month,days) {
			month = month*1;
			var months = [0,31,28,31,30,31,30,31,31,30,31,30,31];
			var rVal = 0;
			for (var i = 1;i<month;i++) {
				rVal += (months[i]*1);	
			}
			rVal += (days*1);
			return rVal;
		};
		
		var loadedTabs = {1:true};
		var formattedTabs = {};
		
		/*Public functions*/
		return {
			
			//Gets the currently displayed tab
			getActiveTab: function() {
				return activeTab;	
			},
			
			tabOrders: (function() {
				var r = {};
				var tabs = $("#tabs .tab");
				var tabID;
				for (var i = 0,ii=tabs.length;i<ii;i++) {
					tabID = tabs.eq(i).attr("id").substr(9);
					r[tabID] = i;	
				}
				return r;
			})(),
			
			//Adds a function to be executed in the period tasks private method that runs every second (useful for background stuff)
			addPeriodicTask: function(taskID, task) {
				periodicTasks[taskID] = task;
			},
			
			removePeriodicTask: function(taskID) {
				delete periodicTasks[taskID];
			},
			
			loadTabData: function(tabID, onComplete) {
				$.get("tableBuilder.php?tabIndex=" + tabID, function(response) {
					loadedTabs[tabID] = true;
					$("#tabBodies .tab" + tabID + " .mainTableArea .tableWrapper").html(response);
					$("#tabBodies .tab" + tabID + " .mainTableArea table tbody tr").attr("data-include","true");
					if (typeof(onComplete)==="function") {onComplete();}
				});
			},
			
			//Changes the currently displayed tab
			setActiveTab: function(tabID) {
				var d = this;
				activeTab = tabID;
				function finishLoading() {
					$("#tabBodies .tabBody").hide();
					$("#tabBodies .tab" + tabID).show();
					$("#tabs .tab").removeClass("selected");
					$("#tabs #tabPicker" + tabID).addClass("selected");
				}
				if (loadedTabs[tabID]) {
					finishLoading();
					if (!formattedTabs[tabID]) {
						d.setupNewTab(tabID);	
					}
				} else {
					finishLoading();
					d.loadTabData(tabID, function() {
						d.setupNewTab(tabID);
					});
				}
			},
			
			//Gets a list of column IDs for a particular tab.
			getColumnIds: function(tabID) {
				var toReturn = [], tds, i, ii;
				
				//Or all the tabs at once. If that's what you want.
				if (tabID === "all") {
					
					//Loop through each tab
					for (i = 1,ii=$("#tabBodies .tabBody").length;i<=ii;i++) {
						
						//Get the tob row as a set of cells
						tds = $($("#tabBodies .tab" + i + " .topTableArea table tbody tr")[0]).children("td");
						
						//Loop through the cells and extract the column id from the class.
						for (var j = 0,jj=tds.length;j<jj;j++) {
							toReturn.push($(tds[j]).attr("class"));
						}
					}
				} else {
					
					//Same thing as above except only for one tab.
					tds = $($("#tabBodies .tab" + tabID + " .mainTableArea table tbody tr")[0]).children("td");
					for (i = 0,ii=tds.length;i<ii;i++) {
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
				for (var i = 0,ii=lists.length; i<ii;i++) {
					list = $(lists[i]).children("li");
					for (var j = 0,jj=list.length;j<jj;j++) {
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
				for (var i = 0,ii=Math.max(leftTableRows.length,mainTableRows.length);i<ii;i++) {
					if (leftTableRows[i]) {$(leftTableRows[i]).removeClass("alt");}
					if (mainTableRows[i]) {$(mainTableRows[i]).removeClass("alt");}
					if (i%2===0) {
						if (leftTableRows[i]) {$(leftTableRows[i]).addClass("alt");}
						if (mainTableRows[i]) {$(mainTableRows[i]).addClass("alt");}
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
				
				var i, ii, lastFilterId, defaultValue;
				if (filters.length > 1) {
					var usedFilters = [];
					
					/*Loop through current filters*/
					for (i = 0,ii=filters.length-2;i<=ii;i++) {
						
						/*and store the filters that are already being used*/
						usedFilters.push($(filters[i]).children("select.filterBy").val());
					}
					
					/*Loop through all the column IDs*/
					for (i = 0,ii=cols.length;i<ii;i++) {
						
						/*...until we find the first column id that isn't already being used as a filter*/
						if (($.inArray(cols[i],usedFilters))===-1) {
							
							/*...and save that column id for later*/
							defaultValue = cols[i];
							break;
						}
					}
					
					/*also, figure out the numerical index of the final existing filter. This will just be 1,2,3, etc.)*/
					lastFilterId = $(lastFilter).attr("class").replace("filter","")*1;
				} else {
					
					/*or even 0, if we don't have any yet.*/
					lastFilterId = 0;
				}
				
				/*Start building an HTML string for the new filter <select> options.*/
				var optionsString = "";
				var colTabs = [];
				for (i = 0,ii=cols.length;i<ii;i++) {
					colTabs.push([cols[i],sfpDashboard.tabOrders[getColumnDataAttr(cols[i],"tabAssoc")*1],i]);	
				}
				colTabs.sort(function(a,b) {
					if (a[1] === b[1]) {
						return a[2] - b[2];	
					} else {
						return a[1] - b[1];
					}
				});
				
				
				
				/*Loop through all the column ids...*/
				for (i = 0,ii=colTabs.length;i<ii;i++) {
					if (i>0) {
						/*Add a "---" disabled break to separate tab groups*/
						if (getColumnDataAttr(colTabs[i][0],"tabAssoc") !== getColumnDataAttr(colTabs[i-1][0],"tabAssoc")) {optionsString += "<option value='0' disabled>---</option>";}
					}
					
					/*and create options for each.*/
					optionsString += '<option value="' + colTabs[i][0] + '">' + sfpDashboard.getColumnShortName(colTabs[i][0]) + "</option>";
					
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
				if (filters.length === 2) {
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
			applyFilters: function(tab_id, ignore_lock) {
				if (filterApplicationInProgress && typeof(ignore_lock)==="undefined") {
					return false;	
				}
				filterApplicationInProgress = true;
				
				/*Loop through relevant DOM elements and extract the necessary data*/
				var filterArray = function() {
					var comparisons = [];
					var lis = $("#tabBodies .tab" + tab_id + " ul.filters li"), li, privFilterBy, privCompare, privValue, privMonth, privDay, privUseDate, privTabAssoc;
					for (var i = 0,ii=lis.length-1; i<ii; i++) {
						li = lis[i];
						privFilterBy = $(li).children("select.filterBy").val();
						privCompare = $(li).children("select.compare").val();
						privValue = $(li).children("input.val").val();
						privMonth = $(li).find("select.month").val();
						privDay = $(li).find("input.day").val();
						privUseDate = (getColumnDataAttr(privFilterBy,"mode") === "date") ? true : false;
						privTabAssoc = getColumnDataAttr(privFilterBy,"tabAssoc");
						comparisons.push({
							filterBy: privFilterBy,
							compare: privCompare,
							value: privValue,
							month: privMonth,
							day: privDay,
							useDate: privUseDate,
							tab: privTabAssoc
						});
					}
					return comparisons;
				}();
				
				savedFilterArray = filterArray;
				
				/*check if all necessary tabs are loaded*/
				
				function checkIfFinishedLoading() {
					var finishLoading = true;
					for (var i=0,ii=savedFilterArray.length;i<ii;i++) {
						if (!loadedTabs[savedFilterArray[i].tab]) {
							console.log("tab " + savedFilterArray[i].tab + " not loaded; waiting");
							finishLoading = false;		
						}
					}
					if (finishLoading) {
						sfpDashboard.applyFilters(tab_id, true);	
					}
				}
				
				var continueWithFilter = true;
				for (i = 0,ii=savedFilterArray.length;i<ii;i++) {
					if (!loadedTabs[savedFilterArray[i].tab]) {
						sfpDashboard.loadTabData(savedFilterArray[i].tab, checkIfFinishedLoading);
						continueWithFilter = false;
					}
				}
				
				if (!continueWithFilter) {
					return false;	
				}
				
				footersNeedCalculation[tab_id] = true;
				sfpDashboard.filtersApplied[tab_id] = $("#tabBodies .tab" + tab_id + " ul.filters li").length;
				
				/*Generalized comparison function to check if a filter applies to a particular row.
				cVal is the value of the cell, fVal is the value of the filter.*/
				var comparor = function(cVal,filterObj) {
					var fVal;
					if (filterObj.useDate) {
						fVal = daysIntoYear(filterObj.month,filterObj.day);
					} else {
						fVal = filterObj.value;
					}
					switch (filterObj.compare) {
						case "equal":
						return (cVal === fVal);
						case "less":
						return (cVal*1 < fVal*1);
						case "more":
						return (cVal*1 > fVal*1);
						case "contains":
						return (cVal.indexOf(fVal) > -1 ? true : false);	 
					}
				};
				
				/*Get all the rows of the main table(s)*/
				var mainTableTrs = $("#tabBodies .tabBody .mainTableArea table tbody tr");
				
				/*Loop through the table rows*/
				var state, tr, showRow, cValue, colId, numFilters=filterArray.length;
				for (var i = 0,ii=mainTableTrs.length;i<ii;i++) {
					tr = mainTableTrs[i];
					
					/*Get state from row class*/
					state = $(tr).attr("class").replace(" alt","");
					
					/*Default is to show the row, unless the filters tell us otherwise, so start with that*/
					showRow = true;
					
					/*Loop through each active filter*/
					for (var j = 0;j<numFilters;j++) {
						colId = filterArray[j].filterBy;
						
						/*start HERE next week*/
						/*You need to find a way to load the tabs for any filters selected, and delay execution of the filer apply until they're all loaded.*/
						
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
						if (cValue !== "notInThisTab") {
							if (comparor(cValue,filterArray[j]) === false) {
								showRow = false;
							}
						}
	
						/*Or if the cell is blank, hide it in that situation as well*/
						if (cValue === "") {showRow = false;}
					}
					
					/*Actually show/hide the row*/
					if (cValue !== "notInThisTab") {
						if (showRow === false) {
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
				filterApplicationInProgress = false;
				
			}, /*end applyFilters*/
			
			/*Sort the table using the tablesorter library*/
			/*See http://mottie.github.io/tablesorter/docs/ for more info*/
			/*This is a bit different than the standard tablesorter usage because of the three tables setup*/
			sortColumn: function(col_id) {
				var tab = sfpDashboard.getActiveTab();
				var sortOrder = 0;
				if (col_id === sfpDashboard.sortedColumns.col) {
					sortOrder = 1 - sfpDashboard.sortedColumns.sorted;
				}
				
				sfpDashboard.sortedColumns = {col:col_id,sorted:sortOrder};
				
				//need the index, not the id, because that's what tablesorter needs
				var colIndex;
				if (col_id==="default") {
					colIndex = 0;
					sfpDashboard.revertSort = true;	
					col_id = $("#tabBodies .tab" + sfpDashboard.getActiveTab() + " .topTableArea table tr:first td:first").attr("class");
				} else {
					colIndex = returnColIndex(col_id);
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
				for (var i = 0,ii=mainTDs.length;i<ii;i++) {
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
				if (getColumnDataAttr(col_id,"mode") === "text") {
					return "&nbsp;";	
				} else {
					
					//var tab = sfpDashboard.getActiveTab();
					var tab = getColumnDataAttr(col_id,"tabAssoc");
					
					//Otherwise, get all the visible cells of the relevant column
					var tds = $("#tabBodies .tab" + tab + " .mainTableArea table tbody tr" + '[data-include="true"]' + " td." + col_id);
					
					//Loop through the cells and store the values in vArray;
					var vArray = [];
					var val, i, ii;
					for (i = 0,ii=tds.length;i<ii;i++) {
						if ($(tds[i]).children("span.sortData").length > 0) {
							val = $(tds[i]).children("span.sortData").html()*1;
						} else {
							val = $(tds[i]).html()*1;
						}
						if (val !== "" && !isNaN(val)) {vArray.push(val);}
					}
					
					//sort the value array (so we can easily find the median)
					vArray.sort();
					
					//If there's no data to do anything with, shut it down
					if (vArray.length === 0) {return "&nbsp;";}
					
					//Next, do different things depending on the data we want
					switch (mode) {
						case "average":
						var total = 0;
						for (i = 0,ii=vArray.length;i<ii;i++) {
							total += vArray[i];
						}
						return total/vArray.length;
						case "median":
						
						//for the median, need to handle it slightly differently depending if
						//there's an odd or even number of values, but fairly straightforward -
						//just get the middle element (or the average of two middle elements)
						if (vArray.length%2===0) {
							return (vArray[vArray.length/2-1] + vArray[vArray.length/2])/2;
						} else {
							return vArray[(vArray.length-1)/2];
						}
						break;
						case "high":
							return Math.max.apply(Math,vArray);
						case "low":
							return Math.min.apply(Math,vArray);
						default:
						return "&nbsp;";
					}
				}
			},
			
			//Calculate max, min, average, median for all columns
			fillFooter: function(tabToFill) {
				var db = this;
				if (!tabToFill) {tabToFill = sfpDashboard.getActiveTab();}
				if (fLoopRunning === true) {
					setTimeout(function() {
						db.fillFooter(tabToFill);
					},1000);
					return false;
				}
				fLoopRunning = true;
				//added this option to enable doing these calculations on hidden tabs in the background to speed up tab switching
				
				//get <tr>'s in the <tfoot> of the main table
				var footerTrs = $("#tabBodies .tab" + tabToFill + " .mainTableArea table tfoot tr");
				
				//Loop through each <tr>...
				var tr;
				var mode;
				var tds;
				var col_id;
				var quantity, formattedQuantity;
				var theTD;
				var colAttrs = {};
				var col_ids = [];
				fLoopILength = footerTrs.length;
				fLoopI = 0;
				function innerLoop(i, j) {
					//get column id
					theTD = $(tds[j]);
					if (typeof(col_ids[j]) === "undefined") {
						col_ids[j] = theTD.attr("class");
					} 
					col_id = col_ids[j];
					if (typeof(colAttrs[col_id]) === "undefined") {
						var roundto = getColumnDataAttr(col_id,"roundto");
						var roundMultiplier;
						if (!isNaN(roundto)) {
							roundMultiplier = Math.pow(10,roundto*1)*1;
						}
						colAttrs[col_id] = {
							roundto: roundto,
							roundMultiplier : roundMultiplier,
							mode: getColumnDataAttr(col_id,"mode"),
							prepend: getColumnDataAttr(col_id,"prepend"),
							append: getColumnDataAttr(col_id,"append")
						};
					}
					//actually calculate the thing (see above function);
					quantity = sfpDashboard.calcQuantity(col_id,mode);
					
					formattedQuantity = sfpdashboard_shared_functions.formatData(colAttrs[col_id],quantity);
			
					
					//write it to the table
					//$(tds[j]).html("<span class='sortData'>" +quantity+"</span><span class='display'>" + formattedQuantity+"</span>");
					theTD.children("span.sortData").html(quantity);
					theTD.children("span.display").html(formattedQuantity);
					
					
					setTimeout(function() {
						fLoopJ++;
						if (fLoopJ < fLoopJLength) {
							
							innerLoop(fLoopI,fLoopJ);
						} else {
							setTimeout(function() {
								fLoopI++;
								if (fLoopI < fLoopILength) {
									outerLoop(fLoopI);
								} else {
									fLoopRunning = false;	
								}
							}, 1);
						}
					}, 1); 
				}
				
				function outerLoop(i) {
					tr = $(footerTrs[i]);
					
					//get the mode (the thing we're calculating - average, median, max, or min) - from the <tr>'s class name
					mode = tr.attr("class").replace("row_","");
					
					//get a collection of the cells in the current <tr>
					tds = tr.children("td");
					
					//Loop through those...
					fLoopJ = 0;
					fLoopJLength = tds.length;
				
					if (fLoopJ < fLoopJLength) {
						
						innerLoop(i,fLoopJ);
					}
				}
				
				
				outerLoop(fLoopI);
				
				footersNeedCalculation[tabToFill] = false;
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
				console.log("making a chart!");
				var dataset = parms.dataset;
				$("body").append($("<div id='backgroundOverlay'></div>"));
				$("body").append($("<div id='chartGraphicContainer'></div>"));
				$("#chartGraphicContainer").append($("<div class='barChartGraphic'>"));
				$("#chartGraphicContainer .barChartGraphic").append("<div class='barChartGraphicTitle'><h3>" + $(".topTableArea table td." + dataset + " span.longName").text() + "</h3></div>");
				$("#chartGraphicContainer .barChartGraphic").append("<div class='barChartGraphicFlotCanvas'>");
				var barChartData = {};
				var columnData = $(".topTableArea table td." + dataset);
				if (mode === "allStatesOneYear") {
					$.each($(".mainTableArea table tr td." + dataset + " span.sortData"),function() {
						if ($(this).parents("td").first().is(":visible")) {
							var stateCode = $(this).parents("tr").first()[0].className.split(/\s+/)[0];
							if (stateCode==="row_high" || stateCode === "row_low") {return false;}
							if (stateCode === "row_median") {stateCode = "Median";}
							if (stateCode === "row_average") {stateCode = "Mean";}
							if ($(this).text() !== "") {barChartData[stateCode] = $(this).text();}
						}
					});
					var flotifyData = function() {
						var i=0, returnData = [], returnTicks = [],footerReturnData = [],tData;
						for (var state in barChartData) {
							if (barChartData.hasOwnProperty(state)) {
								tData =  [barChartData[state]*1,50-i-0.25];
								returnTicks[i] = [50-i,state];
								if (state !== "Median" && state !== "Mean") {
									returnData[i] = tData;
								} else {
									footerReturnData[i] = tData;
								}
								i++;
							}
						}
						return [{data: returnData, ticks:returnTicks},{data: footerReturnData}];
					};
					var d=flotifyData(barChartData);
					var chartOptions = {
						yaxis: {
							ticks: d[0].ticks,
							tickLength:0
						},
						xaxis: {
							tickFormatter: function(t) {
								t = Math.round(t*Math.pow(10,columnData.data("roundto")))/Math.pow(10,columnData.data("roundto"));
								if (columnData.data("prepend")) {t = columnData.data("prepend") + t;}
								if (columnData.data("append")) {t = t + columnData.data("append");}
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
						colors: ["#0081a4","#eb9123" ]
					};
					sfpDashboard.activeChart = $.plot($("#chartGraphicContainer .barChartGraphicFlotCanvas"),[{data:d[0].data},{data:d[1].data}],chartOptions);
				} else {
					var url = "getDataSubset.php?col=" + parms.colkey + "&state=" + parms.state;
					var stateName = $(".leftTableArea tr." + parms.state + " td span.state").first().text();
					$("#chartGraphicContainer .barChartGraphic .barChartGraphicTitle h3").prepend(stateName + ": ");
					$.get(url,function(data) {
						var flotifyData = function(d) {
							var i = 0,ii,returnData = [];
							for (i=0,ii=d.data.length;i<ii;i++) {
								returnData[i] = [d.data[i].year,d.data[i].sort_data];	
							}
							return returnData;
						};
						var d = flotifyData(data);
						var chartOptions = {
							yaxis: {
								tickFormatter: function(t) {
									var roundTo = 0;
									if (typeof(columnData.data("roundto")) !== "undefined") {
										roundTo = columnData.data("roundto");
									}
									t = Math.round(t*Math.pow(10,roundTo))/Math.pow(10,roundTo);
									if (columnData.data("prepend")) {t = columnData.data("prepend") + t;}
									if (columnData.data("append")) {t = t + columnData.data("append");}
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
								
						};
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
			
			tabScrollRightOn: function() {
				tabIsScrollingRight = true;
				clearInterval(tabScrollingTimer);
				tabScrollingTimer = setInterval(function() {
					$("#tabWrapper").scrollLeft($("#tabWrapper").scrollLeft() + 30);
				},100);
			},
			tabScrollLeftOn: function() {
				tabIsScrollingLeft = true;
				clearInterval(tabScrollingTimer);
				tabScrollingTimer = setInterval(function() {
					$("#tabWrapper").scrollLeft($("#tabWrapper").scrollLeft() - 30);
				},100);
			},
			tabScrollRightOff: function() {
				tabIsScrollingRight = false;
				clearInterval(tabScrollingTimer);
			},
			tabScrollLeftOff: function() {
				tabIsScrollingLeft = false;
				clearInterval(tabScrollingTimer);
			},
			switchTab: function(clickedTab) {
				sfpDashboard.setActiveTab(clickedTab);
				sfpDashboard.assignAltClasses();
				/*var whichFooters = sfpDashboard.getFootersNeedCalc();
				if (whichFooters[clickedTab] === true) {sfpDashboard.fillFooter();}*/
				sfpDashboard.syncCellSize();
				sfpDashboard.recalcLayout();
			},
			setupNewTab: function(tabID) {
	
				if (formattedTabs[tabID]) {return false;}
	
				//Initial table scroll synchronization and other stuff that needs doin'
				$(".tab" + tabID + " .mainTableArea").scroll(sfpDashboard.syncTableScroll);
		
				//Ensures all rows (initially) are considered for alt class/footer calculation
				$(".tab" + tabID + " .mainTableArea table tbody tr, .tab" + tabID + " .leftTableArea table tbody tr").attr("data-include","true");
				
				sfpDashboard.assignAltClasses();
				
				sfpDashboard.activateQuestionList();
				
				sfpDashboard.fillFooter();
				
				sfpDashboard.syncCellSize();
				
				//necessary to make the tablesorting work
				$(".tab" + tabID + " .mainTableArea table, .tab" + tabID + " .leftTableArea table").addClass("tableSorter");
				sfpDashboard.sortedColumns = {col:"default",sorted:1}; //keeps track of column sort state
				sfpDashboard.sortOptions = {
					emptyTo: "bottom",
					textExtraction: function(node) {	
						var toReturn;
						if (sfpDashboard.revertSort === true) {
							toReturn = $(node).parent().attr("data-initialsort");
						} 
						if (typeof(toReturn)==="undefined") {
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
				
				$(".tab" + tabID + " .mainTableArea table").tablesorter(sfpDashboard.sortOptions);
			
				$(".tab" + tabID + " .leftTableArea table").tablesorter(sfpDashboard.sortOptions);
				
				$(".tab" + tabID + " .topTableArea table td").click(function() {
					var col = this.className;
					sfpDashboard.sortColumn(col);
					$("select.sortBy").val(col);
				});
				
				$(".tab" + tabID + " .topTableArea table td select").click(function(e) {
					e.stopPropagation();
				});
				
				$(".tab" + tabID + " .topTableArea table td select").change(function() {
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
						for (var i=0,ii=d.data.length;i<ii;i++) {
							theData = d.data[i];
							baseSelector = ".tab" + tab + " .mainTableArea table tr." + theData.state + " td." + colid;
							if (theData.override_data === null && theData.sort_data === null) {
								$(baseSelector + " span.display").html("");
								$(baseSelector + " span.sortData").html("");
							} else {
								overrideData = theData.sort_data;
								sortData = theData.sort_data;
								if (typeof(colData.roundto) !== "undefined") {
									if (colData.roundto !== null) {
										roundFactor = Math.pow(10,colData.roundto);
										overrideData = Math.round(overrideData*roundFactor)/roundFactor;	
									}
								}
								
								if (colData.prepend) {overrideData = colData.prepend + ("" + overrideData);}
								if (colData.append) {overrideData = ("" + overrideData) + colData.append;}
								if (theData.override_data) {$(baseSelector).append("<div class=\"note\"><div class=\"noteButton\"><a href=\"#\">*</a></div><div class=\"noteData\">"+theData.override_data+"</div></div>");}
								$(baseSelector + " span.display").html(overrideData);
								$(baseSelector + " span.sortData").html(sortData);
								if (colData.mode === "numeric") {$(baseSelector).append(" <div class='lineChartButton'></div>");}
							}
						}
						sfpDashboard.fillFooter(tab);
						sfpDashboard.syncCellSize();
					});
				});
				
				$("select.sortBy").change(function() {
					var col = this.value;
					sfpDashboard.sortColumn(col);
				});
				
				$(".topLeftHeaderText").click(function() {
					sfpDashboard.sortColumn("default");
				});
				
				$(".tab" + tabID + " .mainTableArea table td").on("click",".noteButton",function() {
					var theNote = $(this).next();
					if (theNote.is(":visible")) {
						$(this).next().hide();
					} else {
						$(this).next().show();
					}
					sfpDashboard.syncCellSize();
				});
				
				$(".tab" + tabID + " .mainTableArea table td").on("click",".noteData",function() {
					$(this).hide();
					sfpDashboard.syncCellSize();
				});
				
				/*Activate initial filter's column change functionality - this can probably be deleted
				because there is no longer an initial filter*/
				$(".tab" + tabID + " ul.filters select.filterBy").change(function() {
					var filter = $(this).parent("li").attr("class").replace("filter","");
					sfpDashboard.filterColumnChange(filter);
				});
				sfpDashboard.filterColumnChange(1);
				
				sfpDashboard.filtersApplied = [];
				
				//activate Add link
				$(".tab" + tabID + " ul.filters li.filterAdd span.add").click(function() {
					sfpDashboard.addFilter(sfpDashboard.getActiveTab());
				});
				
				//activate Remove link
				$(".tab" + tabID + " ul.filters li.filterAdd span.remove").click(function() {
					var tab = sfpDashboard.getActiveTab();
					sfpDashboard.removeFilter(tab);
					if (typeof(sfpDashboard.filtersApplied[tab]) === "undefined") {sfpDashboard.filtersApplied[tab] = 0;}
					if (sfpDashboard.filtersApplied[tab] > $("#tabBodies .tab" + tab + " ul.filters li").length) {sfpDashboard.applyFilters(tab);}
				});
				
				//activate filter apply button
				$(".tab" + tabID + " .filterArea button.apply").click(function() {
					sfpDashboard.applyFilters(sfpDashboard.getActiveTab());
				});
				
				//activate that little X in the corner of the table of contents
				$(".tab" + tabID + " .dataDisplayArea .questionList .xbox").click(function() {
					sfpDashboard.hideQuestionList();
				});
				
				//activate the thing that opens the TOC back up
				$(".tab" + tabID + " .dataDisplayArea .tableArea .openArrow").click(function() {
					sfpDashboard.showQuestionList();
				});
				
				
				
				$(".tab" + tabID + " .barChartButton").click(function(e) {
					e.stopPropagation();
					sfpDashboard.makeBarChart({dataset:$(this).parents("td")[0].className},"allStatesOneYear");
					$(window).trigger("scroll");
				});
				
				$(".tab" + tabID + " .mainTableArea td").on("click",".lineChartButton",function(e) {
					e.stopPropagation();
					var id = $(this).parents("td").first()[0].className;
					var state = $(this).parents("tr").first()[0].className.split(/\s+/)[0];
					var colkey = $(".topTableArea td." + id).data("column_key");
					sfpDashboard.makeBarChart({state:state,dataset:id,colkey:colkey},"oneStateAllYears");
					$(window).trigger("scroll");
				});
				
				formattedTabs[tabID] = true;
				
			}
		};
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
			if (sfpDashboard.isScrolling === false) {
				
				//Get the current scroll position of the whole window
				var scrollTop = $(window).scrollTop();
				
				//We don't want to scroll the main window past the top of the actual table itself
				var maxScroll = $("#tabBodies .tab" + sfpDashboard.getActiveTab() + " .topTableArea").offset().top;
				
				//So if we've scrolled past that limit, set up a new scroll event to bring us back
				if (scrollTop > maxScroll) {
					sfpDashboard.toScrollTo = maxScroll;
					sfpDashboard.isScrolling = true; //and prevent anything else scrolling-related from happening before then
					setTimeout(function() {
						if (scrollTop > maxScroll) {$(window).scrollTop(sfpDashboard.toScrollTo);}
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
	
	sfpDashboard.setupNewTab(1);
	
	//activate tab selection
	$("#tabs li.tab").click(function() {
		var clickedTab = $(this).attr("id").replace("tabPicker","");
		sfpDashboard.switchTab(clickedTab);
		
		$("select#fastTabSwitcher").val(clickedTab);
	
	});
	
	$("select#fastTabSwitcher").change(function() {
		var tab = $(this)[0].value, position;
		sfpDashboard.switchTab(tab);
		position = $("#tabPicker" + tab).position();
		$("#tabWrapper").animate({scrollLeft:position.left},100);
	});
	
	$("body").on("click","#chartGraphicContainer",function(e) {
		sfpDashboard.clearBarChart();
		e.stopPropagation();
	});
	
	$("body").on("click","#chartGraphicContainer .barChartGraphic",function(e) {
		e.stopPropagation();
	});
	
	$("#tabScroller .left").on("mouseenter", function() {
		sfpDashboard.tabScrollLeftOn();
	});
	
	$("#tabScroller .right").on("mouseenter", function() {
		sfpDashboard.tabScrollRightOn();
	});
	
	$("#tabScroller .left").on("mouseleave", function() {
		sfpDashboard.tabScrollLeftOff();
	});
	
	$("#tabScroller .right").on("mouseleave", function() {
		sfpDashboard.tabScrollRightOff();
	});
	
	$("#wrapper").css("visibility","visible");
	
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
