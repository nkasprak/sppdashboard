<!doctype html>
<head>
<title>Uploading spreadsheet...</title>
</head>
<body>

<p>
<?php

require_once("../config.php");
$mysqli = new mysqli(DB_SERVER,DB_USER,DB_PASSWORD,DB_DATABASE);
$mysqli->set_charset("utf8");

$colKeySQL = $mysqli->query("SELECT * FROM column_ids");
$colIDToColKey = array();
while ($row = $colKeySQL->fetch_array(MYSQLI_ASSOC)) {
	$colIDtoColKey[$row["column_id"]] = $row["column_key"];
};

$inputFile = $_FILES["uFile"]["tmp_name"];
require_once('../phpexcel/Classes/PHPExcel.php');


$inputFileType = PHPExcel_IOFactory::identify($inputFile);
$objReader = PHPExcel_IOFactory::createReader($inputFileType);
$objPHPExcel = $objReader->load($inputFile);
$objPHPExcel->setActiveSheetIndex(0);
$mode = $objPHPExcel->getActiveSheet()->getCellByColumnAndRow(0,1)->getValue() === "State = " ? "state" : "all";

if ($mode === "all") {
	
	
	
	$numSheets = $objPHPExcel->getSheetCount();
	$changes = array();
	
	for ($sheetIndex = 0;$sheetIndex<$numSheets;$sheetIndex++) {
		
		$colIDToColIndex = array();
		$colIndexToColID = array();
		$stateIDToRowIndex = array();
		$rowIndexToStateID = array();
		$colIDToYearArr = array();
		
		$objPHPExcel->setActiveSheetIndex($sheetIndex);
		$row=1;
		$col=2;
		
		$currentVal = $objPHPExcel->getActiveSheet()->getCellByColumnAndRow($col,$row)->getValue();
		
		//a bit of a hack, but non left-most parts of merged cells are considered empty, so this looks at the
		//"actual"/"override" labels instead
		$inRangeCheck = $objPHPExcel->getActiveSheet()->getCellByColumnAndRow($col,$row+1)->getValue(); 
		while (!empty($inRangeCheck)) {
			$currentYear = $objPHPExcel->getActiveSheet()->getCellByColumnAndRow($col,$row+2)->getValue();
			if (!empty($currentYear)) {
				if (!array_key_exists($currentVal,$colIDToYearArr)) {
					$colIDToYearArr[$currentVal] = array();	
				}
				array_push($colIDToYearArr[$currentVal],$currentYear);
			}
			if (!array_key_exists($currentVal,$colIDToColIndex)) $colIDToColIndex[$currentVal] = $col;
			if (!array_key_exists($col,$colIndexToColID)) $colIndexToColID[$col] = $currentVal;
			$col = $col+2;
			if ($col > 999) break;
			$nextVal = $objPHPExcel->getActiveSheet()->getCellByColumnAndRow($col,$row)->getValue();
			if (!empty($nextVal)) $currentVal = $nextVal;
			$inRangeCheck = $objPHPExcel->getActiveSheet()->getCellByColumnAndRow($col,$row+1)->getValue(); 	
		}
		$row = 4;
		$col = 0;
		
		$currentVal = $objPHPExcel->getActiveSheet()->getCellByColumnAndRow($col,$row)->getValue();
		while (!empty($currentVal)) {
			$stateIDToRowIndex[$currentVal] = $row;
			$rowIndexToStateID[$row] = $currentVal;
			$row++;
			if ($row > 999) break;
			$currentVal = $objPHPExcel->getActiveSheet()->getCellByColumnAndRow($col,$row)->getValue();	
		};
		
		foreach ($stateIDToRowIndex as $state=>$row) {
			foreach ($colIDToColIndex as $colID=>$col) {
				if (array_key_exists($colID,$colIDToYearArr)) {
					foreach ($colIDToYearArr[$colID] as $offset=>$year) {
						array_push($changes, array(
							$state . $colIDtoColKey[$colID] . "_" . $year,
							$objPHPExcel->getActiveSheet()->getCellByColumnAndRow($col + $offset*2,$row)->getValue(),
							$objPHPExcel->getActiveSheet()->getCellByColumnAndRow($col + $offset*2 + 1,$row)->getValue(),
							$state,
							$year,
							$colIDtoColKey[$colID]
						));	
					}
				} else {
					array_push($changes, array(
						$state . $colIDtoColKey[$colID] . "_0",
						$objPHPExcel->getActiveSheet()->getCellByColumnAndRow($col,$row)->getValue(),
						$objPHPExcel->getActiveSheet()->getCellByColumnAndRow($col+1,$row)->getValue(),
						$state,
						$year,
						$colIDtoColKey[$colID]
					));
				}
			}
		};
	}
	
	$queriesExecuted = 0;
	
	$existing_data_points = array();
	$existing_data_points_result = $mysqli->query("SELECT `unique_key` FROM data");
	while ($row = $existing_data_points_result->fetch_array(MYSQLI_ASSOC)) {
		array_push($existing_data_points,$row['unique_key']);
	}
	
	
	$newQuery = "INSERT INTO data (unique_key,state,year,column_key,sort_data,override_data) VALUES";
	$updateQuery = "";
	
	foreach ($changes as $change) {
		
		$sortData = empty($change[1]) ? "NULL" : '"' . mysqli_real_escape_string($mysqli,$change[1]). '"';
		$overrideData = empty($change[2]) ? "NULL" : '"' . mysqli_real_escape_string($mysqli,$change[2]). '"';
		$key = mysqli_real_escape_string($mysqli,$change[0]);
		if (!array_key_exists($key,$existing_data_points)) {
			$newQuery .= "('" . $key . "','" . mysqli_real_escape_string($mysqli, $change[3]) . "','" . mysqli_real_escape_string($mysqli, $change[4]) . "','" . mysqli_real_escape_string($mysqli, $change[5]) . "',".$sortData.",".$overrideData."),";
		}
		//$updateQuery = "UPDATE data SET `sort_data` = " .$sortData . ", `override_data` = ".$overrideData . " WHERE `unique_key` = \"".$key . "\"";
		//echo $updateQuery . "<br />";
		$queriesExecuted++;
		//$mysqli->query($updateQuery);
		if ($queriesExecuted%100==0) {
			echo "Updated " . $queriesExecuted . " records...<br />";
			flush();
		}
	}
	
	$newQuery = rtrim($newQuery,",");
	$newQuery .= " ON DUPLICATE KEY UPDATE sort_data=VALUES(sort_data), override_data=VALUES(override_data)";
	
	
	$mysqli->query($newQuery);
	
	echo "Done<br><a href='admin.php'>Back to admin area</a></p>";

} else {
	$state = $objPHPExcel->getActiveSheet()->getCellByColumnAndRow(1,1)->getValue();
	$yearsFromCol = array();
	$dataSeries = array();
	
	class simpleReader {
		private $sheet;
		function simpleReader($sheet) {
			$this->sheet = $sheet;
		}
		private $row = 1;
		private $col = 0;
		public function rd() {
			return $this->sheet->getCellByColumnAndRow($this->col,$this->row)->getValue();
		}
		public function gC() {
			return $this->col;	
		}
		public function gR() {
			return $this->row;	
		}
		public function nL() {
			$this->col = 0;
			$this->row++;		
		}
		public function sC($c) {
			$this->col = $c;	
		}
		public function sR($r) {
			$this->row = $r;	
		}
		public function r() {
			$i = func_get_args();
			if (count($i) > 0) $this->col += $i[0];
			else $this->col++;	
		}
		public function d() {
			$i = func_get_args();
			if (count($i) > 0) $this->row += $i[0];
			else $this->row++;	
		}
	}
	
	$r = new simpleReader($objPHPExcel->getActiveSheet());
	$r->sR(2);
	$r->sC(5);
	$currentCellVal = $r->rd();
	while ($currentCellVal) {
		$yearsFromCol[$r->gC()] = $r->rd();
		$r->r();
		$currentCellVal = $r->rd();
	}
	$r->nL();
	$currentCellVal = $r->rd();
	while (!empty($currentCellVal)) {
		$r->r(2);
		$seriesName = $r->rd();
		$dataSeries[$seriesName] = array();
		$r->r(2);
		$dataSeries[$seriesName]["No Year"] = array();
		$dataSeries[$seriesName]["No Year"]["actual"] = $r->rd();	
		$r->d();
		$dataSeries[$seriesName]["No Year"]["override"] = $r->rd();
		$r->d(-1);
		foreach ($yearsFromCol as $year) {
			$r->r();
			$dataSeries[$seriesName][$year] = array();
			$dataSeries[$seriesName][$year]["actual"] = $r->rd();	
			$r->d();
			$dataSeries[$seriesName][$year]["override"] = $r->rd();
			$r->d(-1);	
		}
		$r->nl();
		$r->nl();
		$currentCellVal = $r->rd();
	}
	
	//print_r($dataSeries);
	$queriesExecuted = 0;
	foreach ($dataSeries as $seriesName=>$series) {
		
		foreach ($series as $year=>$data) {
		
			if ($year === "No Year") $year = 0;
			$key = $state . $colIDtoColKey[$seriesName] . "_" . $year;
			$roleList = array("unique_key"=>$key,"state"=>$state,"year"=>$year,"column_key"=>$colIDtoColKey[$seriesName],"sort_data"=>$data["actual"],"override_data"=>$data["override"]);
			$newQuery = "INSERT INTO data (";
			foreach ($roleList as $roleName=>$roleData) {
				$newQuery .= $roleName . ",";	
			}
			$newQuery = rtrim($newQuery,",");
			$newQuery .= ") VALUES (";
			foreach ($roleList as $roleName=>$roleData) {
				$newQuery .= "'".mysqli_real_escape_string($mysqli,$roleData) . "',";	
			}
			$newQuery = rtrim($newQuery,",");
			$newQuery .= ") ON DUPLICATE KEY UPDATE ";
			foreach ($roleList as $roleName=>$roleData) {
				if ($roleName !== "unique_key" && !empty($roleData)) {
					$newQuery .= "`" . $roleName . "`='".mysqli_real_escape_string($mysqli,$roleData) . "', ";
				}
			}
			$newQuery = rtrim($newQuery,", ");
			if (!empty($data["actual"]) || !empty($data["override"])) {
				$mysqli->query($newQuery);
				$queriesExecuted++;
				if ($queriesExecuted%10==0) {
					echo "Updated " . $queriesExecuted . " records...<br />";
					flush();
				}
			}
			
	
			
		}
		
	}
	echo "Done<br>";
	echo "<a href='admin.php'>Back to admin area</a></p>";
}

$mysqli->close();
?>

</p>