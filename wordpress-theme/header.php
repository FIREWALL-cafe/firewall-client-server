<!DOCTYPE html>
<html <?php language_attributes(); ?>>
	<head>
		<meta charset="<?php bloginfo( 'charset' ); ?>">
		<meta name="viewport" content="width=device-width">
		<title><?php
		
		if ( is_home() ) {
			bloginfo( 'name' );
			echo ' - ';
			bloginfo( 'description' );
		} else {
			wp_title( '-', true, 'right' );
			bloginfo( 'name' );
			echo ' - ';
			bloginfo( 'description' );
		}
		
		?></title>
		<link rel="stylesheet" href="<?php
		
		echo get_stylesheet_directory_uri() . "/reset.css";
		
		?>">
		<link rel="stylesheet" href="<?php
		
		
		echo get_stylesheet_directory_uri() . "/fonts/source-sans-pro.css";
		
		?>">
		<link rel="stylesheet" href="<?php
		
		$last_modified = filemtime(get_stylesheet_directory() . '/style.css');
		echo get_stylesheet_uri() . "?$last_modified";
		
		?>">
		<link rel="shortcut icon" type="image/x-icon" href="<?php echo get_stylesheet_directory_uri(); ?>/favicon.ico">
		<?php wp_head(); ?>
		
	</head>
	<body <?php body_class(); ?>>
		<div class="container">
			<header>
				<h1><a href="/"><img src="<?php echo get_stylesheet_directory_uri(); ?>/img/firewall.jpg" alt="FIREWALL Internet Cafe NYC"></a></h1><?php wp_nav_menu( array( 'theme_location' => 'header-menu' ) ); ?>
			
			</header>
		</div>
		<div class="main">
