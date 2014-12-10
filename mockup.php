<!DOCTYPE html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>SFP Dashboard Wireframe</title>
<script src="//use.typekit.net/vrv7qdc.js"></script>
<script>try{Typekit.load();}catch(e){}</script>
<link rel="stylesheet" type="text/css" href="dashboard.css" />
<script type="text/javascript">
	var ie7 = false;
</script>

<!--[if lt IE 8]>
<style>
	div#wrapper {
    	display:none;
    }
    div#ie7 {
    	display:block;
    }
</style>
<script type="text/javascript">
	ie7 = true;
</script>
<![endif]-->

<script type="text/javascript" src="jquery-1.11.1.min.js"></script>
<script type="text/javascript" src="jquery.tablesorter.min.js"></script>
<script type="text/javascript" src="shared.js"></script>
<script type="text/javascript" src="dashboard.js"></script>
<script type="text/javascript" src="flot/jquery.flot.min.js"></script>

<?php include("dashboard.php"); //Pulls data from database and organizes it into associative arrays ?>

</head>

<body>
<div id="ie7">
	This website will not display correctly in Internet Explorer 7 or below. Please upgrade your browser.
</div>
<div id="wrapper">

	<div id="header">
    <img src="banner.png" alt="" />
    </div> <!--end div#header-->
	
    <div id="main">
    	<div class="blue">
            <div id="introText">
            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            </div><!--end div#introText-->
            
            <ul id="tabs">
            <?php for ($tabIndex = $lowTab;$tabIndex<=$highTab;$tabIndex++) {
				echo '<li class="tab" id="tabPicker'.$tabIndex.'">'.$tabsArr[$tabIndex]["title"]."</li>\n";
			} ?>
            </ul><!--end ul#tabs-->
        </div> <!--end div.blue-->
        <div id="tabBodies">
        	<?php for ($tabIndex = $lowTab;$tabIndex<=$highTab;$tabIndex++) : /*Loop through each tab and create separate data display areas for each*/?>
            <div class="tabBody tab<?php echo $tabIndex ?>">
            	<div class="sortFilterArea">
                	<div class="sortArea">
            		<p><span class="label">Sort by: </span>
                    <select class="sortBy">
                    	<?php colMenuOps($tabIndex); //defined in dashboard.php ?>
                    </select></p></div><div class="filterArea">
                    <p class="label"><span class="label">Filters:</span><br />
                    <button class="apply">Apply</button></p>
                    <ul class="filters">
                        <li class="filterAdd"><span class="add">Add Filter</span><span class="extras"> | <span class="remove">Remove Filter</span></span></li>
                    </ul></div>
            	</div><!--end div#sortFilterArea-->
                <div class="dataDisplayArea">
                	
                	<div class="questionList">
                    <div class="xbox"></div>	
                    	<p><strong>Question List</strong>:<br />(click to scroll)</p>
                		<ul>
                        	<?php
							/*Output table of contents links*/
                          	foreach ($columnsArr as $id=>$column) {
								if ($column['tabAssoc'] == $tabIndex) echo '<li class="'.$id.'">'.$column['shortName']."</li>\n";
							}
                          	?>
                        </ul>
                	</div>
                    <div class="tableArea">
                    	<div class="topLeft">
                            <div class="openArrow"></div>
                            <div class="topLeftHeaderText">
                            	<strong>State</strong>
                            </div>
                        </div>
                    	<div class="leftTableArea">
                        	<div class="tableWrapper">
                          <table cellspacing="0" cellpadding="0">
                          	<thead class="dummySort">
                            	<tr><th>&nbsp;</th></tr>
                            </thead>
                            <tbody>
                            <?php 
							/*Output cells of the left frozen table (state names) - class name will be the two letter state code*/
							$initialSortTracker = 0;
							foreach ($statesArr as $id=>$state) { ?>
								<tr class=<?php echo $id; ?>><td><?php echo $state;?></td></tr>
								<?php $initialSortTracker++; 
							} ?>
                            </tbody>
                            <tfoot>
                            <tr>
                              <td class='row_median'>Median</td>
                            </tr>
                            <tr>
                              <td class='row_average'>Average</td>
                            </tr>
                            <tr>
                              <td class='row_high'>High</td>
                            </tr>
                            <tr>
                              <td class='row_low'>Low</td>
                            </tr>
                            </tfoot>
                          </table>
                     	
                          </div>
                        </div>
                        <div class="topTableArea">
                        	<div class="tableWrapper">
                            	<table cellspacing="0" cellpadding="0">
                                    <tbody>
                                	<tr>
										<?php
										/*Output cells of the top frozen table (column names) - class name is the column ID.
										Also makes use of the ability in HTML5 to store arbitrary data in attributes beginning
										with the "data-" prefix, which will be used extensively when sorting and filtering
										the columns with jQuery*/
                                        foreach ($columnsArr as $id=>$column) {
											if ($column['tabAssoc'] == $tabIndex) {
												$tdAttrString = '<td ';
												foreach ($column as $attrName=>$attr) {
													if (!in_array($attrName,array("shortName","longName","Order")) && (!empty($attr) || $attr=="0")) {
														$tdAttrString .= "data-" . $attrName . "=\"" . $attr . "\" ";
													}
												} 
												$tdAttrString .= ' class="'.$id.'">';
												if (array_key_exists($column["column_key"],$yearsArr)) {
													$tdAttrString .= yearSelector($column["column_key"]);
												}
												$tdAttrString .= "<span class='longName'>" . $column['longName']."</span>";
												if ($column['mode'] == "numeric") $tdAttrString .= " <div class='barChartButton'></div></td>\n";
												else $tdAttrString .= "<br />&nbsp;</td>\n";
												echo $tdAttrString;
											}
                                        }
										
                                        ?>
                                	</tr>
                                    </tbody>
                            	</table>
                        	</div>
                        </div>
                        <div class="mainTableArea">
                        	<div class="tableWrapper">
                            	<table cellspacing="0" cellpadding="0">
                                <thead class="dummySort">
                                	<tr>
                                    	<?php  
										
										/*The table sorting is a bit funky because I'm using three separate tables instead of one.
										The tablesorter plugin requires each column to have a <th>, which is a problem since the
										click-to-sort function is on the separate top table. So I have these dummy <th>s below which
										don't do anything and aren't visible, just to make tablesorter happy.*/
										foreach ($columnsArr as $cid=>$column) {
											if ($column['tabAssoc'] == $tabIndex) echo "<th class='empty-bottom'>&nbsp;</th>";
										}
										?>
                                    </tr>
                                </thead>
                                <tbody>
                               	<?php
								
								/*Build the main table*/
								$initialSortTracker = 0;
                                foreach ($statesArr as $sid=>$state) {
									
									/*As with the left table, each row's class contains the two letter state abbreviation*/
                                    echo "<tr class=".$sid." data-initialSort=\"".$initialSortTracker."\">\n";
									$initialSortTracker++;
                                    foreach ($columnsArr as $cid=>$column) {
										
										/*Check if column is associated with current tab*/
										if ($column['tabAssoc'] == $tabIndex) {
											
											/*Build the lookup key (this is how the main data table references things - state_column 
											- for example, CA_sfai_proj*/
											
											if (array_key_exists($column["column_key"],$yearsArr)) {
												$key_app = "_" . max($yearsArr[$column["column_key"]]);
											} else $key_app = "_0";
											
											$key = $sid . $column["column_key"] . $key_app;
											
											if (array_key_exists($key,$dataArr)) {
												/*Data exists*/
												/*Get the data point*/
												$data = $dataArr[$key];
												
												/*Default case*/
												$data["display_data"] = $data["sort_data"];
												
												/*If it's a date, it'll be stored as days into the year, so convert that
												to displayable data and store the numeric data in the (hidden) sortdata
												<span>*/
												if ($column["mode"] == "date" && !empty($data["sort_data"])) {
													$timestamp = ($data["sort_data"])*86400;
													$theDate = date("M j",$timestamp);
													$data["display_data"] = $theDate;
												}
												
												/*If it's numeric, there are a few options for formatting the number
												(prepend, append, rounding, etc.) Output the formatted number and
												also the raw number as hidden sortdata*/
												if ($column["mode"] == "numeric" && is_numeric($data["sort_data"])) {
													if (is_numeric($column["roundTo"])) $data["display_data"] = round($data["sort_data"],$column["roundTo"]);
													if (!empty($column["prepend"])) {
														if ($data["sort_data"] < 0) {
															$data["display_data"] = "-" . $column["prepend"] . abs($data["display_data"]);	
														} else {
															$data["display_data"] = $column["prepend"] . abs($data["display_data"]);
														}
													}
												}
												
												if (!empty($data["override_data"])) $data["display_data"] = $data["override_data"];
											} else {
												/*Data does not exist*/
												$data["display_data"] = "";
												$data["override_data"] = "";	
											}
											
											/*Write the table cell (with class of the column id)*/
											echo '<td class="'.$cid.'"' . ($column["mode"] == "numeric" ? ' align="right"' : "") . '>';
											echo '<span class="display">' . $data["display_data"] ."</span>". (empty($data["sort_data"]) ? "" : "<span class='sortData'>".$data["sort_data"]."</span>" );
											if ($column["mode"]=="numeric" && array_key_exists($column["column_key"],$yearsArr) && $data["display_data"] != "") {
												echo " <div class='lineChartButton'></div>";
											};
											echo "</td>\n";
										}
                                    }
                                    echo "</tr>\n";
                                }	
                               ?>
                               </tbody>
                               <tfoot>
                               <?php
							   
							   /*Write the footer*/
							   $fArr = array("Median", "Average", "High", "Low");
							   for ($fArrI = 0;$fArrI < count($fArr);$fArrI++) {
									echo '<tr class="row_'. strtolower($fArr[$fArrI]) . '">'."\n";
								   	foreach ($columnsArr as $cid=>$column) {
										if ($column['tabAssoc'] == $tabIndex) echo '<td class="'.$cid.'"'. ($column["mode"] == "numeric" ? ' align="right"' : "").'>&nbsp;</td>';	
									}
									echo "\n</tr>\n";
							   }
							   ?>
                               </tfoot>
                              	</table>
                        	</div>
                        </div>
                    </div>
                </div><!--end div#dataDisplayArea-->
            </div><!--end div.tabBody-->
            <?php endfor; ?>
        </div><!--end div#tabBodies-->
    </div> <!--end div#main-->
</div> <!--end div#wrapper-->



</body>
</html>
