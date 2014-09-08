<?php

if (isset($_POST["data"])) {

	$theData = $_POST["data"];
	
	include("config.php");
	
	$mysqli = new mysqli(DB_SERVER,DB_USER,DB_PASSWORD,DB_DATABASE);
	
	//print_r($theData["mode"]);
	
	if ($theData["mode"]=="data") {
	
		$query = "	UPDATE data SET \n";
		
		$query .= "`sort_data` = CASE \n";
		foreach ($theData["changes"] as $change) {
			$toChange = $change["address"][0]. "_" . $change["address"][1];
			$theChange = empty($change["actual"]) ? "NULL" : "'".$change["actual"]."'";
			$query .= "WHEN `key` = '" .$toChange . "' THEN " . $theChange . " \n";
			echo "<p>Changing " . $toChange . " actual data to: <br /> ". $theChange."</p>";
		}
		$query.= "ELSE `sort_data` END, ";
		
		$query .= "`override_data` = CASE ";
		foreach ($theData["changes"] as $change) {
			$toChange = $change["address"][0]. "_" . $change["address"][1];
			$theChange = empty($change["override"]) ? "NULL" : "'".$change["override"]."'";
			$query .= "WHEN `key` = '" . $toChange . "' THEN " . $theChange . " \n";
			echo "<p>Changing " . $toChange . " text override data to: <br /> ". $theChange ."</p>";
		}
		$query.= "ELSE `override_data` END";	
		
		$mysqli->query($query);
		
	} else {
		
		echo "<pre>";
		print_r($theData);
		
		
		//Additions
		if (array_key_exists("additions",$theData)) {
			$additions = true;
			$theAdditions = $theData["additions"];
			$additionsQuery = "INSERT INTO columns \nVALUES ";
			function addToQuery($theString) {
				global $mysqli;
				if (empty($theString)) {
					return "NULL";
				} else {
					return "\"" . mysqli_real_escape_string($mysqli,$theString) . "\"";
				}
			};
			for ($i = 0;$i<count($theAdditions);$i++) {
				$thisAddition = $theAdditions[$i];
				$additionsQuery .= ("(" .
					addToQuery($thisAddition["colID"]) . ",".
					addToQuery($thisAddition["longName"]) . ",".
					addToQuery($thisAddition["shortName"]) . ",".
					addToQuery($thisAddition["dataModeSelector"]) . "," .
					addToQuery($thisAddition["roundTo"]) . "," .
					addToQuery($thisAddition["prepend"]) . "," . 
					addToQuery($thisAddition["append"]) . ")");
				
				if ($i < count($theAdditions) - 1) $additionsQuery .= ",\n";
			}			
			echo $additionsQuery;
			$mysqli->query($additionsQuery);
		}
		
		//Deletions
		if (array_key_exists("deletions",$theData)) {
			$deletions = true;
			$theDeletions = $theData["deletions"];
			$deletionsQuery = "DELETE FROM columns WHERE (";
			for ($i=0;$i<count($theDeletions);$i++) {
				$thisDeletion = $theDeletions[$i];
				$deletionsQuery .= "`id` = \"" . mysqli_real_escape_string($mysqli,$thisDeletion) . "\"";
				 if ($i < count($theDeletions) - 1) $deletionsQuery .= " OR ";	
			}
			$deletionsQuery .= ")";
			
			echo "\n";
			echo $deletionsQuery;
			$mysqli->query($deletionsQuery);
		}
		
		//Order
		$theOrder = $theData["order"];
		$orderQuery = "UPDATE columns SET `columnOrder` = CASE `id`\n";
		for ($i=0;$i<count($theOrder);$i++) {
			$orderQuery .= "WHEN \"" .  mysqli_real_escape_string($mysqli,$theOrder[$i]) . "\" THEN \"" . $i . "\"\n"; 
		}
		$orderQuery .= "END";
		
		echo "\n";
		echo $orderQuery;
		$mysqli->query($orderQuery);
		
		//Updates
		if (array_key_exists("changes",$theData)) {
			$deferredChanges = array();
			$structureChanges = function($change) {
				$nmap = array(
					"colID" => "id",
					"longName" => "longName",
					"shortName" => "shortName",
					"dataModeSelector" => "mode",
					"roundTo" => "roundTo",
					"prepend"=>"prepend",
					"append"=>"append",
					"tabAssoc"=>"tabAssoc"
				);
				$theQuery = "UPDATE columns SET `" . $nmap[$change["address"][1]] . "` = \"" . $change["change"] . "\" WHERE `id` = \"" . $change["address"][0] . "\"";
				return $theQuery;
			};
			foreach ($theData["changes"] as $change) {
				if ($change["address"][1] == "colID") {
					array_push($deferredChanges,$change);	
				} else {
					
					//Column ID change
					
					$query = $structureChanges($change);
					//$mysqli->query($query);
					
				}
			}
			foreach ($deferredChanges as $change) {
				$query = $structureChanges($change);
				$mysqli->query($query);	
				
				//Update data to refer to new address	
				
				$newQuery = "SELECT `key`,`state`,`column_id` FROM data WHERE `column_id` = \"" . $change["address"][0] . "\"";
				
				$dataToBeAltered = $mysqli->query($newQuery);
				while ($toChange = $dataToBeAltered->fetch_array(MYSQLI_ASSOC)) {
					$newQuery = "UPDATE data SET `key` = \"" . $toChange["state"] . "_" . $change["change"] . "\" WHERE `state` = \"" . $toChange["state"] . "\" AND `column_id` = \"" . $toChange["column_id"]. "\"";
					echo "\n" . $newQuery;
					$mysqli->query($newQuery);
				}
				
				$dataQuery = "UPDATE data SET `column_id` = \"" .$change["change"] . "\" WHERE `column_id` = \"" . $change["address"][0] . "\"";
				echo "\n" . $dataQuery;
				$mysqli->query($dataQuery);
				
			}
		}
	}
	
	echo "</pre>";
	
	//$result = $mysqli->query($query);
	
	$mysqli->close();
	
	echo "<p>Changes saved.</p>";
	echo "<p>".$query."</p>";

} else {
	echo "<p>No changes recorded</p>";	
}

?>