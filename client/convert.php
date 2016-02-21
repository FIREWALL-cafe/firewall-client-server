<?php

$queries = array();
$fh = fopen('sensitive.csv', 'r');
$headings = fgetcsv($fh);
while ($row = fgetcsv($fh)) {
	$query = $row[0];
	$query = mb_strtolower($query);
	$query = trim($query);
	$query = preg_replace('/\s+/', ' ', $query);
	if (empty($queries[$query])) {
		$queries[] = array(
			'label' => "$query ({$row[1]})",
			'value' => $query
		);
	}
}
//print_r($queries);
$json = json_encode($queries, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_PARTIAL_OUTPUT_ON_ERROR);
file_put_contents('sensitive.js', "var sensitiveQueries = $json;\n");

?>
