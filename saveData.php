<?php

if (isset($_POST["data"])) {

	$theData = $_POST["data"];
	
	$query = "	UPDATE data SET \n";
	
	$query .= "`sort_data` = CASE \n";
	foreach ($theData as $change) {
		$toChange = $change["address"][0]. "_" . $change["address"][1];
		$theChange = empty($change["actual"]) ? "NULL" : "'".$change["actual"]."'";
		$query .= "WHEN `key` = '" .$toChange . "' THEN " . $theChange . " \n";
		echo "<p>Changing " . $toChange . " actual data to: <br /> ". $theChange."</p>";
	}
	$query.= "ELSE `sort_data` END, ";
	
	$query .= "`override_data` = CASE ";
	foreach ($theData as $change) {
		$toChange = $change["address"][0]. "_" . $change["address"][1];
		$theChange = empty($change["override"]) ? "NULL" : "'".$change["override"]."'";
		$query .= "WHEN `key` = '" . $toChange . "' THEN " . $theChange . " \n";
		echo "<p>Changing " . $toChange . " text override data to: <br /> ". $theChange ."</p>";
	}
	$query.= "ELSE `override_data` END";			
	
	include("config.php");
	
	$mysqli = new mysqli(DB_SERVER,DB_USER,DB_PASSWORD,DB_DATABASE);
	
	$result = $mysqli->query($query);
	
	$mysqli->close();
	
	echo "<p>Changes saved.</p>";
	echo "<p>".$query."</p>";

} else {
	echo "<p>No changes recorded</p>";	
}

?>