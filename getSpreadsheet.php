<?php

require_once('phpexcel/Classes/PHPExcel.php');

// Create new PHPExcel object
$objPHPExcel = new PHPExcel();

// Set document properties
$objPHPExcel->getProperties()->setCreator("State Priorities Partnership")
							 ->setLastModifiedBy("State Priorities Partnership")
							 ->setTitle("Dashboard Data")
							 ->setSubject("Dashboard Data")
							 ->setDescription("Dashboard Data")
							 ->setKeywords("Dashboard Data")
							 ->setCategory("fiscal");
							 
require_once("config.php");

$mysqli = new mysqli(DB_SERVER,DB_USER,DB_PASSWORD,DB_DATABASE);
$mysqli->set_charset("utf8");

$columnIDsSQL = $mysqli->query("SELECT * FROM column_ids");

while ($row = $columnIDsSQL->fetch_array(MYSQLI_ASSOC)) {
	$columnIDs[$row["column_key"]] = $row["column_id"];
};

$columnsSQL = $mysqli->query("SELECT * FROM columns");
while ($row = $columnsSQL->fetch_array(MYSQLI_ASSOC)) {
	$columnsObj[$columnIDs[$row["column_key"]]] = $row;
};

$statesSQL = $mysqli->query("SELECT * FROM statenames");
while ($row = $statesSQL->fetch_array(MYSQLI_ASSOC)) {
	$statesObj[$row["id"]] = $row["states"];
};

$dataSQL = $mysqli->query("SELECT `unique_key`,`sort_data`,`override_data` FROM data");
while ($row = $dataSQL->fetch_array(MYSQLI_ASSOC)) {
	$dataObj[$row["unique_key"]] = $row;
};

$tabsSQL = $mysqli->query("SELECT * FROM tabs");
while ($row = $tabsSQL->fetch_array(MYSQLI_ASSOC)) {
	$tabNames[$row["tab_id"]] = $row["title"];
};

$yearsSQL = $mysqli->query("SELECT `year`,`column_key` FROM column_years");
$yearsObj = array();
while ($row = $yearsSQL->fetch_array(MYSQLI_ASSOC)) {
	if (!array_key_exists($row["column_key"],$yearsObj)) {
		$yearsObj[$row["column_key"]] = array();
	}
	array_push($yearsObj[$row["column_key"]],$row["year"]);
};

uasort($columnsObj, function($a,$b) {
	if ($a["tabAssoc"] != $b["tabAssoc"]) {
		return $a["tabAssoc"] - $b["tabAssoc"];
	} else {
		return $a["columnOrder"] - $b["columnOrder"];
	}
});

$tabsObj = array();
$columnObjByTab = array();
foreach ($columnsObj as $key=>$column) {
	$tabsObj[$column["tabAssoc"]] = $column["column_key"];
	$columnsObjByTab[$column["tabAssoc"]][$key] = $column;
}

//http://stackoverflow.com/questions/10909598/merging-cells-in-excel-by-rows-and-columns-together-using-phpexcel
function cellsToMergeByColsRow($start = -1, $end = -1, $row = -1){
    $merge = 'A1:A1';
    if($start>=0 && $end>=0 && $row>=0){
        $start = PHPExcel_Cell::stringFromColumnIndex($start);
        $end = PHPExcel_Cell::stringFromColumnIndex($end);
        $merge = "$start{$row}:$end{$row}";
    }
    return $merge;
}

$excelTabIndex = 0;
foreach ($tabsObj as $tabIndex=>$tab) {
	$row = 1;
	$col = 2;
	$currentColObj = $columnsObjByTab[$tabIndex];
	$objPHPExcel->setActiveSheetIndex($excelTabIndex);
	$objPHPExcel->getActiveSheet()->setTitle($tabNames[$tabIndex]);
	foreach ($currentColObj as $key=>$column) {
		if (array_key_exists($column["column_key"],$yearsObj)) {
			$numYears = count($yearsObj[$column["column_key"]]);
			$objPHPExcel->getActiveSheet()->mergeCells(cellsToMergeByColsRow($col,$col+1+2*($numYears-1),$row));
			$objPHPExcel->getActiveSheet()->setCellValueByColumnAndRow($col,$row,$key);
			$col=$col+2*$numYears;
		} else {
			$objPHPExcel->getActiveSheet()->mergeCells(cellsToMergeByColsRow($col,$col+1,$row));
			$objPHPExcel->getActiveSheet()->setCellValueByColumnAndRow($col,$row,$key);
			$col=$col+2;
		}
		$objPHPExcel->getActiveSheet()->getStyle(PHPExcel_Cell::stringFromColumnIndex($col) . $row)->getAlignment()->applyFromArray(
			array('horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_CENTER,)
		);
	}
	
	$row = $row + 2;
	$col=2;
	
	foreach ($currentColObj as $key=>$column) {
		if (array_key_exists($column["column_key"],$yearsObj)) {
			$numYears = count($yearsObj[$column["column_key"]]);
			foreach ($yearsObj[$column["column_key"]] as $year) {
				$objPHPExcel->getActiveSheet()->setCellValueByColumnAndRow($col,$row-1,"Actual");
				$objPHPExcel->getActiveSheet()->setCellValueByColumnAndRow($col+1,$row-1,"Override");
				$objPHPExcel->getActiveSheet()->mergeCells(cellsToMergeByColsRow($col,$col+1,$row));
				$objPHPExcel->getActiveSheet()->setCellValueByColumnAndRow($col,$row,$year);
				$objPHPExcel->getActiveSheet()->getStyle(PHPExcel_Cell::stringFromColumnIndex($col) . $row)->getAlignment()->applyFromArray(
					array('horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_CENTER,)
				);
				$col = $col+2;
			}
		} else {
			$objPHPExcel->getActiveSheet()->setCellValueByColumnAndRow($col,$row-1,"Actual");
			$objPHPExcel->getActiveSheet()->setCellValueByColumnAndRow($col+1,$row-1,"Override");
			$col=$col+2;
		}
		$finalCol = $col-1;
	}
	$finalColString = PHPExcel_Cell::stringFromColumnIndex($finalCol);
	
	$row++;
	$col=0;
	
	$writeData = function($data_key) {
		global $objPHPExcel, $col,$row,$dataObj;
		$objPHPExcel->getActiveSheet()->setCellValueByColumnAndRow($col,$row,$dataObj[$data_key]["sort_data"]);
		$col++;
		$objPHPExcel->getActiveSheet()->getStyle(PHPExcel_Cell::stringFromColumnIndex($col) . $row)->getNumberFormat()->setFormatCode( PHPExcel_Style_NumberFormat::FORMAT_TEXT );
		$objPHPExcel->getActiveSheet()->setCellValueByColumnAndRow($col,$row,$dataObj[$data_key]["override_data"]);
		$col++;
	};
	
	foreach ($statesObj as $stateCode => $state) {
		$objPHPExcel->getActiveSheet()->setCellValueByColumnAndRow($col,$row,$stateCode);
		$col++;
		$objPHPExcel->getActiveSheet()->setCellValueByColumnAndRow($col,$row,$state);
		$col++;
		foreach ($currentColObj as $key=>$column) {
			if (array_key_exists($column["column_key"],$yearsObj)) {
				foreach ($yearsObj[$column["column_key"]] as $year) {
					$writeData($stateCode . $column["column_key"] . "_" . $year);
				}
			} else {
				$writeData($stateCode . $column["column_key"] . "_0");
			}
		}
		$finalRow = $row;
		$row++;
		$col=0;
	}
	
	$protectStringTop = 'A1:'.$finalColString. '3';
	$protectStringLeft = 'A1:B'.$finalRow;
	$unprotectString = "C4:".$finalColString . $finalRow;
	$objPHPExcel->getActiveSheet()->protectCells($protectStringTop, 'whatiamdoingwillnotwork');
	$objPHPExcel->getActiveSheet()->getStyle($protectStringTop)->getFont()->getColor()->setRGB('888888');
	$objPHPExcel->getActiveSheet()->protectCells($protectStringLeft, 'whatiamdoingwillnotwork');
	$objPHPExcel->getActiveSheet()->getStyle($protectStringLeft)->getFont()->getColor()->setRGB('888888');
	$objPHPExcel->getActiveSheet()->getStyle($unprotectString)->getProtection()->setLocked(PHPExcel_Style_Protection::PROTECTION_UNPROTECTED);
	$objPHPExcel->getActiveSheet()->getProtection()->setSheet(true);
	if ($excelTabIndex < count($tabsObj)-1) {
		$objPHPExcel->createSheet();
	}
	$excelTabIndex++;
}

// Set active sheet index to the first sheet, so Excel opens this as the first sheet
$objPHPExcel->setActiveSheetIndex(0);


// Redirect output to a client's web browser (Excel2007)
header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header('Content-Disposition: attachment;filename="test.xlsx"');
header('Cache-Control: max-age=0');

$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel2007');
$objWriter->save('php://output');




?>