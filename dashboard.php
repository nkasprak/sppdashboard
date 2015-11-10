<?php


class stateDashboard {
	
	/*Used in various places to output column <option> elements into selectors*/
	public function colMenuOps($tab) {
		$currentTab = 1;
		foreach ($this->columnsArr as $id=>$column) {
			if (isset($tab)) {
				if ($column["tabAssoc"] == $tab) {
					echo '<option value="'.$this->columnIDArr[$column["column_key"]].'">'.$column['shortName']."</option>\n";
				}
			} else {
				if ($column["tabAssoc"] != $currentTab) echo '<option value="0" disabled>---</option>\n';
				$currentTab = $column["tabAssoc"];
				echo '<option value="'.$this->columnIDArr[$column["column_key"]].'">'.$column['shortName']."</option>\n";
			}
		}
	}
	
	/*Used to output a year selection input for columns with multiple years defined*/
	public function yearSelector($colKey) {
		$toReturn = "";
		if (array_key_exists($colKey,$this->yearsArr)) {
			$toReturn .= "<select data-colkey=\"" . $colKey . "\">";
			$maxYear = max($this->yearsArr[$colKey]);
			for ($i=0;$i<count($this->yearsArr[$colKey]);$i++) {
				$year = $this->yearsArr[$colKey][$i];
				$toReturn .= "<option value=\"" . $year . "\"" . ($year == $maxYear ? " selected" : "") . ">" . $year . "</option>";
			}
			$toReturn .= "</select>";
		}
		return $toReturn;
	}
	
	public function buildTable($tabIndex) { ?>
		<table cellspacing="0" cellpadding="0">
	<thead class="dummySort">
		<tr>
			<?php  
			
			/*The table sorting is a bit funky because I'm using three separate tables instead of one.
			The tablesorter plugin requires each column to have a <th>, which is a problem since the
			click-to-sort function is on the separate top table. So I have these dummy <th>s below which
			don't do anything and aren't visible, just to make tablesorter happy.*/
			foreach ($this->columnsArr as $cid=>$column) {
				if ($column['tabAssoc'] == $tabIndex) echo "<th class='empty-bottom'>&nbsp;</th>";
			}
			?>
		</tr>
	</thead>
	<tbody>
	<?php
	
	/*Build the main table*/
	$initialSortTracker = 0;
	foreach ($this->statesArr as $sid=>$state) {
		
		/*As with the left table, each row's class contains the two letter state abbreviation*/
		echo "<tr class=\"".$sid."\" data-initialSort=\"".$initialSortTracker."\">\n";
		$initialSortTracker++;
		foreach ($this->columnsArr as $cid=>$column) {
			
			/*Check if column is associated with current tab*/
			if ($column['tabAssoc'] == $tabIndex) {
				
				/*Build the lookup key (this is how the main data table references things - state_column 
				- for example, CA_sfai_proj*/
				
				if (array_key_exists($column["column_key"],$this->yearsArr)) {
					$key_app = "_" . max($this->yearsArr[$column["column_key"]]);
				} else $key_app = "_0";
				
				$key = $sid . $column["column_key"] . $key_app;
				
				$data["display_data"] = "";
				$data["override_data"] = "";
				$data["sort_data"] = null;
				
				if (array_key_exists($key,$this->dataArr)) {
					/*Data exists*/
					/*Get the data point*/
					$data = $this->dataArr[$key];
					
					/*Default case*/
					$data["display_data"] = $data["sort_data"];
					
					/*If it's a date, it'll be stored as days into the year, so convert that
					to displayable data and store the numeric data in the (hidden) sortdata
					<span>*/
					if ($column["mode"] == "date" && !empty($data["sort_data"])) {
						$timestamp = ($data["sort_data"])*86400;
						$theDate = date("M j",$timestamp);
						$data["display_data"] = $theDate;
					}
					
					/*If it's numeric, there are a few options for formatting the number
					(prepend, append, rounding, etc.) Output the formatted number and
					also the raw number as hidden sortdata*/
					if ($column["mode"] == "numeric" && is_numeric($data["sort_data"])) {
						if (is_numeric($column["roundTo"])) $data["display_data"] = round($data["sort_data"],$column["roundTo"]);
						if (!empty($column["prepend"])) {
							if ($data["sort_data"] < 0) {
								$data["display_data"] = "-" . $column["prepend"] . abs($data["display_data"]);	
							} else {
								$data["display_data"] = $column["prepend"] . abs($data["display_data"]);
							}
						}
						if (!empty($column["append"])) {
							$data["display_data"] .= $column["append"];	
						}
					}
					
					//if (!empty($data["override_data"])) $data["display_data"] = $data["override_data"];
				} /*else {
					/*Data does not exist*/
					//$data["display_data"] = "";
					//$data["override_data"] = "";
					//$data["sort_data"] = "";	
				//}
				
				/*Write the table cell (with class of the column id)*/
				echo '<td class="'.$cid.'"' . ($column["mode"] == "numeric" ? ' align="right"' : "") . '>';
				echo '<span class="display">' . $data["display_data"] ."</span>". (is_null($data["sort_data"]) ? "" : "<span class='sortData'>".$data["sort_data"]."</span>" );
				if (!empty($data["override_data"])) echo "<div class='note'><div class='noteButton'><a href='#'>*</a></div><div class='noteData'>" . $data["override_data"] . "</div></div>";
				if ($column["mode"]=="numeric" && array_key_exists($column["column_key"],$this->yearsArr) && $data["display_data"] != "") {
					echo " <div class='lineChartButton'></div>";
				};
				echo "</td>\n";
			}
		}
		echo "</tr>\n";
	}	
   ?>
   </tbody>
   <tfoot>
   <?php
   
   /*Write the footer*/
   $fArr = array("Median", "Average", "High", "Low");
   for ($fArrI = 0;$fArrI < count($fArr);$fArrI++) {
		echo '<tr class="row_'. strtolower($fArr[$fArrI]) . '">'."\n";
		foreach ($this->columnsArr as $cid=>$column) {
			if ($column['tabAssoc'] == $tabIndex) echo '<td class="'.$cid.'"'. ($column["mode"] == "numeric" ? ' align="right"' : "").'><span class="sortData"></span><span class="display"></span></td>';	
		}
		echo "\n</tr>\n";
   }
   ?>
   </tfoot>
	</table>
    <?php	}	

	function stateDashboard() {
		$this->mysqli = new mysqli(DB_SERVER,DB_USER,DB_PASSWORD,DB_DATABASE);
		$this->mysqli->set_charset("utf8");
		
		/*Will fill these with results from query*/
		$this->statesArr = array();
		$this->columnsArr = array();
		$this->tabsArr = array();
		$this->dataArr = array();
		$this->yearsArr = array();
		$this->tabBounds = array();
		$this->tabRevOrder = array();
		$this->columnIDArr = array();
		
		/*Do initial queries and fill arrays with query results*/
		$statesResult = $this->mysqli->query("SELECT * FROM statenames");
		while ($row = $statesResult->fetch_array(MYSQLI_ASSOC)) {
			$this->statesArr[$row["id"]] = $row["states"];	
		}
		
		$columnsIDResult = $this->mysqli->query("SELECT * FROM column_ids");
		while ($row = $columnsIDResult->fetch_array(MYSQLI_ASSOC)) {
			$this->columnIDArr[$row["column_key"]] = $row["column_id"];
		}
		
		$columnsResult = $this->mysqli->query("SELECT * FROM columns ORDER BY `columnOrder`");
		while ($row = $columnsResult->fetch_array(MYSQLI_ASSOC)) {
			$this->columnsArr[$this->columnIDArr[$row["column_key"]]] = $row;
			$this->columnsArr[$this->columnIDArr[$row["column_key"]]]["column_key"] = $row["column_key"];
		}
		
		$tabsResult = $this->mysqli->query("SELECT * FROM tabs ORDER BY `tab_order`");
		
		$order = 0;
		while ($row = $tabsResult->fetch_array(MYSQLI_ASSOC)) {
			$this->tabsArr[$order] = $row;	
			array_push($this->tabBounds,$row["tab_id"]); /*Will use to keep track of max/min tabs ids*/
			$this->tabRevOrder[$row["tab_id"]] = $order;
			$order++;
		}
		
		$yearsResult = $this->mysqli->query("SELECT * FROM column_years");
		while ($row = $yearsResult->fetch_array(MYSQLI_ASSOC)) {
			if (!array_key_exists($row["column_key"],$this->yearsArr)) {
				$this->yearsArr[$row["column_key"]] = array();
			} 
			array_push($this->yearsArr[$row["column_key"]],$row["year"]);
		}
		
		/*Initial data return is most recent year only*/
		$dataResult = array();
		foreach ($this->columnIDArr as $key=>$id) {
			$dataQuery = "SELECT * FROM data WHERE column_key = \"" . $key . "\"";
			if (array_key_exists($key,$this->yearsArr)) {
				$dataQuery .= " AND `year` = \"" . max($this->yearsArr[$key]) . "\"";
			}
			$dataResult[$key] = $this->mysqli->query($dataQuery);
			while ($row = $dataResult[$key]->fetch_array(MYSQLI_ASSOC)) {
				$this->dataArr[$row["unique_key"]] = $row;	
			}
		}
		
		$this->mysqli->close();
		
		/*Used to figure out how many tab links to put out*/
		$this->lowTab = min($this->tabBounds);
		$this->highTab = max($this->tabBounds);
		
		/*Sorts columns by tab first, then order within tab second*/
		uasort($this->columnsArr, function($a,$b) {
			if ($a["tabAssoc"] == $b["tabAssoc"]) {
				return $a["columnOrder"] - $b["columnOrder"];
			} else if (isset($this->tabRevOrder[$a["tabAssoc"]]) && isset($this->tabRevOrder[$b["tabAssoc"]])) {
				return $this->tabRevOrder[$a["tabAssoc"]] - $this->tabRevOrder[$b["tabAssoc"]];
			} else {
				return 0;	
			}
		});
	
	}
	
	

}
?>