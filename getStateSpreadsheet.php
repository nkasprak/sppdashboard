<?php

require_once('phpexcel/Classes/PHPExcel.php');
require_once("config.php");


$state = $_GET["state"];

// Create new PHPExcel object
$objPHPExcel = new PHPExcel();


$cacheMethod = PHPExcel_CachedObjectStorageFactory::cache_to_sqlite3;
PHPExcel_Settings::setCacheStorageMethod($cacheMethod);//, $cacheSettings);

// Set document properties
$objPHPExcel->getProperties()->setCreator("State Priorities Partnership")
							 ->setLastModifiedBy("State Priorities Partnership")
							 ->setTitle("Dashboard Data")
							 ->setSubject("Dashboard Data")
							 ->setDescription("Dashboard Data")
							 ->setKeywords("Dashboard Data")
							 ->setCategory("fiscal");
							 


$mysqli = new mysqli(DB_SERVER,DB_USER,DB_PASSWORD,DB_DATABASE);
$mysqli->set_charset("utf8");


$columnIDsSQL = $mysqli->query("SELECT * FROM column_ids");

while ($row = $columnIDsSQL->fetch_array(MYSQLI_ASSOC)) {
	$columnIDs[$row["column_key"]] = $row["column_id"];
};

unset($columnIDsSQL);

$queryCols = "";

$columnsSQL = $mysqli->query("SELECT * FROM columns ORDER BY columnOrder");
while ($row = $columnsSQL->fetch_array(MYSQLI_ASSOC)) {
	$columnsObj[$columnIDs[$row["column_key"]]] = $row;
};
unset($columnsSQL);

$dataSQL = $mysqli->query("SELECT `unique_key`,`sort_data`,`override_data`, `year` FROM data WHERE state='" . mysqli_real_escape_string($mysqli, $state) . "'");
while ($row = $dataSQL->fetch_array(MYSQLI_ASSOC)) {
	$dataObj[$row["unique_key"]] = $row;
};
unset($dataSQL);

$tabsSQL = $mysqli->query("SELECT * FROM tabs");
while ($row = $tabsSQL->fetch_array(MYSQLI_ASSOC)) {
	$tabNames[$row["tab_id"]] = $row["title"];
};
unset($tabsSQL);

$yearsSQL = $mysqli->query("SELECT `year`,`column_key` FROM column_years");
$yearsObj = array();
while ($row = $yearsSQL->fetch_array(MYSQLI_ASSOC)) {
	if (!array_key_exists($row["column_key"],$yearsObj)) {
		$yearsObj[$row["column_key"]] = array();
	}
	array_push($yearsObj[$row["column_key"]],$row["year"]);
};
unset($yearsSQL);

$active_years = array();

foreach ($yearsObj as $col) {
	for ($j=0;$j<count($col);$j++) {
		if (!in_array($col[$j], $active_years)) {
			array_push($active_years, $col[$j]);	
		}
	}
}

sort($active_years, SORT_NUMERIC);

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

class quickWriter {
	private $sheet;
	function quickWriter($sheet) {
		$this->sheet = $sheet;
	}
	private $row = 1;
	private $col = 0;
	public function wr($toWrite) {
		$this->sheet->setCellValueByColumnAndRow($this->col,$this->row,$toWrite);
	}
	public function gC() {
		return $this->col;	
	}
	public function gR() {
		return $this->row;	
	}
	function nL() {
		$this->col = 0;
		$this->row++;		
	}
	function r() {
		$i = func_get_args();
		if (count($i) > 0) $this->col += $i[0];
		else $this->col++;	
	}
	function d() {
		$i = func_get_args();
		if (count($i) > 0) $this->row += $i[0];
		else $this->row++;	
	}
}

$objPHPExcel->setActiveSheetIndex(0);
$objSheet = $objPHPExcel->getActiveSheet();

$w = new quickWriter($objSheet);

$w->wr("State = ");
$w->r();
$w->wr($state);
$w->nL();
$w->wr("Tab");
$w->r();
$w->wr("Data Label");
$w->r();
$w->wr("Column ID");
$w->r();
$w->wr("Data Role");
$w->r();
$w->wr("No Year");
foreach ($active_years as $year) {
	$w->r();
	$w->wr($year);	
}
$w->nL();

foreach ($columnsObj as $id=>$column) {
	$w->wr($tabNames[$column["tabAssoc"]]);
	$w->r();
	$w->wr($column["shortName"]);
	$w->r();
	$w->wr($id);
	$w->r();
	$w->wr("Actual");
	$w->d();
	$w->wr("Text Override");
	$w->d(-1);
	$w->r();
	$key = $state . $column["column_key"] . "_0";
	if (array_key_exists($key, $dataObj)) {
		$data = $dataObj[$key];
		$w->wr($data["sort_data"]);
		$w->d();
		$w->wr($data["override_data"]);
		$w->d(-1);
	}
	$w->r();
	foreach ($active_years as $year) {
		$key = $state . $column["column_key"] . "_" . $year;
		if (array_key_exists($key, $dataObj)) {
			$w->wr($dataObj[$key]["sort_data"]);
			$w->d();
			$w->wr($dataObj[$key]["override_data"]);
			$w->d(-1);
		}
		$w->r();
	}
	$finalColString = PHPExcel_Cell::stringFromColumnIndex($w->gC());
	$w->nl();
	$w->nl();
}


$finalRow = $w->gR();


$protectStringTop = 'A1:'.$finalColString. '2';
$protectStringLeft = 'A1:D'.$finalRow;
$unprotectString = "E4:".$finalColString . $finalRow;
$objSheet->protectCells($protectStringTop, 'whatiamdoingwillnotwork');
$objSheet->getStyle($protectStringTop)->getFont()->getColor()->setRGB('888888');
$objSheet->protectCells($protectStringLeft, 'whatiamdoingwillnotwork');
$objSheet->getStyle($protectStringLeft)->getFont()->getColor()->setRGB('888888');
$objSheet->getStyle($unprotectString)->getProtection()->setLocked(PHPExcel_Style_Protection::PROTECTION_UNPROTECTED);
$objSheet->getProtection()->setSheet(true);


// Redirect output to a client's web browser (Excel2007)
header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header('Content-Disposition: attachment;filename="' . $state . '_sppdata.xlsx"');
header('Cache-Control: max-age=0');

$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel2007');
$objWriter->save('php://output');




?>