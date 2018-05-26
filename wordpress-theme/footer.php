			<footer>
				<div class="container">
					<p><strong>FIREWALL Internet Cafe</strong><br>

						<a href="https://oslofreedomforum.com/events/2018-oslo-freedom-forum">Oslo Freedom Forum</a>: May 28–30, 2018<br>

						</p>
					<p><a href="http://instagram.com/firewallcafe" target="_blank">Instagram</a><br>
						<a href="https://www.facebook.com/firewallcafepopup" target="_blank">Facebook </a></p>
					<p><a href="http://www.joyceyujeanlee.com/" target="_blank">Joyce Yu-Jean Lee</a><br>
						<a href="https://phiffer.org/" target="_blank">Dan Phiffer</a><br>
						<a href="https://www.silascutler.com/" target="_blank">Silas Cutler</a><br>
						<a href="http://www.rachelnackman.com/" target="_blank">Rachel Nackman</a>
						</p>

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
