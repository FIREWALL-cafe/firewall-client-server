<?php
  get_header();
  the_post();

  $post_id = get_the_ID();
  $post = get_post($post_id);

  $new_template_style = get_post_meta(get_the_ID(), 'new_template_style');

  $translation_data = get_post_meta(get_the_ID(), 'translation');
  if ($translation_data && $new_template_style) {
    $translation = array_values($translation_data[0])[0];
  }
?>
<section id="library" class="search">
  <div class="container">
    <?php
      the_title('<h2>', '</h2>');
      if ($new_template_style) {
        echo "<h2>".$translation."</h2>";
      }
    ?>
    <div class="post-tags">
      <?php fwc_post_tags(); ?>
    </div>
    <div class="post-content">
      <?php the_content(); ?>
    </div>

    <br><br>

    <div class="post-vote-buttons-container">
      <?php fwc_post_vote_buttons($post_id); ?>
    </div>

    <?php if ($new_template_style) { ?>
      <div class="post-section">
        <h3>Search History</h3>
        <?php fwc_post_search_history(); ?>
      </div>
      <div class="post-section">
        <h3>Search Language</h3>
        <?php fwc_post_search_language(); ?>
      </div>
      <div class="post-section">
        <h3>Search Engine</h3>
        <?php fwc_post_search_engine(); ?>
      </div>
    <?php } else { ?>
      <div class="post-meta">
        <?php fwc_post_meta(); ?>
      </div>
    <?php } ?>

    <?php# if ($new_template_style) { ?>
      <?php if (fwc_get_search_count() > 1) { ?>
        <div class="post-histories-container post-section">
          <h3>Previous Searches</h3>
          <?php fwc_post_previous_searches(); ?>
        </div>
      <?php } ?>
    <?php# } ?>
  </div>
</section>
<?php

get_footer();
