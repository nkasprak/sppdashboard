<?php

$tabIndex = $_GET["tabIndex"];
include("config.php"); 
include("dashboard.php"); //Pulls data from database and organizes it into associative arrays 
$sD = new stateDashboard();
$sD->buildTable($tabIndex);

?>