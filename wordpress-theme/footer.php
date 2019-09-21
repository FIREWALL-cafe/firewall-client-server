			<?php if (!is_single() or get_post_type() != 'post') { ?>
			<footer>
				<div class="container">
					<ul>
						<li><a href="http://instagram.com/firewallcafe" target="_blank">Instagram</a></li>
						<li><a href="https://www.facebook.com/firewallcafe" target="_blank">Facebook</a></li>
						<li>&copy; 2019 Firewall and affiliated contributors</li>
					</p>
				</div>
			</footer>
			<?php } ?>
			<script src="<?php echo get_stylesheet_directory_uri().'/js/jquery-2.2.0.min.js'; ?>"></script>
			<script src="<?php echo get_stylesheet_directory_uri().'/js/fwc.js?'.filemtime(get_stylesheet_directory().'/js/fwc.js'); ?>"></script>
		</div>
	<?php wp_footer(); ?>
	</body>
</html>
