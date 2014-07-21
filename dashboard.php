<?php include("config.php"); 

/*Makes the date conversion consistent between testing and production*/
date_default_timezone_set('America/New_York');

$mysqli = new mysqli(DB_SERVER,DB_USER,DB_PASSWORD,DB_DATABASE);
$mysqli->set_charset("utf8");

$statesQuery = "SELECT * FROM statenames";
$columnsQuery = "SELECT * FROM columns ORDER BY `Order`";
$dataQuery = "SELECT * FROM data";
$tabsQuery = "SELECT * FROM tabs";

$statesResult = $mysqli->query($statesQuery);
$columnsResult = $mysqli->query($columnsQuery);
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
	$dataArr[$row["key"]] = $row;	
}

while ($row = $columnsResult->fetch_array(MYSQLI_ASSOC)) {
	$columnsArr[$row["id"]] = $row;	
	
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
	if ($a["tabAssoc"] == $b["tabAssoc"]) return $a["Order"] - $b["Order"];
	else return $a["tabAssoc"] - $b["tabAssoc"];
});

/*Used in various places to output column <option> elements into selectors*/
function colMenuOps($tab) {
	global $columnsArr;
	$currentTab = 1;
	foreach ($columnsArr as $id=>$column) {
		if (isset($tab)) {
			if ($column["tabAssoc"] == $tab) {
				echo '<option value="'.$column["id"].'">'.$column['shortName']."</option>\n";
			}
		} else {
			if ($column["tabAssoc"] != $currentTab) echo '<option value="0" disabled>---</option>\n';
			$currentTab = $column["tabAssoc"];
			echo '<option value="'.$column["id"].'">'.$column['shortName']."</option>\n";
		}
	}
}
?>