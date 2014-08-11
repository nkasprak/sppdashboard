<!DOCTYPE html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>SFP Dashboard Wireframe Admin</title>
<!--<link href='http://fonts.googleapis.com/css?family=Source+Sans+Pro:600,700,600italic,700italic' rel='stylesheet' type='text/css'>
<link href='http://fonts.googleapis.com/css?family=Source+Code+Pro' rel='stylesheet' type='text/css'>-->
<script type="text/javascript" src="jquery-1.10.2.min.js"></script>
<script src="shared.js"></script>
<script src="admin.js"></script>
<link rel="stylesheet" href="admin.css" tyle="text/css" />

</head>
<body>
	<div class="wrapper">
	<?php include("dashboard.php"); ?>
		<h2>Dashboard Admin Area</h2>
		<div id="tabPicker">
        	<div class="tab" id="pickData">Data</div>
            <div class="tab" id="pickStructure">Structure</div>
        </div>
		<div class="clearFix"></div>
       	<div id="dataTab" class="tabBody">
        	<div id="dataTableOuterWrap">
            	<div id="dataTableScroll">
                    <div id="dataTableWrapper">
                        <table id="dataTable">
                            <thead>
                            	<tr><th>State</th>
                                <?php 
                             	foreach ($columnsArr as $column) : ?> 
                                	<th class="title" colspan="3" <?php 
									foreach ($column as $attrName=>$attr) {
										if (!in_array($attrName,array("shortName","longName","Order")) && !empty($attr)) : ?>data-<?php echo $attrName;?>="<?php echo $attr;?>"<?php endif;
									} ?>><?php echo $column["shortName"]; ?></th>
                                <?php endforeach; ?>
                           	 	</tr><tr><th>&nbsp;</th>
                             	<?php foreach ($columnsArr as $column) : ?>
                                	<th class = "actual" data-id="<?php echo $column["id"];?>">Actual</th>
                                	<th class = "display" data-id="<?php echo $column["id"]; ?>">Display</th>
                                	<th class = "override" data-id="<?php echo $column["id"]; ?>">Override</th>
                            	<?php endforeach; ?>
								</tr>                            
							</thead>
                            <tbody>
                            
                            <?php 
                            foreach ($statesArr as $name=>$state) : ?>
                               <tr class="state" data-state="<?php echo $name; ?>"><td><?php echo $name;?></td>
                                <?php foreach ($columnsArr as $column) : ?>
                                    <?php $key = $name . "_" . $column["id"]; ?>
                                    <td class = "actual" data-id="<?php echo $column["id"];?>"><input type="text" id="input_actual_<?php echo $column["id"];?>" value="<?php echo addcslashes($dataArr[$key]["sort_data"],'"');?>" /></td>
                                    <td class = "display" data-id="<?php echo $column["id"];?>"></td>
                                    <td class = "override" data-id="<?php echo $column["id"];?>"><input type="text" id="input_override_<?php echo $column["id"]?>" value="<?php echo addcslashes($dataArr[$key]["override_data"],'"');?>" /></td>
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
                        <option selected value="<?php echo $column["id"]; ?>"><?php echo $column["shortName"]; ?></option>
                    <?php endforeach; ?>
                </select>
                <button id="saveData">Save Data</button>
                <div id="responseFromServer">
                
                </div><!--end responseFromServer-->
            </div><!--end columnPicker-->
        </div><!--end dataTab-->
        <div id="structureTab" class="tabBody">
        	<div id="structureTableWrapper">
            	<table id="structureTable">
                	<thead>
						<tr>
                        	<td>ID</td>
                            <td>Long Name</td>
                            <td>Short Name</td>
                            <td>Data Mode</td>
                            <td>Round To</td>
                            <td>Prepend</td>
                            <td>Append</td>
                            <td>Tab</td>
                        </tr>
                	</thead>
                    <tbody>
						<?php foreach ($columnsArr as $column): ?>
                        <tr>	
                            <td> <?php echo $column["id"]; ?></td>
                            <td> <?php echo $column["longName"]; ?></td>
                            <td> <?php echo $column["shortName"]; ?></td>
                            <td> <?php echo $column["mode"]; ?></td>
                            <td> <?php echo $column["roundTo"]; ?></td>
                            <td> <?php echo $column["prepend"]; ?></td>
                            <td> <?php echo $column["append"]; ?></td>
                            <td> <?php echo $column["tabAssoc"]; ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                    
                </table>
            </div>
        </div><!--end structureTab-->
	</div><!--end wrapper-->
</body>