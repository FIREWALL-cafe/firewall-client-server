			<footer>
				<div class="container">
					<p><strong>FIREWALL</strong><br>
						Pop-up internet cafe<br>
						16B Orchard Street, NYC 10002</p>
					<p><a href="http://instagram.com/firewallcafe" target="_blank">Instagram</a><br>
						<a href="https://www.facebook.com/events/964309336996524/" target="_blank">Facebook Event</a></p>
					<p><a href="http://www.joyceyujeanlee.com/" target="_blank">Joyce Yu-Jean Lee</a><br>
						<a href="https://phiffer.org/" target="_blank">Dan Phiffer</a></p>
				</div>
			</footer>
			<?php wp_footer(); ?>
			<script src="<?php
			
			echo get_stylesheet_directory_uri() . "/js/jquery-2.2.0.min.js";
			
			?>"></script>
			<script src="<?php
			
			$last_modified = filemtime(get_stylesheet_directory() . '/js/fwc.js');
			echo get_stylesheet_directory_uri() . "/js/fwc.js?$last_modified";
			
			?>"></script>
		</div>
	</body>
</html>
