<?php

$mysqli = new mysqli(DB_SERVER,DB_USER,DB_PASSWORD,DB_DATABASE);
$mysqli->set_charset("utf8");

/*Will fill these with results from query*/
$statesArr = array();
$columnsArr = array();
$tabsArr = array();
$dataArr = array();
$yearsArr = array();
$tabBounds = array();

/*Do initial queries and fill arrays with query results*/
$statesResult = $mysqli->query("SELECT * FROM statenames");
while ($row = $statesResult->fetch_array(MYSQLI_ASSOC)) {
	$statesArr[$row["id"]] = $row["states"];	
}

$columnsIDResult = $mysqli->query("SELECT * FROM column_ids");
while ($row = $columnsIDResult->fetch_array(MYSQLI_ASSOC)) {
	$columnIDArr[$row["column_key"]] = $row["column_id"];
}

$columnsResult = $mysqli->query("SELECT * FROM columns ORDER BY `columnOrder`");
while ($row = $columnsResult->fetch_array(MYSQLI_ASSOC)) {
	$columnsArr[$columnIDArr[$row["column_key"]]] = $row;
	$columnsArr[$columnIDArr[$row["column_key"]]]["column_key"] = $row["column_key"];
}

$tabsResult = $mysqli->query("SELECT * FROM tabs ORDER BY `tab_order`");
$tabRevOrder = array();
while ($row = $tabsResult->fetch_array(MYSQLI_ASSOC)) {
	$tabsArr[$row["tab_order"]] = $row;	
	array_push($tabBounds,$row["tab_id"]); /*Will use to keep track of max/min tabs ids*/
	$tabRevOrder[$row["tab_id"]] = $row["tab_order"];
}

$yearsResult = $mysqli->query("SELECT * FROM column_years");
while ($row = $yearsResult->fetch_array(MYSQLI_ASSOC)) {
	if (!array_key_exists($row["column_key"],$yearsArr)) {
		$yearsArr[$row["column_key"]] = array();
	} 
	array_push($yearsArr[$row["column_key"]],$row["year"]);
}

/*Initial data return is most recent year only*/
foreach ($columnIDArr as $key=>$id) {
	$dataQuery = "SELECT * FROM data WHERE column_key = \"" . $key . "\"";
	if (array_key_exists($key,$yearsArr)) {
		$dataQuery .= " AND `year` = \"" . max($yearsArr[$key]) . "\"";
	}
	$dataResult[$key] = $mysqli->query($dataQuery);
	while ($row = $dataResult[$key]->fetch_array(MYSQLI_ASSOC)) {
		$dataArr[$row["unique_key"]] = $row;	
	}
}

$mysqli->close();

/*Used to figure out how many tab links to put out*/
$lowTab = min($tabBounds);
$highTab = max($tabBounds);


/*Sorts columns by tab first, then order within tab second*/
uasort($columnsArr, function($a,$b) {
	global $tabRevOrder;
	if ($a["tabAssoc"] == $b["tabAssoc"]) return $a["columnOrder"] - $b["columnOrder"];
	else return $tabRevOrder[$a["tabAssoc"]] - $tabRevOrder[$b["tabAssoc"]];
});

/*Used in various places to output column <option> elements into selectors*/
function colMenuOps($tab) {
	global $columnsArr, $columnIDArr;
	$currentTab = 1;
	foreach ($columnsArr as $id=>$column) {
		if (isset($tab)) {
			if ($column["tabAssoc"] == $tab) {
				echo '<option value="'.$columnIDArr[$column["column_key"]].'">'.$column['shortName']."</option>\n";
			}
		} else {
			if ($column["tabAssoc"] != $currentTab) echo '<option value="0" disabled>---</option>\n';
			$currentTab = $column["tabAssoc"];
			echo '<option value="'.$columnIDArr[$column["column_key"]].'">'.$column['shortName']."</option>\n";
		}
	}
}

/*Used to output a year selection input for columns with multiple years defined*/
function yearSelector($colKey) {
	global $yearsArr;
	$toReturn = "";
	if (array_key_exists($colKey,$yearsArr)) {
		$toReturn .= "<select data-colkey=\"" . $colKey . "\">";
		$maxYear = max($yearsArr[$colKey]);
		for ($i=0;$i<count($yearsArr[$colKey]);$i++) {
			$year = $yearsArr[$colKey][$i];
			$toReturn .= "<option value=\"" . $year . "\"" . ($year == $maxYear ? " selected" : "") . ">" . $year . "</option>";
		}
		$toReturn .= "</select>";
	}
	return $toReturn;
}
?>