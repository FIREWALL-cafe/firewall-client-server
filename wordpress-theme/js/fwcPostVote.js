var $ = jQuery;

$(document).ready(function() {
  $('.fwc-vote-button').on('click', function(){
    var $this = $(this);
    var key = $this.data('key');
    var post_id = $this.data('post');

    var data = {
      action: 'fwc_post_vote',
      meta_key: key,
      post_id: post_id,
      security: FWC.security,
    };
    $.post(FWC.ajaxurl, data, function(response) {
      $this.prev('p.vote-count').text(response);
    });
  });
});
