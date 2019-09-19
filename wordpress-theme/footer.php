			<?php if (!is_single() or get_post_type() != 'post') { ?>
			<footer>
				<div class="container">
					<p>
						<a href="http://instagram.com/firewallcafe" target="_blank">Instagram</a><br>
						<a href="https://www.facebook.com/firewallcafepopup" target="_blank">Facebook</a>
					</p>
					<p>
						<a href="http://www.joyceyujeanlee.com/" target="_blank">Joyce Yu-Jean Lee</a><br>
						<a href="https://phiffer.org/" target="_blank">Dan Phiffer</a><br>
						<a href="https://www.silascutler.com/" target="_blank">Silas Cutler</a><br>
						<a href="http://www.rachelnackman.com/" target="_blank">Rachel Nackman</a>
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

