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
	
	$objPHPExcel->setActiveSheetIndex($sheetIndex);
	$row=1;
	$col=2;
	
	$currentVal = $objPHPExcel->getActiveSheet()->getCellByColumnAndRow($col,$row)->getValue();
	while (!empty($currentVal)) {
		$colIDToColIndex[$currentVal] = $col;
		$colIndexToColID[$col] = $currentVal;
		$col = $col+2;
		if ($col > 999) break;
		$currentVal = $objPHPExcel->getActiveSheet()->getCellByColumnAndRow($col,$row)->getValue();	
	}
	
	$row = 3;
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
			array_push($changes, array(
				$state . $colIDtoColKey[$colID],
				$objPHPExcel->getActiveSheet()->getCellByColumnAndRow($col,$row)->getValue(),
				$objPHPExcel->getActiveSheet()->getCellByColumnAndRow($col+1,$row)->getValue()
			));
		}
	};
}

$queriesExecuted = 0;

foreach ($changes as $change) {
	$sortData = empty(mysqli_real_escape_string($mysqli,$change[1])) ? "NULL" : '"' . mysqli_real_escape_string($mysqli,$change[1]). '"';
	$overrideData = empty(mysqli_real_escape_string($mysqli,$change[2])) ? "NULL" : '"' . mysqli_real_escape_string($mysqli,$change[2]). '"';
	$key = mysqli_real_escape_string($mysqli,$change[0]);
	$updateQuery = "UPDATE data SET `sort_data` = ".$sortData . ", `override_data` = ".$overrideData . " WHERE `unique_key` = ".$key;
	echo $updateQuery . "<br />";
	$queriesExecuted++;
	//$mysqli->query($updateQuery);
	if ($queriesExecuted%100==0) {
		echo "Updated " . $queriesExecuted . " records...<br />";
		flush();
	}
}

echo "Done</p>";

$mysqli->close();
?>

</p>