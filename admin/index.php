<!DOCTYPE html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>SFP Dashboard Wireframe Admin</title>
<script src="//use.typekit.net/vrv7qdc.js"></script>
<script>try{Typekit.load();}catch(e){}</script>
<script type="text/javascript" src="../jquery-1.11.1.min.js"></script>
<script src="../shared.js"></script>
<script src="autogrow.min.js"></script>
<script src="admin.js"></script>
<link rel="stylesheet" href="admin.css" tyle="text/css" />

</head>
<body>
	<div class="wrapper">
    <?php include("../config.php"); ?>
	<?php include("../dashboard.php"); ?>
       	<div id="dataTab" class="tabBody">
        	<div id="dataTableOuterWrap" class="tableOuterWrap">
            	<div id="dataTableScroll" class="tableScroll">
                    <div id="dataTableWrapper" class="tableWrapper">
                        <table id="dataTable">
                            <thead>
                            	<tr><th class="first">State</th>
                                <?php 
                             	foreach ($columnsArr as $column) : ?>
                                	<?php //print_r($columnsArr); ?>
                                	<th class="title" colspan="2" <?php 
									foreach ($column as $attrName=>$attr) {
										if (!in_array($attrName,array("shortName","longName","columnOrder","column_key")) && isset($attr)) : ?>data-<?php echo $attrName;?>="<?php echo $attr;?>" <?php endif;
									};
									?>data-id="<?php echo $columnIDArr[$column["column_key"]];
									?>" <?php 
											echo (array_key_exists($column["column_key"],$yearsArr)) ? 
											("data-year=\"".max($yearsArr[$column["column_key"]])."\"") :
											("") ?>><?php echo $column["shortName"]; 
													echo yearSelector($column["column_key"]); ?></th>
                                <?php endforeach; ?>
                           	 	</tr><tr><th class="first">&nbsp;</th>
                             	<?php foreach ($columnsArr as $column) : ?>
                                	<th class = "actual" data-id="<?php echo $columnIDArr[$column["column_key"]];?>">Actual</th>
                                	
                                	<th class = "override" data-id="<?php echo $columnIDArr[$column["column_key"]]; ?>">Note</th>
                            	<?php endforeach; ?>
								</tr>                            
							</thead>
                            <tbody>
                            <?php 
                            foreach ($statesArr as $name=>$state) : ?>
                               <tr class="state" data-state="<?php echo $name; ?>"><td class="first"><?php echo $name;?></td>
                                <?php foreach ($columnsArr as $column) : ?>
                                    <?php 
									if (array_key_exists($column["column_key"],$yearsArr)) {
										$key_app = "_" . max($yearsArr[$column["column_key"]]);
									} else $key_app = "_0";
									
									$key = $name . $column["column_key"] . $key_app;
									
									//$key = $name . $column["column_key"];
									if (array_key_exists($key,$dataArr)) $dataExists = true;
									else $dataExists = false; ?>
                                    <td class = "actual" data-id="<?php echo $columnIDArr[$column["column_key"]];?>"><textarea type="text" id="input_actual_<?php echo $columnIDArr[$column["column_key"]];?>"><?php echo ($dataExists ? addcslashes($dataArr[$key]["sort_data"],'"') : "");?></textarea></td>
                                   
                                    <td class = "override" data-id="<?php echo $columnIDArr[$column["column_key"]];?>"><textarea type="text" id="input_override_<?php echo $columnIDArr[$column["column_key"]]?>"><?php echo ($dataExists ? addcslashes($dataArr[$key]["override_data"],'"') : "");?></textarea></td>
                                    
                                <?php endforeach; ?>
                                </tr>
                            <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div><!--end dataTableWrapper-->
                </div><!--end dataTableScroll-->
            </div><!--end dataTableOuterWrap-->
            <div id="columnPicker">
                <p>Show columns:</p>
                <select multiple class="columns">
                    <?php foreach ($columnsArr as $column) : ?>
                        <option selected value="<?php echo $columnIDArr[$column["column_key"]]; ?>"><?php echo $column["shortName"]; ?></option>
                    <?php endforeach; ?>
                </select>
                <hr />
                <p>Save your changes to the database:<br />
                <button id="saveData">Save Data</button></p>
                <hr />
                <p>Get a spreadsheet of the current database: <br />
                <a href="#" id="getSpreadsheetLink">Download</a></p>
                <hr />
                
                <p>Upload a new spreadsheet, based off of one downloaded above:
                <form id="uploadSpreadsheet" action = "uploadSpreadsheet.php" method="POST" enctype="multipart/form-data">
                	<input type="file" name="uFile" />
                    <button type="submit">Upload</button>
                </form><br />
                To make structural changes (new columns, etc.) use the "structure" tab above; use Excel import/export to make 
                data changes only. To add a new column, add it to the structure tab first, then download the spreadsheet and 
                insert your new data. Making structural changes directly in Excel will not work and might cause unpredictable behavior.</p>
                <hr />
                Download all data for a single state:
                <form id="getStateSpreadsheet" action="../getStateSpreadsheet.php" method="GET">
                	<select id="stateSpreadsheetSelector" name="state">
                    <?php foreach ($statesArr as $name=>$state) : ?>
                    	<option value = "<?php echo $name; ?>"><?php echo $state; ?></option>
                    <?php endforeach; ?>	
                    </select>
                    <button type="submit">Download</button>
                </form>
                <hr />
                
                <div id="responseFromServer">
                
                </div><!--end responseFromServer-->
            </div><!--end columnPicker-->
        </div><!--end dataTab-->
        <div id="structureTab" class="tabBody">
        	<div id="structureTableOuterWrap" class="tableOuterWrap">
            	<div class="tableScroll">
                    <div id="structureTableWrapper" class="tableWrapper">
                        <table id="structureTable">
                            <thead>
                                <tr>
                                	<th></th>
                                    <th>ID</th>
                                    <th>Years</th>
                                    <th>Long Name</th>
                                    <th>Short Name</th>
                                    <th>Data Mode</th>
                                    <th>Round To</th>
                                    <th>Prepend</th>
                                    <th>Append</th>
                                    <th>Tab</th>
                                </tr>
                            </thead>
                            <tbody>
                            	<?php function dataModeSelector($dataMode) { 
									?><select class="dataModeSelector" data-role="dataModeSelector">
                                    		<option value="text" <?php echo ($dataMode=="text") ? "selected" : "" ?>>Text</option>
                                            <option value="numeric" <?php echo ($dataMode=="numeric") ? "selected" : "" ?>>Numeric</option>
                                            <option value="date" <?php echo ($dataMode=="date") ? "selected" : "" ?>>Date</option>
                                   		</select>
								<?php }
								function htmlToTextLineBreaks($html) {
									$theRegex = "/(\s)*?<br *?\/*? *?>(\s)*?/";
									$lineBreak = "\n";
									return preg_replace($theRegex,$lineBreak,$html);
								}
								?>
                                <?php foreach ($columnsArr as $column): ?>
                                <tr>
                                	<td><button data-role="addDataColumn">Insert Row Above</button></td>
                                    <td><input data-role="colID" type="text" value="<?php echo $columnIDArr[$column["column_key"]]; ?>" /></td>
                                    <td><?php
									if (array_key_exists($column["column_key"],$yearsArr)) {
										echo "<ul class=\"years\">"; 
									foreach ($yearsArr[$column["column_key"]] as $year) { ?>
										<li><span class="year"><?php echo $year;?></span> <span class="yDelete">[x]</span></li>
									<?php }
										echo "</ul>"; 
									}?><input class="yAddYear" type="text" /> <span class="yAdd">[Add]</span></td>
                                    <td class="textAreaInside"><textarea data-role="longName"><?php echo htmlToTextLineBreaks($column["longName"]); ?></textarea></td>
                                    <td><input data-role="shortName" type="text" value="<?php echo $column["shortName"]; ?>" /></td>
                                    <td><?php dataModeSelector($column["mode"]); ?></td>
                                    <td><input data-role="roundTo" <?php echo ($column["mode"]=="numeric" ? "" : "disabled"); ?> type="text" size="2" value="<?php echo $column["roundTo"]; ?>"></td>
                                    <td><input data-role="prepend" type="text" size="2" value="<?php echo $column["prepend"]; ?>"></td>
                                    <td><input data-role="append" type="text" size="2" value="<?php echo $column["append"]; ?>"></td>
                                    <td><input data-role="tabAssoc" type="text" size="2" value="<?php echo $column["tabAssoc"]; ?>"></td>
                                    <td><div class="upArrow">Up</div><div class="downArrow">Down</div><div data-function="delete" class="deleteButton">Delete</div></td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                            
                        </table>
                        <button id="addNewRowAtEnd">Append Row</button>
                    </div><!--end structureTableWrapper-->
                	 <div id="structureLeft">
                     <p>&nbsp;</p>
                <button id="saveStructureData">Save Structure</button>
                <P>&nbsp;</P>
                <div id="responseFromServerStructure">
                
                </div><!--end responseFromServer-->    
            </div><!--end structureLeft-->  
                
            	</div><!--end tableScroll-->
                
        	</div><!--end structureOuterWrap-->
           
        </div><!--end structureTab-->
        <div id="tabsTab" class="tabBody">
        	<table id="tabsTable">
            	<thead>
                	<th>Tab ID</th><th>Tab Name</th><th>&nbsp;</th>
                </thead>
                <tbody>
                <?php foreach ($tabsArr as $tab) { ?>
                	<tr>
                        <td><?php echo $tab["tab_id"]; ?></td>
                        <td><input data-role="tab_title" type="text" value="<?php echo $tab["title"]; ?>" /></td>
                        <td><a href="#up" class="upLink">Move up</a> | <a href="#down" class="downLink">Move down</a></td>
                    </tr>
				<?php } ?>
                <tfoot>
                    <tr>
                    	<td colspan="3"><a href="#saveTabNames" class="saveTabs">Save Tabs</a></td>
                    </tr>
                    
                </tfoot>
                </tbody>
            </table>
        </div>
	</div><!--end wrapper-->
    <div id="tabPicker">
        	<h2>Dashboard Admin Area</h2>
        	<div class="tab" id="pickData">Data</div>
            <div class="tab" id="pickStructure">Structure</div>
            <div class="tab" id="pickTabs">Tabs</div>
        </div>
</body>