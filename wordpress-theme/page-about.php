<?php
/*
Template Name: About
*/

get_header();
the_post();

?>
<section id="artists">
	<div class="container">
		<h2><?php the_title(); ?></h2>
		<div class="columns">
			<div class="sidebar">
				<?php
				
				the_content();
				edit_post_link('Edit');
				
				?>
			</div>
			<div class="content content--wide">
				<?php 
				
				while ( have_rows( 'artist' ) ) {
					
					the_row();
					
					?>
					<div class="artist item">
						<?php
						
						$img = get_sub_field( 'photo' );
						echo '<a href="' . get_sub_field( 'url' ) . '" target="_blank">';
						echo '<img src="' . $img['sizes']['medium'] . '" alt="' . esc_attr(get_sub_field( 'name' )) . '">';
						echo '</a>';
						
						?>
						<div class="text">
							<h3><a href="<?php the_sub_field( 'url' ); ?>" target="_blank"><?php the_sub_field( 'name' ); ?></a></h3>
							<i><?php the_sub_field( 'role' ); ?></i>
							<div class="bio">
								<?php the_sub_field( 'bio' ); ?>
							</div>
						</div>
					</div>
				<?php } ?>
			</div>
		</div>
	</div>
</section>
<section id="partners">
	<div class="container">
		<h2>Partners</h2>
		<div class="columns">
			<div class="sidebar">
				<p>Special thanks for the support of these gracious partners.</p>
			</div>
			<div class="content content--wide">
				<?php 
				
				while ( have_rows( 'partner' ) ) {
					the_row();
					
					?>
					<div class="partner item">
						<div class="text">
							<h3><a href="<?php the_sub_field( 'url' ); ?>"><?php the_sub_field( 'name' ); ?></a></h3>
							<div class="description">
								<?php the_sub_field( 'description' ); ?>
							</div>
						</div>
					</div>
					<?php
				}
				
				?>
			</div>
		</div>
	</div>
</section>
<section id="support">
	<div class="container">
		<div class="columns">
			<div class="sidebar">
				<h2>Support</h2>
			</div>
			<div class="content content--wide">
				<p>FIREWALL was made possible by the Asian Women Giving Circle; by the Franklin Furnace Fund supported by Jerome Foundation, the Lambent Foundation, The SHS Foundation; and in part with public funds from Creative Engagement, supported by the New York City Department of Cultural Affairs in partnership with the City Council and administered by Lower Manhattan Cultural Council.</p>
				<?php 
				
				while ( have_rows( 'logos' ) ) {
					the_row();
					
					$img = get_sub_field( 'logo' );
					echo '<img src="' . $img['sizes']['medium'] . '" alt="' . esc_attr(get_sub_field( 'name' )) . '" class="logo">';
					
				}
			
				?>
			</div>
		</div>
	</div>
</section>
<?php

get_footer();
