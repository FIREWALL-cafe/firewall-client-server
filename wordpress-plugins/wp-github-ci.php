<?php
/*
Plugin Name: wp-github-ci
Plugin URI: https://github.com/dphiffer/wp-github-ci/
Author: Dan Phiffer
Author URI: https://phiffer.org/
License: GPLv2 or later
*/

function wpghci_update() {

	// GitHub will hit us with POST
	//
	// Payload URL
	// https://example.com/wp-admin/admin-ajax.php?action=wpghci_update
	//
	// Content type
	// application/x-www-form-urlencoded
	//
	// Secret
	// (not used)
	//
	// [x] Just the push event
	// [x] Active
	//
	// More info
	// https://developer.github.com/webhooks/

	// These are just hardcoded for now
	$cwd = '/home/firewallcafe/stag_src';
	$log = '/home/firewallcafe/github.log';

	if (empty($_POST['payload'])) {
		echo 'No payload found.';
		exit;
	}

	ignore_user_abort(true);
	$payload = stripslashes($_POST['payload']);
	$payload = json_decode($payload);

	// which branch was committed?
	$branch = 'unknown';

	if (! empty($payload->ref)) {
		$branch = substr($payload->ref, strrpos($payload->ref, '/') + 1);
	}

	// only pull if we are on the same branch
	$curr_branch = wpghci_current_branch($cwd);
	if ($branch != $curr_branch) {
		echo "Wrong branch. ($payload->ref / $branch vs $curr_branch)";
		exit;
	}
	
	// pull from $branch
	$cmd = sprintf('git pull origin %s', $branch);
	$result = wpghci_call($cmd, $cwd);
	$output = '';
	// append commits
	foreach ($payload->commits as $commit) {
		$output .= "{$commit->author->name} ({$commit->author->username})\n";
		foreach (array('added', 'modified', 'removed') as $action) {
			if (count($commit->{$action})) {
				$output .= sprintf('%s: %s; ', $action, implode(',', $commit->{$action}));
			}
		}
		$output .= PHP_EOL;
		$output .= sprintf('because: %s', $commit->message);
		$output .= PHP_EOL;
		$output .= $commit->url;
		$output .= PHP_EOL;
	}
	// append git result
	$output .= PHP_EOL;
	$output .= $result;
	// Log the output
	$fh = fopen($log, 'a');
	fwrite($fh, $output);
	// All done here
	die($output);
}

add_action( 'wp_ajax_nopriv_wpghci_update', 'wpghci_update' );
add_action( 'wp_ajax_wpghci_update', 'wpghci_update' );

function wpghci_current_branch($cwd) {
	$result = wpghci_call('git branch', $cwd);
	if (preg_match('/\\* (.*)/', $result, $matches)) {
		return $matches[1];
	}
	return 'master';
}

function wpghci_call($cmd, $cwd) {
	$descriptorspec = array(
		1 => array('pipe', 'w'), // stdout is a pipe that the child will write to
		2 => array('pipe', 'w')  // stderr
	);
	$resource = proc_open($cmd, $descriptorspec, $pipes, $cwd);
	if (is_resource($resource)) {
		$output = stream_get_contents($pipes[2]);
		$output .= PHP_EOL;
		$output .= stream_get_contents($pipes[1]);
		$output .= PHP_EOL;
		fclose($pipes[1]);
		fclose($pipes[2]);
		proc_close($resource);
		return $output;
	}
}
