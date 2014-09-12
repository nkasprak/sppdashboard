<?php include("config.php"); 

$mysqli = new mysqli(DB_SERVER,DB_USER,DB_PASSWORD,DB_DATABASE);
$mysqli->set_charset("utf8");

$statesQuery = "SELECT * FROM statenames";
$columnsQuery = "SELECT * FROM columns ORDER BY `columnOrder`";
$dataQuery = "SELECT * FROM data";
$tabsQuery = "SELECT * FROM tabs";
$columnIDQuery = "SELECT * FROM column_ids";

$statesResult = $mysqli->query($statesQuery);
$columnsResult = $mysqli->query($columnsQuery);
$columnsIDResult = $mysqli->query($columnIDQuery);
$dataResult = $mysqli->query($dataQuery);
$tabsResult = $mysqli->query($tabsQuery);

$mysqli->close();

/*Will fill these with results from query*/
$statesArr = array();
$columnsArr = array();
$tabsArr = array();
$dataArr = array();

$tabBounds = array();

/*Fill arrays with query results*/
while ($row = $statesResult->fetch_array(MYSQLI_ASSOC)) {
	$statesArr[$row["id"]] = $row["states"];	
}

while ($row = $dataResult->fetch_array(MYSQLI_ASSOC)) {
	$dataArr[$row["unique_key"]] = $row;	
}

while ($row = $columnsIDResult->fetch_array(MYSQLI_ASSOC)) {
	$columnIDArr[$row["column_key"]] = $row["column_id"];
}

while ($row = $columnsResult->fetch_array(MYSQLI_ASSOC)) {
	$columnsArr[$columnIDArr[$row["column_key"]]] = $row;
	$columnsArr[$columnIDArr[$row["column_key"]]]["column_key"] = $row["column_key"];
}

while ($row = $tabsResult->fetch_array(MYSQLI_ASSOC)) {
	$tabsArr[$row["tab_id"]] = $row;	
	array_push($tabBounds,$row["tab_id"]); /*Will use to keep track of max/min tabs ids*/
}

/*Used to figure out how many tab links to put out*/
$lowTab = min($tabBounds);
$highTab = max($tabBounds);


/*Sorts columns by tab first, then order within tab second*/
uasort($columnsArr, function($a,$b) {
	if ($a["tabAssoc"] == $b["tabAssoc"]) return $a["columnOrder"] - $b["columnOrder"];
	else return $a["tabAssoc"] - $b["tabAssoc"];
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
?>