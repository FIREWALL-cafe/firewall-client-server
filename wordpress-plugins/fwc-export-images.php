<?php
/*
Plugin Name: Firewall Cafe export images
Plugin URI: https://firewallcafe.com/
Author: Dan Phiffer
Author URI: https://phiffer.org/
License: GPLv2 or later
*/

function fwc_export_images() {
	
	// Heads up, this was written in a hurry!
	// https://localhost:4747/wp-admin/admin-ajax.php?action=fwc_export_images
	// (20170510/dphiffer)
	
	header('Content-Type: text/plain');
	$input = <<<END
paris shooting 
http://firewallcafe.com/wp-admin/post.php?post=147147&action=edit
paris attack
http://firewallcafe.com/wp-admin/post.php?post=145497&action=edit
secret societies
http://firewallcafe.com/wp-admin/post.php?post=146915&action=edit
China is evil
http://firewallcafe.com/wp-admin/post.php?post=146401&action=edit
America is great
http://firewallcafe.com/wp-admin/post.php?post=146221&action=edit
Security
http://firewallcafe.com/wp-admin/post.php?post=145911&action=edit
Muslim beasts
http://firewallcafe.com/wp-admin/post.php?post=145421&action=edit
japanese occupation in china
http://firewallcafe.com/wp-admin/post.php?post=145160&action=edit
famous Americans
http://firewallcafe.com/wp-admin/post.php?post=144608&action=edit
yuri kochiyama david wong
http://firewallcafe.com/wp-admin/post.php?post=144568&action=edit
yuri kochiyama x
http://firewallcafe.com/wp-admin/post.php?post=144546&action=edit
rob yanagida grace lee boggs
http://firewallcafe.com/wp-admin/post.php?post=144470&action=edit
Rosetangy
http://firewallcafe.com/wp-admin/post.php?post=83797&action=edit
South china sea dispute
http://firewallcafe.com/wp-admin/post.php?post=144149&action=edit
Hello
http://firewallcafe.com/wp-admin/post.php?post=123734&action=edit
64 open fire
http://firewallcafe.com/wp-admin/post.php?post=143668&action=edit
sixty-four
http://firewallcafe.com/wp-admin/post.php?post=126656&action=edit
Smog in china
http://firewallcafe.com/wp-admin/post.php?post=53670&action=edit
228 incident
http://firewallcafe.com/wp-admin/post.php?post=143354&action=edit
Free tibet fire
http://firewallcafe.com/wp-admin/post.php?post=143044&action=edit
Feminism
http://firewallcafe.com/wp-admin/post.php?post=265&action=edit
China censorship
http://firewallcafe.com/wp-admin/post.php?post=142892&action=edit
apple factory nets
http://firewallcafe.com/wp-admin/post.php?post=142777&action=edit
END;
	$lines = explode("&action=edit\n", $input);
	foreach ($lines as $item) {
		$item = explode("\n", $item);
		$term = $item[0];
		if (preg_match('/post=(\d+)/', $item[1], $matches)) {
			$id = $matches[1];
		} else {
			echo "COULD NOT DERIVE POST ID FROM $item[1]\n";
			continue;
		}
		echo "item: $term / $id\n";
		$post = get_post($id);
		if (! preg_match_all('/\[gallery.+?\]/mis', $post->post_content, $matches)) {
			echo "COULD NOT FIND GALLERY IDs for $id: $post->post_content\n";
			continue;
		}
		
		$subdir = sanitize_title($term);
		$dir = WP_CONTENT_DIR . "/uploads/fwc_export/$subdir";
		if (! file_exists($dir)) {
			mkdir($dir, 0755, true);
		}
		
		$galleries = $matches[0];
		foreach ($galleries as $gallery) {
			if (preg_match('/ids="([^"]+)"/', $gallery, $matches)) {
				$ids = $matches[1];
				$ids = explode(',', $ids);
				foreach ($ids as $image_id) {
					$img_path = get_attached_file($image_id);
					$basename = basename($img_path);
					echo "$img_path => $dir/$basename\n";
					
					// Default is dry run.
					// Set doit=1 to actually ... do it
					if (! empty($_GET['doit'])) {
						copy($img_path, "$dir/$basename");
					}
				}
			} else {
				echo "COULD NOT FIND IDs in GALLERY FOR $gallery\n";
			}
		}
	}
}
add_action('wp_ajax_fwc_export_images', 'fwc_export_images');
