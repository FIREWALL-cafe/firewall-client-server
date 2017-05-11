<?php
  get_header();
  the_post();

  $post_id = get_the_ID();

  $translation_data = get_post_meta($post_id, 'translation');
  if ($translation_data) {
    $translation = array_values($translation_data[0])[0];
  }

  the_title( '<h2>', '</h2>' );
  if ($translation_data) {
    echo "<h2>".$translation."</h2>";
  }
?>
    <div class="post-content">
      <?php the_content(); ?>
    </div>
    <div class="post-meta">
      <?php fwc_post_meta(); ?>
    </div>
  </div>
</section>
<?php

get_footer();
