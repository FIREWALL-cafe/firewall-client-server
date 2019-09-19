<!DOCTYPE html>
<html <?php language_attributes(); ?>>
	<head>
		<meta charset="<?php bloginfo('charset'); ?>">
		<meta name="viewport" content="width=device-width">
		<title>
		<?php
		if (is_home()) {
			bloginfo('name');
			echo ' - ';
			bloginfo('description');
		} else {
			wp_title('-', true, 'right');
			bloginfo('name');
			echo ' - ';
			bloginfo('description');
		}
		?>
		</title>
		<link rel="stylesheet" href="<?php echo get_stylesheet_directory_uri(); ?>/reset.css" />
		<link rel="stylesheet" href="<?php echo get_stylesheet_directory_uri(); ?>/fonts/source-sans-pro.css" />
		<link rel="stylesheet" href="<?php echo get_stylesheet_uri(); echo '?'; echo filemtime(get_stylesheet_directory().'/style.css'); ?>">
		<link rel="shortcut icon" type="image/x-icon" href="<?php echo get_stylesheet_directory_uri(); ?>/favicon.ico" />
		<?php wp_head(); ?>
	</head>
	<body <?php body_class(); ?>>
		<?php if (!is_single() or get_post_type() != 'post') { ?>
		<div class="container">
			<header>
				<h1>
					<a href="/" class="wordmark">
						<img src="<?php echo get_stylesheet_directory_uri(); ?>/img/firewall.jpg" alt="Firewall">
					</a>
				</h1>
				<?php wp_nav_menu(array('theme_location' => 'header-menu')); ?>
			</header>
		</div>
		<?php } ?>
		<div class="main">