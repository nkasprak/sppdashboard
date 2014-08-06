<?php

$theData = $_POST["data"];

$query = "	UPDATE data SET \n";

$query .= "`sort_data` = CASE \n";
foreach ($theData as $change) {
	print_r($change["address"]);
	$query .= "WHEN `state` = '" . $change["address"][0]. "' THEN '" . $change["actual"] . "' \n";
}
$query.= "ELSE `sort_data` END, ";

$query .= "`override_data` = CASE ";
foreach ($theData as $change) {
	$query .= "WHEN `state` = '" . $change["address"][0]. "' THEN '" . $change["override"] . "' \n";
}
$query.= "ELSE `override_data` END";			

echo $query;

?>