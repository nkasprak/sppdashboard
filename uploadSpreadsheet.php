<!doctype html>
<head>
<title>Uploading spreadsheet...</title>
</head>
<body>

<p>
<?php

$inputFile = $_FILES["uFile"]["tmp_name"];
require_once('phpexcel/Classes/PHPExcel.php');


$inputFileType = PHPExcel_IOFactory::identify($inputFile);
$objReader = PHPExcel_IOFactory::createReader($inputFileType);
$objPHPExcel = $objReader->load($inputFile);



require_once("config.php");

$mysqli = new mysqli(DB_SERVER,DB_USER,DB_PASSWORD,DB_DATABASE);
$mysqli->set_charset("utf8");

$colKeySQL = $mysqli->query("SELECT * FROM column_ids");

$colIDToColKey = array();
while ($row = $colKeySQL->fetch_array(MYSQLI_ASSOC)) {
	$colIDtoColKey[$row["column_id"]] = $row["column_key"];
};

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
						$objPHPExcel->getActiveSheet()->getCellByColumnAndRow($col + $offset*2 + 1,$row)->getValue()
					));	
				}
			} else {
				array_push($changes, array(
					$state . $colIDtoColKey[$colID] . "_0",
					$objPHPExcel->getActiveSheet()->getCellByColumnAndRow($col,$row)->getValue(),
					$objPHPExcel->getActiveSheet()->getCellByColumnAndRow($col+1,$row)->getValue()
				));
			}
		}
	};
}

$queriesExecuted = 0;

foreach ($changes as $change) {
	$sortData = empty(mysqli_real_escape_string($mysqli,$change[1])) ? "NULL" : '"' . mysqli_real_escape_string($mysqli,$change[1]). '"';
	$overrideData = empty(mysqli_real_escape_string($mysqli,$change[2])) ? "NULL" : '"' . mysqli_real_escape_string($mysqli,$change[2]). '"';
	$key = mysqli_real_escape_string($mysqli,$change[0]);
	$updateQuery = "UPDATE data SET `sort_data` = ".mysqli_real_escape_string($mysqli,$sortData) . ", `override_data` = ".mysqli_real_escape_string($mysqli,$overrideData) . " WHERE `unique_key` = \"".mysqli_real_escape_string($mysqli,$key) . "\"";
	echo $updateQuery . "<br />";
	$queriesExecuted++;
	$mysqli->query($updateQuery);
	if ($queriesExecuted%100==0) {
		echo "Updated " . $queriesExecuted . " records...<br />";
		flush();
	}
}

echo "Done</p>";

$mysqli->close();
?>

</p>