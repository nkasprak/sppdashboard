<!DOCTYPE html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>SFP Dashboard Wireframe Admin</title>
<!--<link href='http://fonts.googleapis.com/css?family=Source+Sans+Pro:600,700,600italic,700italic' rel='stylesheet' type='text/css'>
<link href='http://fonts.googleapis.com/css?family=Source+Code+Pro' rel='stylesheet' type='text/css'>-->
<script type="text/javascript" src="jquery-1.10.2.min.js"></script>
<script src="shared.js"></script>
<script src="admin.js"></script>
<style>
	body {
		font-family:"Source Sans Pro",Arial,sans-serif;	
		margin:0px;
		padding:0px;
		height:100%;
	}
	
	input[type="text"] {
		font-family:"Source Code Pro",Arial,sans-serif;	
		margin:0px;
		border:0px;
		font-size:11px;
	}
	
	.wrapper {
		position:absolute;
		width:98%;
		height:100%;
		left:1%;
	}
	
	div.clearFix {
		clear:both;	
	}
	
	div#tabPicker .tab {
		float:left;	
		margin:5px;
		
	}
	
	.tabBody {
		top:0px;
		position:absolute;
		padding-top:100px;
		box-sizing:border-box;	
		height:100%;
		width:100%;
		/*padding-right:40px;*/
		padding-bottom:0px;
	}
	
	
	div#dataTab div#columnPicker {
		width:250px;
		position:absolute;
		top:100px;
	}
	
	div#dataTab div#columnPicker select {
		height:600px;	
	}
	
	#dataTableScroll {
		position:relative;
		width:100%;
		overflow:scroll;
		height:100%;;
	}
	
	#dataTableOuterWrap {
		box-sizing:border-box;
		position:relative;
		padding-left:250px;
		width:100%;
		height:100%;
	}
	
	#dataTableWrapper {
		position:relative;
	}
	
	#dataTable {
		border:1px solid #000;
		border-spacing:0px;
		border-collapse:collapse;
		font-family:"Source Code Pro",monospace;
		font-size:12px;
			
	}
	
	#dataTable td, #dataTable th {
		margin:0px;
		border:1px solid #aaa;
	}
	
	#dataTable td.actual, #dataTable th.actual, #dataTable th.title {
		border-left:2px solid #888;	
	}
	
	#dataTable td {
		white-space:nowrap;	
	}
	
</style>

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
                <?php echo "<tr><th>State</th>";
                 foreach ($columnsArr as $column) {
					
					echo "<th class=\"title\" colspan=\"3\" ";
					foreach ($column as $attrName=>$attr) {
						if (!in_array($attrName,array("shortName","longName","Order")) && !empty($attr)) {
							echo "data-" . $attrName . "=\"" . $attr . "\" ";
						}
					} 
					echo ">" . $column["shortName"] . "</th>";
					
				}
				echo "</tr><tr><th>&nbsp;</th>";
				 foreach ($columnsArr as $column) {
					echo "<th class = \"actual\" data-id=\"" . $column["id"] . "\">Actual</th>";
					echo "<th class = \"display\" data-id=\"" . $column["id"] . "\">Display</th>";
					echo "<th class = \"override\" data-id=\"" . $column["id"] . "\">Override</th>";
				}
				echo "</tr>";
				?>
                </thead>
                <tbody>
                
                <?php 
				foreach ($statesArr as $name=>$state) {
					echo "<tr class='state' data-state=\"" . $name . "\"><td>".$name."</td>";
					foreach ($columnsArr as $column) {
						$key = $name . "_" . $column["id"];
						echo "<td class = \"actual\" data-id=\"" . $column["id"] . "\"><input type=\"text\" id=\"input_actual_" .$column["id"]."\" value=\"". addcslashes($dataArr[$key]["sort_data"],'"') . "\"/></td>";	
						echo "<td class = \"display\" data-id=\"" . $column["id"] . "\"></td>";		
						echo "<td class = \"override\" data-id=\"" . $column["id"] . "\"><input type=\"text\" id=\"input_override_" .$column["id"]."\" value=\"". addcslashes($dataArr[$key]["override_data"],'"') . "\"/></td>";	
					}
					echo "</tr>";
				}?>
                </tbody>
            </table>
            </div>
            </div>

            </div>
            <div id="columnPicker">
            <p>Show columns:</p>
            <select multiple>
    			<?php foreach ($columnsArr as $column) {
					echo "<option selected value=\"" . $column["id"] . "\">" . $column["shortName"] . "</option>";
				} ?>
            </select>
            <button id="saveData">Save Data</button>
            <div id="responseFromServer">
            
            </div>
            </div>
        </div>
	</div>
</body>