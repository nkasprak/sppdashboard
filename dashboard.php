<?php include("config.php"); ?>
<?php 

date_default_timezone_set('America/New_York');

$mysqli = new mysqli(DB_SERVER,DB_USER,DB_PASSWORD,DB_DATABASE);
$mysqli->set_charset("utf8");

$statesQuery = "SELECT * FROM statenames";
$columnsQuery = "SELECT * FROM columns ORDER BY `Order`";
$dataQuery = "SELECT * FROM data";

$statesResult = $mysqli->query($statesQuery);
$columnsResult = $mysqli->query($columnsQuery);
$dataResult = $mysqli->query($dataQuery);

$statesArr = array();
$columnsArr = array();
$tabsArr = array();


$dataArr = array();

while ($row = $statesResult->fetch_array(MYSQLI_ASSOC)) {
	$statesArr[$row["id"]] = $row["states"];	
}

while ($row = $columnsResult->fetch_array(MYSQLI_ASSOC)) {
	$columnsArr[$row["id"]] = $row;	
	array_push($tabsArr,$row["tabAssoc"]);
}


/*Sorts columns by tab first, then order within tab second*/
uasort($columnsArr, function($a,$b) {
	if ($a["tabAssoc"] == $b["tabAssoc"]) return $a["Order"] - $b["Order"];
	else return $a["tabAssoc"] - $b["tabAssoc"];
});



$lowTab = min($tabsArr);
$highTab = max($tabsArr);

while ($row = $dataResult->fetch_array(MYSQLI_ASSOC)) {
	$dataArr[$row["key"]] = $row;	
}



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