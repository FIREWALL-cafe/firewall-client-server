			<?php if (!is_single() or get_post_type() != 'post') { ?>
			<footer>
				<div class="container">
					<ul>
						<li>
							<img class="migrate-icon-social-media" src="<?php echo get_stylesheet_directory_uri(); ?>/img/icons-social-media-instagram.svg" alt="Instagram icon">
							<a href="http://instagram.com/firewallcafe" target="_blank">Instagram</a>
						</li>
						<li>
							<img class="migrate-icon-social-media" src="<?php echo get_stylesheet_directory_uri(); ?>/img/icons-social-media-facebook.svg" alt="Facebook icon">
							<a href="https://www.facebook.com/firewallcafe" target="_blank">Facebook</a>
						</li>
						<li>
							<img class="migrate-icon-social-media" src="<?php echo get_stylesheet_directory_uri(); ?>/img/icons-social-media-youtube.svg" alt="YouTube icon">
							<a href="https://www.youtube.com/channel/UCMTAKSSmI9iKD7a3GB1JIrA" target="_blank">YouTube</a>
						</li>
						<li>&copy; 2016-2020 FIREWALL &amp; affiliates</li>
					</p>
				</div>
			</footer>
			<?php } ?>
		</div>
		<script src="<?php echo get_stylesheet_directory_uri().'/js/jquery-2.2.0.min.js'; ?>"></script>
		<script src="<?php echo get_stylesheet_directory_uri().'/js/fwc.js?'.filemtime(get_stylesheet_directory().'/js/fwc.js'); ?>"></script>
	<?php wp_footer(); ?>
	</body>
</html>
