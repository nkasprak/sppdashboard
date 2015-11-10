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
<script type="text/javascript" src="flot/excanvas.min.js"></script>
<script type="text/javascript" src="flot/jquery.flot.min.js"></script>

<?php include("config.php"); ?>
<?php include("dashboard.php"); //Pulls data from database and organizes it into associative arrays ?>
<?php $sD = new stateDashboard(); ?>

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
            <p>Switch to tab: <select id="fastTabSwitcher">
            <?php for ($tabIndex = 0;$tabIndex<count($sD->tabsArr);$tabIndex++) {
				echo '<option value="'.$sD->tabsArr[$tabIndex]["tab_id"]. '">'.$sD->tabsArr[$tabIndex]["title"]."</option>\n";
			} ?>
            </select></p>
            </div><!--end div#introText-->
            <div id="tabWrapper">
            
            <ul id="tabs">
            <?php for ($tabIndex = 0;$tabIndex<count($sD->tabsArr);$tabIndex++) {
				echo '<li class="tab" id="tabPicker'.$sD->tabsArr[$tabIndex]["tab_id"]. '">'.$sD->tabsArr[$tabIndex]["title"]."</li>\n";
			} ?>
            </ul><!--end ul#tabs-->
            
            </div>
            <div id="tabScroller">
            	<div class="tabScroll left"> &lt;-- Left </div>
            	<div class="tabScroll right"> Right --&gt; </div>
            </div>
        </div> <!--end div.blue-->
        <div id="tabBodies">
        	<?php for ($tabIndex = $sD->lowTab;$tabIndex<=$sD->highTab;$tabIndex++) : /*Loop through each tab and create separate data display areas for each*/?>
            <div class="tabBody tab<?php echo $tabIndex ?>">
            	<div class="sortFilterArea">
                	<div class="sortArea">
            		<p><span class="label">Sort by: </span>
                    <select class="sortBy">
                    	<?php $sD->colMenuOps($tabIndex); //defined in dashboard.php ?>
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
                          	foreach ($sD->columnsArr as $id=>$column) {
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
							foreach ($sD->statesArr as $id=>$state) { ?>
								<tr class="<?php echo $id; ?>"><td><span class="state"><?php echo $state;?></span></td></tr>
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
                                        foreach ($sD->columnsArr as $id=>$column) {
											if ($column['tabAssoc'] == $tabIndex) {
												$tdAttrString = '<td ';
												foreach ($column as $attrName=>$attr) {
													if (!in_array($attrName,array("shortName","longName","Order")) && (!empty($attr) || $attr=="0")) {
														$tdAttrString .= "data-" . $attrName . "=\"" . $attr . "\" ";
													}
												} 
												$tdAttrString .= ' class="'.$id.'">';
												if (array_key_exists($column["column_key"],$sD->yearsArr)) {
													$tdAttrString .= $sD->yearSelector($column["column_key"]) . "<br />";
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
                            	<?php 
								if ($tabIndex == 1) {
									$sD->buildTable($tabIndex);
								}?>
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
