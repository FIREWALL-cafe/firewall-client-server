<?php
  get_header();
  the_post();

  $post_id = get_the_ID();
  $post = get_post($post_id);

  $new_template_style = get_post_meta($post_id, 'new_template_style');

  if ($new_template_style) {
    $translation_data = get_post_meta($post_id, 'translation');
    $translation = array_values($translation_data[0])[0];
  }
?>
<section id="library" class="search">
  <div class="container">
    <?php
      if ($new_template_style) {
        the_title('<h2>', " / $translation</h2>");
        fwc_get_reverse_search($translation);
      } else {
        the_title('<h2>', '</h2>');
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
        <?php fwc_post_search_details(); ?>
      </div>
      <div class="post-section">
        <h3>Search Language</h3>
        <?php fwc_post_search_language(); ?>
      </div>
      <div class="post-section">
        <h3>Search Engine</h3>
        <?php fwc_post_search_engine(); ?>
      </div>
      <div class="post-section">
        <h3>Search History</h3>
        <?php fwc_post_search_history(); ?>
      </div>
    <?php } else { ?>
      <div class="post-meta">
        <?php fwc_post_meta(); ?>
      </div>
    <?php } ?>

    <?php if ($new_template_style) { ?>
      <?php if (fwc_get_search_count() > 1) { ?>
        <div class="post-histories-container post-section">
          <?php fwc_post_previous_searches(); ?>
        </div>
      <?php } ?>
    <?php } ?>
  </div>
</section>
<?php

get_footer();
