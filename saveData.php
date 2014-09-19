<?php

if (isset($_POST["data"])) {

	$theData = $_POST["data"];
	
	if (array_key_exists("order",$theData)) {
		$theOrder = array_flip($theData["order"]);
	}
	
	include("config.php");
	
	$mysqli = new mysqli(DB_SERVER,DB_USER,DB_PASSWORD,DB_DATABASE);
	
	$column_id_result = $mysqli->query("SELECT * FROM column_ids");
	while ($row = mysqli_fetch_assoc($column_id_result)) {
		$columnRef[$row["column_key"]] = $row["column_id"];
		$columnIDRef[$row["column_id"]] = $row["column_key"];
	};
	
	if ($theData["mode"]=="data") {
	
		$query = "	UPDATE data SET \n";
		
		$query .= "`sort_data` = CASE \n";
		foreach ($theData["changes"] as $change) {
			$year = 0;
			if (isset($change["address"][2])) $year = $change["address"][2];
			$toChange = $change["address"][0] . $columnIDRef[$change["address"][1]] . "_" . $year;
			$theChange = empty($change["actual"]) ? "NULL" : "'".$change["actual"]."'";
			$query .= "WHEN `unique_key` = '" .$toChange . "' THEN " . $theChange . " \n";
			echo "<p>Changing " . $toChange . " actual data to: <br /> ". $theChange."</p>";
		}
		$query.= "ELSE `sort_data` END, ";
		
		$query .= "`override_data` = CASE ";
		foreach ($theData["changes"] as $change) {
			$toChange = $change["address"][0]. $columnIDRef[$change["address"][1]] . "_" . $year;
			$theChange = empty($change["override"]) ? "NULL" : "'".$change["override"]."'";
			$query .= "WHEN `unique_key` = '" . $toChange . "' THEN " . $theChange . " \n";
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
			$additionsQueryID = "INSERT INTO column_ids \nVALUES ";
			function addToQuery($theString) {
				global $mysqli;
				if (empty($theString)) {
					return "NULL";
				} else {
					return "\"" . mysqli_real_escape_string($mysqli,$theString) . "\"";
				}
			};
			for ($i = 0;$i<count($theAdditions);$i++) {
				$additionsMax = $mysqli->query("SELECT MAX(column_key) AS MaxID FROM column_ids")->fetch_row();
				$newColumnKey = $additionsMax[0] + 1;
				$thisAddition = $theAdditions[$i];
				
				$columnRef[$newColumnKey] = $thisAddition["colID"];
				$columnIDRef[$thisAddition["colID"]] = $newColumnKey;
				
				$additionsQuery .= ("(" .
					$newColumnKey . ",".
					addToQuery($thisAddition["longName"]) . ",".
					addToQuery($thisAddition["shortName"]) . ",".
					addToQuery($thisAddition["dataModeSelector"]) . "," .
					addToQuery($thisAddition["roundTo"]) . "," .
					addToQuery($thisAddition["prepend"]) . "," . 
					addToQuery($thisAddition["append"]) . "," .
					addToQuery($thisAddition["tabAssoc"]) . "," .
					$theOrder[mysqli_real_escape_string($mysqli,$thisAddition["colID"])] . ")");
				
				if ($i < count($theAdditions) - 1) $additionsQuery .= ",\n";
				
				$additionsQueryID .= ("(" .
					$newColumnKey . "," .
					addToQuery(mysqli_real_escape_string($mysqli,$thisAddition["colID"])) . ")");
					
				if ($i < count($theAdditions) - 1) $additionsQuery .= ",\n";
				
			}			
			echo $additionsQuery;
			echo $additionsQueryID;
			$mysqli->query($additionsQuery);
			$mysqli->query($additionsQueryID);
		}
		
		//Deletions
		if (array_key_exists("deletions",$theData)) {
			$deletions = true;
			$theDeletions = $theData["deletions"];
			$deletionsQuery = "DELETE FROM columns WHERE (";
			$deletionsQueryID = "DELETE FROM columns_id WHERE (";
			$deletionsQueryData = "DELETE FROM data WHERE (";
			for ($i=0;$i<count($theDeletions);$i++) {
				$thisDeletion = $theDeletions[$i];
				$thisDeletionKey = $columnIDRef[$thisDeletion];
				$toAdd = "`column_key` = \"" . mysqli_real_escape_string($mysqli,$thisDeletionKey) . "\"";
				if ($i < count($theDeletions) - 1) $toAdd .= " OR ";
				$deletionsQuery .= $toAdd;
				$deletionsQueryID .= $toAdd;	
				$deletionsQueryData .= $toAdd;
				
			}
			$deletionsQuery .= ")";
			$deletionsQueryID .= ")";
			$deletionsQueryData .= ")";
			
			echo "\n";
			echo $deletionsQuery;
			echo "\n" . $deletionsQueryID;
			$mysqli->query($deletionsQuery);
		}
		
		//Order
		$theOrder = $theData["order"];
		$orderQuery = "UPDATE columns SET `columnOrder` = CASE `column_key`\n";
		for ($i=0;$i<count($theOrder);$i++) {
			$orderQuery .= "WHEN \"" . $columnIDRef[$theOrder[$i]] . "\" THEN \"" . $i . "\"\n"; 
		}
		$orderQuery .= "END";
		
		echo "\n";
		echo $orderQuery;
		$mysqli->query($orderQuery);
		
		//Updates
		if (array_key_exists("changes",$theData)) {
			$deferredChanges = array();
			$structureChanges = function($change) {
				global $columnIDRef, $mysqli;
				if ($change["address"][1]=="colID") {
					$theQuery = "UPDATE column_ids SET `column_id` = \"" . mysqli_real_escape_string($mysqli,$change["change"]) . "\" WHERE `column_key` = " . $columnIDRef[$change["address"][0]];
				} else {
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
				$theQuery = "UPDATE columns SET `" . $nmap[$change["address"][1]] . "` = \"" . mysqli_real_escape_string($mysqli,$change["change"]) . "\" WHERE `column_key` = \"" .  $columnIDRef[$change["address"][0]] . "\"";
				}
				return $theQuery;
			};
			foreach ($theData["changes"] as $change) {
				if ($change["address"][1] == "colID") {
					array_push($deferredChanges,$change);	
				} else {
					
					//Column ID change
					
					$query = $structureChanges($change);
					$mysqli->query($query);
					echo "\n" . $query;
					
				}
			}
			foreach ($deferredChanges as $change) {
				$query = $structureChanges($change);
				$mysqli->query($query);
				echo "\n" .$query;
			}
		}
	}
	
	echo "</pre>";
	
	$mysqli->close();
	
	echo "<p>Changes saved.</p>";

} else {
	echo "<p>No changes recorded</p>";	
}

?>