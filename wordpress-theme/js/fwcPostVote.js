var $ = jQuery;

$(document).ready(function() {
  $('.fwc-vote-button').one('click', function(){
    var $this = $(this);
    var key = $this.data('key');
    var post_id = $this.data('post');

    console.log('$$$$$', $this, key, post_id)
    var data = {
      action: 'fwc_post_vote',
      meta_key: key, // votes_good_translation
      post_id: post_id, // 239084 wordpress_search_result_post_id
      security: FWC.security,
    };

    $this.addClass('disabled');

    $.post(FWC.ajaxurl, data, function(response) {
      var vote_count_integer = parseInt(response, 10);
      $this.parent().find('.vote-count').text(vote_count_integer);
      var historic = parseInt($this.parent().find('.vote-count-historic span').text(), 10);
      $this.parent().find('.vote-count-historic span').text(historic + 1);
    });
  });
});
