<?php
include("config.php"); 

$colkey = $_GET["col"];
$year = $_GET["year"];

$dataQuery = "SELECT `state`,`column_key`,`sort_data`,`override_data` FROM data WHERE column_key = \"" . $colkey . "\" AND year = \"" . $year . "\"";
$mysqli = new mysqli(DB_SERVER,DB_USER,DB_PASSWORD,DB_DATABASE);
$mysqli->set_charset("utf8");

$dataResult = $mysqli->query($dataQuery);


$columnsIDResult = $mysqli->query("SELECT * FROM column_ids WHERE `column_key` = " . $colkey);
while ($row = $columnsIDResult->fetch_array(MYSQLI_ASSOC)) {
	$columnIDArr[$row["column_key"]] = $row["column_id"];
}


$dataArr = Array();
while ($row = $dataResult->fetch_array(MYSQLI_ASSOC)) {
	array_push($dataArr,$row);
}
header('Content-Type: application/json');
$returnObj = Array();
$returnObj["data"] = $dataArr;
$returnObj["colID"] = $columnIDArr[$colkey];
echo json_encode($returnObj);

?>