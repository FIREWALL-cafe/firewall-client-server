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
	$sent = wp_mail(
		'info@firewallcafe.com',
		'FIREWALL contact form',
		sprintf(
			'%s <%s> writes:\r\n\r\n%s',
			$_POST['contact_name'],
			$_POST['contact_email'],
			$_POST['contact_message']
		),
		$headers
	);
	if ($sent) {
		$feedback = 'Thank you, your message has been sent!';
		$feedback_class .= ' feedback-ok';
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
		<div class="columns">
			<div class="sidebar">
				<h2>Questions?</h2>
				<p>We welcome your questions, comments, and exhibition/event proposals for future programming.</p>
				<h2>Pop-up?</h2>
				<p>Feel free to suggest our next pop-up location!</p>
			</div>
			<div class="content">
				<form action="#" method="post" autocomplete="off">
					<?php if (!empty($feedback)) { ?>
						<div class="<?php echo $feedback_class; ?>">
							<?php echo $feedback; ?>
						</div>
					<?php } ?>
					<label>
						Name:
						<input type="text" name="contact_name" value="<?php if (isset($_POST['contact_name'])) { echo esc_attr($_POST['contact_name']); } ?>">
					</label>
					<label>
						Email:
						<input type="email" name="contact_email" value="<?php if (isset($_POST['contact_email'])) { echo esc_attr($_POST['contact_email']); } ?>">
					</label>
					<label>
						Message:
						<textarea name="contact_message" rows="5" cols="80"><?php if (isset($_POST['contact_message'])) { echo esc_textarea($_POST['contact_message']); } ?></textarea>
					</label>
					<button type="submit">Send message</button>
				</form>
			</div>
		</div>
	</div>
</section>
<?php

get_footer();

?>