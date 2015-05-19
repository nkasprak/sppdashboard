<?php

if (isset($_POST["data"])) {

	$theData = $_POST["data"];
	
	if (array_key_exists("order",$theData)) {
		$theOrder = array_flip($theData["order"]);
	}
	
	include("config.php");
	
	$mysqli = new mysqli(DB_SERVER,DB_USER,DB_PASSWORD,DB_DATABASE);
	function myes($string) {
		global $mysqli;
		return mysqli_real_escape_string($mysqli,$string);	
	}
	
	$column_id_result = $mysqli->query("SELECT * FROM column_ids");
	while ($row = mysqli_fetch_assoc($column_id_result)) {
		$columnRef[$row["column_key"]] = $row["column_id"];
		$columnIDRef[$row["column_id"]] = $row["column_key"];
	};
	
	
	
	if ($theData["mode"]=="data") {
		
		//new data query
		$newDataQuery = "INSERT INTO data VALUES ";
	
		//update data query
		$query = "	UPDATE data SET \n";
		
		$query .= "`sort_data` = CASE \n";
		$useUpdate = false;
		$useInsert = false;
		for ($i = 0;$i<count($theData["changes"]);$i++) {
			$change = $theData["changes"][$i];
			$year = 0;
			if (isset($change["address"][2])) $year = $change["address"][2];
			$toChange = $change["address"][0] . $columnIDRef[$change["address"][1]] . "_" . $year;
			$theChange = is_null($change["actual"]) ? "NULL" : "'".myes($change["actual"])."'";
			$dataExists = mysqli_num_rows($mysqli->query("SELECT `unique_key` FROM data WHERE `unique_key` = \"" . $toChange . "\""));
			if ($dataExists > 0) {
				$useUpdate = true;
				$query .= "WHEN `unique_key` = '" .$toChange . "' THEN " . $theChange . " \n";
				echo "<p>Changing " . $toChange . " actual data to: <br /> ". $theChange."</p>";
			} else {
				$useInsert = true;
				$overrideChange = empty($change["override"]) ? "NULL" : "'".$change["override"]."'";
				$newDataQuery .= "(\"" . $toChange . "\",\"" . 
					$change["address"][0] . "\",\"" .
					$year . "\",\"" .
					$change["address"][1] . "\"," .
					$theChange . "," . 
					$overrideChange . ")";
				if ($i < count($theData["changes"]) - 1) $newDataQuery .= ", ";
			}
		}
		$query.= "ELSE `sort_data` END, ";
		
		$query .= "`override_data` = CASE ";
		for ($i = 0;$i<count($theData["changes"]);$i++) {
			$change = $theData["changes"][$i];
			$year = 0;
			if (isset($change["address"][2])) $year = $change["address"][2];
			$toChange = $change["address"][0]. $columnIDRef[$change["address"][1]] . "_" . $year;
			$theChange = empty($change["override"]) ? "NULL" : "'".myes($change["override"])."'";
			$query .= "WHEN `unique_key` = '" . $toChange . "' THEN " . $theChange . " \n";
			echo "<p>Changing " . $toChange . " text override data to: <br /> ". $theChange ."</p>";
		}
		$query.= "ELSE `override_data` END";	
		
		if ($useUpdate == true) {
			echo $query;
			$mysqli->query($query);
		}
		if ($useInsert == true) {
			echo $newDataQuery;
			$mysqli->query($newDataQuery);
		}
		
	} else if ($theData["mode"] == "tabs") {
		$mysqli->query("TRUNCATE tabs");
		$insertQuery = "INSERT INTO tabs VALUES ";
		$tabs = $theData["data"];
		for ($i  = 0;$i<count($tabs);$i++) {
			$tabs[$i]["tabName"] = preg_replace('/[^a-zA-Z0-9 ]/','',$tabs[$i]["tabName"]);
			$tabs[$i]["tabName"] = substr($tabs[$i]["tabName"],0,31);
			$insertQuery .= "('" . mysqli_real_escape_string($mysqli, $tabs[$i]["tabID"]) . "', ";
			$insertQuery .= "'" . mysqli_real_escape_string($mysqli, $tabs[$i]["tabName"]) . "', ";
			$insertQuery .= "'" . mysqli_real_escape_string($mysqli, $tabs[$i]["order"]) . "'),";
		}
		$insertQuery = rtrim($insertQuery, ",");
		
		$mysqli->query($insertQuery);
		
	} else {
		
		echo "<pre>";
		print_r($theData);
	
		//Additions
		if (array_key_exists("additions",$theData)) {
			$additions = true;
			$theAdditions = $theData["additions"];
			
			
			print_r($theAdditions);
			
			/*check to make sure they don't exist*/
			for ($i = 0;$i<count($theAdditions);$i++) {
				$checkQuery = "SELECT * FROM column_ids WHERE column_id = '".$theAdditions[$i]["colID"] . "'";
				$check = $mysqli->query($checkQuery);
				if (mysqli_num_rows($check) > 0) {
					unset($theAdditions[$i]);
					$theAdditions = array_values($theAdditions);
				}
			}
			
			print_r($theAdditions);
			
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
				if ($i === 0) {
					$additionsMax = $mysqli->query("SELECT MAX(column_key) AS MaxID FROM column_ids")->fetch_row();
					$newColumnKey = $additionsMax[0] + 1;
				} else {
					$newColumnKey++;	
				}
				$thisAddition = $theAdditions[$i];
				
				$columnRef[$newColumnKey] = $thisAddition["colID"];
				$columnIDRef[$thisAddition["colID"]] = $newColumnKey;
				$columnIDRef[$thisAddition["orgcolid"]] = $newColumnKey;
				
				$additionsQuery .= ("(" .
					$newColumnKey . ",".
					addToQuery($thisAddition["longName"]) . ",".
					addToQuery($thisAddition["shortName"]) . ",".
					addToQuery($thisAddition["dataModeSelector"]) . "," .
					addToQuery($thisAddition["roundTo"]) . "," .
					addToQuery($thisAddition["prepend"]) . "," . 
					addToQuery($thisAddition["append"]) . "," .
					addToQuery($thisAddition["tabAssoc"]) . "," .
					$theOrder[myes($thisAddition["colID"])] . ")");
				
				if ($i < count($theAdditions) - 1) $additionsQuery .= ",\n";
				
				$additionsQueryID .= ("(" .
					$newColumnKey . "," .
					addToQuery(myes($thisAddition["colID"])) . ")");
					
				if ($i < count($theAdditions) - 1) $additionsQueryID .= ",\n";
				
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
				$toAdd = "`column_key` = \"" . myes($thisDeletionKey) . "\"";
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
		
		//Year additions
		if (array_key_exists("yearAdds",$theData)) {
			$yearAdds = $theData["yearAdds"];
			$yearAddsQuery = "INSERT INTO column_years VALUES ";
			$yearAddsByColKey = array();
			for ($i=0;$i<count($yearAdds);$i++) {
				$colKey = $columnIDRef[$yearAdds[$i][0]];
				$yearAddsQuery .= "(\"" . (myes($colKey)*10000 + myes($yearAdds[$i][1])) . "\",\"" . myes($yearAdds[$i][1])  . "\",\"" . myes($colKey) . "\")";
				if ($i < count($yearAdds)-1) $yearAddsQuery .= ", ";
				if (!array_key_exists($colKey,$yearAddsByColKey)) {
					$yearAddsByColKey[$colKey] = array();
				} 
				array_push($yearAddsByColKey[$colKey],$yearAdds[$i][1]);
				
			}
			echo $yearAddsQuery;
			
			print_r($yearAddsByColKey);
			foreach ($yearAddsByColKey as $colKey=>$yearList) {
				sort($yearList, SORT_NUMERIC);
				echo "for colkey: ";
				echo $colKey;
				$prevYearCount = mysqli_num_rows($mysqli->query("SELECT * FROM column_years WHERE `column_key` = " . myes($colKey)));
				echo "prevYearCount: " . $prevYearCount;
				if ($prevYearCount == 0) {
					//Converting non-time series data to time-series data - existing data becomes associated with latest year being added
					$year = $yearList[count($yearList)-1];
					$dataToAlter = $mysqli->query("SELECT `state` FROM data WHERE `column_key` = \"" .myes($colKey). "\" AND `year` = \"0\"");
					 while ($row = $dataToAlter->fetch_array(MYSQLI_ASSOC)) {
						$yearDataUpdateQuery = "UPDATE data SET `unique_key` = \"" . 
							($row["state"] . myes($colKey) . "_" . myes($year)) . "\"" . 
							", `year` = \"".myes($year)."\" WHERE (`year` = \"0\"
								AND `state` = \"" . myes($row["state"]) . 
							"\" AND `column_key` = \"" . myes($colKey) . "\")";
						echo $yearDataUpdateQuery . "\n"; 
						$mysqli->query($yearDataUpdateQuery);
					 }
				}
			}
			$mysqli->query($yearAddsQuery);
		}
		
		//Year deletions
		if (array_key_exists("yearDels",$theData)) {
			$yearDels = $theData["yearDels"];
			$yearDelsQuery = "DELETE FROM column_years WHERE (";
			$yearDelsByColKey = array();
			for ($i=0;$i<count($yearDels);$i++) {
				$colKey = $columnIDRef[$yearDels[$i][0]];
				if (!array_key_exists($colKey,$yearDelsByColKey)) {
					$yearDelsByColKey[$colKey] = array();
				} 
				array_push($yearDelsByColKey[$colKey],$yearDels[$i][1]);	
				$yearDelsQuery .= "`id` = \"" . myes($colKey*10000 + $yearDels[$i][1]) . "\"";
				if ($i < count($yearDels)-1) $yearDelsQuery .= " OR ";
			}
			$yearDelsQuery .= ")";
			echo $yearDelsQuery;
			$mysqli->query($yearDelsQuery);
			
			foreach ($yearDelsByColKey as $colKey=>$yearList) {
				$remainingYearCount = mysqli_num_rows($mysqli->query("SELECT * FROM column_years WHERE `column_key` = " . myes($colKey)));
				echo $remainingYearCount;
				if ($remainingYearCount > 0) {
					//Delete data
					foreach ($yearList as $year) {
						$yearDataDeleteQuery = "DELETE FROM data WHERE `column_key` = \"" . myes($colKey) . "\" AND `year` = \"" . myes($year) . "\"";
						echo $yearDataDeleteQuery;
						$mysqli->query($yearDataDeleteQuery);
					}
				} else {
					//Convert remaining data to non-year-specific data	
					sort($yearList, SORT_NUMERIC);
					echo "sortedYearList";
					print_r($yearList);
					for ($i=0;$i<count($yearList);$i++) {
						$year = $yearList[$i];
						if ($i == count($yearList) - 1) {
							//Latest year - keep this data
							$dataToAlter = $mysqli->query("SELECT `state` FROM data WHERE `column_key` = \"" .myes($colKey). "\" AND `year` = \"" . myes($year) . "\"");
							 while ($row = $dataToAlter->fetch_array(MYSQLI_ASSOC)) {
								$yearDataUpdateQuery = "UPDATE data SET `unique_key` = \"" . 
									(myes($row["state"]) . myes($colKey) . "_0") . "\"" . 
									", `year` = \"0\" WHERE (`year` = \"" . myes($year) . 
									"\" AND `state` = \"" . myes($row["state"]) . 
									"\" AND `column_key` = \"" . myes($colKey) . "\")";
								echo $yearDataUpdateQuery . "\n"; 
								$mysqli->query($yearDataUpdateQuery);
							 }
						} else {
							//Earlier years - discard
							$yearDataDeleteQuery = "DELETE FROM data WHERE `column_key` = \"" . myes($colKey) . "\" AND `year` = \"" . myes($year) . "\"";
							echo $yearDataDeleteQuery;
							$mysqli->query($yearDataDeleteQuery);
						}
					}
				}
			}
		}
		
		//Order
		$theOrder = $theData["order"];
		$orderQuery = "UPDATE columns SET `columnOrder` = CASE `column_key`\n";
		for ($i=0;$i<count($theOrder);$i++) {
			$orderQuery .= "WHEN \"" . myes($columnIDRef[$theOrder[$i]]) . "\" THEN \"" . $i . "\"\n"; 
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
					$theQuery = "UPDATE column_ids SET `column_id` = \"" . myes($change["change"]) . "\" WHERE `column_key` = " . myes($columnIDRef[$change["address"][0]]);
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
				$theQuery = "UPDATE columns SET `" . myes($nmap[$change["address"][1]]) . "` = \"" . myes($change["change"]) . "\" WHERE `column_key` = \"" .  myes($columnIDRef[$change["address"][0]]) . "\"";
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
		
		//Resolve tabs
		$tabResult = $mysqli->query("SELECT tab_id, tab_order FROM tabs");
		$tabIDs = array();
		$tabOrders = array();
		while ($row = mysqli_fetch_assoc($tabResult)) {
			array_push($tabIDs,$row["tab_id"]);
			array_push($tabOrders, $row["tab_order"]);
		}
		$maxOrder = max($tabOrders);
		
		$usedTabs = $mysqli->query("SELECT tabAssoc FROM columns");
		$newTabs = array();
		while ($row = mysqli_fetch_assoc($usedTabs)) {
			if (!in_array($row["tabAssoc"], $tabIDs) && !in_array($row["tabAssoc"], $newTabs)) {
				array_push($newTabs, $row["tabAssoc"]);
			}
		}
		
		if (count($newTabs) > 0) {
			for ($i=0;$i<count($newTabs);$i++) {
				$query = "INSERT INTO tabs VALUES(" .$newTabs[$i] . ",'newTab".$newTabs[$i]."'," . ($maxOrder + 1) . ")";
				echo $query;
				$mysqli->query($query); 	
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