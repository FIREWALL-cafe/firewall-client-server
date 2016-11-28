<?php
/*
Template Name: Contact
*/

$feedback_class = 'feedback';
if (!empty($_POST['contact_name']) &&
    !empty($_POST['contact_email']) &&
    !empty($_POST['contact_message']) &&
		preg_match('/.+@.+\..+/', $_POST['contact_email'])) {
	$headers = "From: FIREWALL <info@firewallcafe.com>\r\n";
	$sent = wp_mail('info@firewallcafe.com', 'FIREWALL contact form', "{$_POST['contact_name']} <{$_POST['contact_email']}> writes:\r\n\r\n{$_POST['contact_message']}", $headers);
	if ($sent) {
		$feedback = 'Thank you, your message has been sent!';
		$feedback_class .= ' feedback--ok';
		$_POST['contact_name'] = '';
		$_POST['contact_email'] = '';
		$_POST['contact_message'] = '';
	} else {
		$feedback = 'There was a problem sending your message.';
	}
} else if ($_SERVER['REQUEST_METHOD'] == 'POST') {
	$feedback = 'Oops, please double check the fields below.';
}

get_header();
the_post();

?>
<section id="contact">
	<div class="container">
		<h2>Contact us</h2>
		<div class="columns">
			<div class="sidebar">
				<p>Sign-up for a “Search Session” via the contact form, indicating your interest/connection with FIREWALL and preferred date/time.</p>
				<h3>Questions?</h3>
				<p>Write us via the Contact form, or send an e-mail directly to: <a href="mailto:info@firewallcafe.com">info@firewallcafe.com</a>
			</div>
			<div class="content">
				<form action="." method="post">
					<?php if (!empty($feedback)) { ?>
						<div class="<?php echo $feedback_class; ?>">
							<?php echo $feedback; ?>
						</div>
					<?php } ?>
					<label>
						Name:
						<input type="text" name="contact_name" value="<?php echo esc_attr( $_POST['contact_name'] ); ?>">
					</label>
					<label>
						Email:
						<input type="email" name="contact_email" value="<?php echo esc_attr( $_POST['contact_email'] ); ?>">
					</label>
					<label>
						Message:
						<textarea name="contact_message" rows="5" cols="80"><?php echo esc_textarea( $_POST['contact_message'] ); ?></textarea>
					</label>
					<button type="submit">Send message</button>
				</form>
			</div>
		</div>
	</div>
</section>
<section id="map">
	<div class="container">
		<h2>Visit</h2>
		<div class="columns">
			<div class="sidebar">
				<p>Chinatown Soup<br>
					16B Orchard Street (north of Canal Street)<br>
					New York, NY 10002</p>
				<h3>Closest Subway stops</h3>
				<p>F to East Broadway,<br>
					B / D to Grand Street,<br>
					J / Z / 6 / N / Q to Canal Street</p>
				<h3>Hours</h3>
				<p>Tuesday–Sundays, 12-7pm<br>
					Feb 9–Mar 6, 2016</p>
			</div>
			<div class="content content--wide">
				<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.1305961213116!2d-73.99395748482571!3d40.71514147933145!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a29b5a326c1%3A0x8038978486a4c2d3!2s16+Orchard+St%2C+New+York%2C+NY+10002!5e0!3m2!1sen!2sus!4v1455481082555" width="100%" height="450" frameborder="0" style="border:0" allowfullscreen></iframe>
			</div>
		</div>
	</div>
</section>
<?php

get_footer();
