var $ = jQuery;

$(document).ready(function() {
  $('.fwc-vote-button').one('click', function(){
    var $this = $(this);
    var key = $this.data('key');
    var post_id = $this.data('post');

    var data = {
      action: 'fwc_post_vote',
      meta_key: key,
      post_id: post_id,
      security: FWC.security,
    };

    $this.addClass('disabled');

    $.post(FWC.ajaxurl, data, function(response) {
      var vote_count_integer = parseInt(response, 10);
      var vote_count_measure_word = (vote_count_integer === 1) ? 'vote' : 'votes';
      $this.parent().find('.vote-count').text(vote_count_integer + ' ' + vote_count_measure_word);
    });
  });
});
