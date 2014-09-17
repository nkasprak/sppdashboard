<!DOCTYPE html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>SFP Dashboard Wireframe Admin</title>
<script src="//use.typekit.net/vrv7qdc.js"></script>
<script>try{Typekit.load();}catch(e){}</script>
<script type="text/javascript" src="jquery-1.11.1.min.js"></script>
<script src="shared.js"></script>
<script src="admin.js"></script>
<link rel="stylesheet" href="admin.css" tyle="text/css" />

</head>
<body>
	<div class="wrapper">
	<?php include("dashboard.php"); ?>
       	<div id="dataTab" class="tabBody">
        	<div id="dataTableOuterWrap" class="tableOuterWrap">
            	<div id="dataTableScroll" class="tableScroll">
                    <div id="dataTableWrapper" class="tableWrapper">
                        <table id="dataTable">
                            <thead>
                            	<tr><th class="first">State</th>
                                <?php 
                             	foreach ($columnsArr as $column) : ?> 
                                	<th class="title" colspan="3" <?php 
									foreach ($column as $attrName=>$attr) {
										if (!in_array($attrName,array("shortName","longName","columnOrder","column_key")) && !empty($attr)) : ?>data-<?php echo $attrName;?>="<?php echo $attr;?>"<?php endif;
									};
									?> data-id="<?php echo $columnIDArr[$column["column_key"]];
									?>"><?php echo $column["shortName"]; ?></th>
                                <?php endforeach; ?>
                           	 	</tr><tr><th class="first">&nbsp;</th>
                             	<?php foreach ($columnsArr as $column) : ?>
                                	<th class = "actual" data-id="<?php echo $columnIDArr[$column["column_key"]];?>">Actual</th>
                                	<th class = "display" data-id="<?php echo $columnIDArr[$column["column_key"]]; ?>">Display</th>
                                	<th class = "override" data-id="<?php echo $columnIDArr[$column["column_key"]]; ?>">Override</th>
                            	<?php endforeach; ?>
								</tr>                            
							</thead>
                            <tbody>
                            <?php 
                            foreach ($statesArr as $name=>$state) : ?>
                               <tr class="state" data-state="<?php echo $name; ?>"><td class="first"><?php echo $name;?></td>
                                <?php foreach ($columnsArr as $column) : ?>
                                    <?php $key = $name . $column["column_key"];
									if (array_key_exists($key,$dataArr)) $dataExists = true;
									else $dataExists = false; ?>
                                    <td class = "actual" data-id="<?php echo $columnIDArr[$column["column_key"]];?>"><input type="text" id="input_actual_<?php echo $columnIDArr[$column["column_key"]];?>" value="<?php echo ($dataExists ? addcslashes($dataArr[$key]["sort_data"],'"') : "");?>" /></td>
                                    <td class = "display" data-id="<?php echo $columnIDArr[$column["column_key"]];?>"></td>
                                    <td class = "override" data-id="<?php echo $columnIDArr[$column["column_key"]];?>"><input type="text" id="input_override_<?php echo $columnIDArr[$column["column_key"]]?>" value="<?php echo ($dataExists ? addcslashes($dataArr[$key]["override_data"],'"') : "");?>" /></td>
                                    
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
                <select multiple>
                    <?php foreach ($columnsArr as $column) : ?>
                        <option selected value="<?php echo $columnIDArr[$column["column_key"]]; ?>"><?php echo $column["shortName"]; ?></option>
                    <?php endforeach; ?>
                </select>
                <hr />
                <p>Save your changes to the database:<br />
                <button id="saveData">Save Data</button></p>
                <hr />
                <p>Get a spreadsheet of the current database: <br />
                <a href="getSpreadsheet.php">Download</a></p>
                <hr />
                <p>Upload a new spreadsheet, based off of one downloaded above:
                <form id="uploadSpreadsheet" action = "uploadSpreadsheet.php" method="POST" enctype="multipart/form-data">
                	<input type="file" name="uFile" />
                    <button type="submit">Upload</button>
                </form><br />
                To make structural changes (new columns, etc.) use the "structure" tab above; use Excel import/export to make 
                data changes only. To add a new column, add it to the structure tab first, then download the spreadsheet and 
                insert your new data. Making structural changes directly in Excel will not work and might cause unpredictable behavior.</p>
                
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
        
	</div><!--end wrapper-->
    <div id="tabPicker">
        	<h2>Dashboard Admin Area</h2>
        	<div class="tab" id="pickData">Data</div>
            <div class="tab" id="pickStructure">Structure</div>
        </div>
</body>