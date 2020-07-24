<!DOCTYPE html>
<html <?php language_attributes(); ?>>
	<head>
		<meta charset="<?php bloginfo('charset'); ?>" />
		<meta name="viewport" content="width=device-width" />
		<title><?php
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
		?></title>
		<link rel="stylesheet" href="<?php echo get_stylesheet_directory_uri(); ?>/reset.css" />
		<link rel="stylesheet" href="<?php echo get_stylesheet_directory_uri(); ?>/fonts/source-sans-pro.css" />
		<link rel="stylesheet" href="<?php echo get_stylesheet_uri().'?'.filemtime(get_stylesheet_directory().'/style.css'); ?>" />
		<link rel="shortcut icon" type="image/x-icon" href="<?php echo get_stylesheet_directory_uri(); ?>/favicon.ico" />
		<?php wp_head(); ?>
	</head>
	<body <?php body_class(); ?>>
		<?php if (!is_single() or (get_post_type() != 'post' and get_post_type() != 'search-result')) { ?>
		<div class="container">
			<header class="migrate-logo-generic">
				<h1>
					<a href="/" class="wordmark">
						<?php
						// To use a header logo specific to a current installation, in production
						// change variable below without committing, for example:
						// `$logo_file = '/img/logo-firewall-nmc.svg';`
						// If logo image is tall, change the class of header element above to:
						// `<header class="migrate-logo-round">`
						// TODO Use a config variable to set the logo and header style
						$logo_file = '/img/logo-firewall-generic.svg';
						$logo_path = get_stylesheet_directory_uri().$logo_file;
						$logo_last_modified = filemtime(get_stylesheet_directory().$logo_file) or '';
						$logo_url = $logo_path.'?'.$logo_last_modified;
						?>
						<img src="<?php echo $logo_url; ?>" alt="Firewall" />
					</a>
				</h1>
				<?php wp_nav_menu(array('theme_location' => 'header-menu')); ?>
			</header>
		</div>
		<?php } ?>
		<div class="main">