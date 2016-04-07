var addthis_config = {
  pubid: ''
};

var addthis_share = {
};


(function ($) {
  Drupal.behaviors.sb_social = {
    attach: function (context, settings) {
      // Display a message if popup blocking is detected:
      $(document).ready(function() {
        if ($('.addthis_toolbox').length > 0) {
          function detectPopupBlocker() {
            var popupBlockTest = window.open('about:blank', '', 'directories=no,height=100,width=100,menubar=no,' +
              'resizable=no,scrollbars=no,status=no,titlebar=no,top=0,location=no');
            if (popupBlockTest == null || !popupBlockTest || popupBlockTest.closed || typeof popupBlockTest == 'undefined' ||
                typeof popupBlockTest.closed == 'undefined') {
              $('.addthis_toolbox').before('<div class="social-share-popup-blocker-msg"><strong>' +
                'Please disable your pop-up blocker to share!' + '</strong></div><br />');
            }
            else {
              popupBlockTest.close();
            }
          }
          setTimeout(function() { detectPopupBlocker();}, 50); 
        }
      });

      // AddThis requires some global configuration objects be populated
      // set up the AddThis account ID from admin settings
      if (typeof window.addthis_config !== 'undefined') {
        settings = {
          pubid: Drupal.settings.sb_social.pubid
        };
        jQuery.extend(window.addthis_config, settings);
      }
      else {
        window.addthis_config = {
          pubid: Drupal.settings.sb_social.pubid
        }
      }
      // hijack click event for share links, apply share url provided by share tracker
      $('.social-share-link').each(function() {
         if (!$(this).hasClass('social-processed')) {
           // Add a class to ensure the click event handler is only attached
           // a single time regardless of how many times attach is triggered.
           $(this).addClass('social-processed');
           $(this).click(function() {
               $elem = $(this);
               // account for subdirectory install
               $url = Drupal.settings.basePath;
               if ($(this).hasClass('facebook')) {
                 $url += 'sb_social/share_event/facebook/';
               }
               if ($(this).hasClass('twitter')) {
                 $url += 'sb_social/share_event/twitter/';
               }
               if ($(this).hasClass('email')) {
                 $url += 'sb_social/share_event/email/';
               }
               $url = $url + Drupal.settings.sb_social.id + '/';
               $url = $url + Drupal.settings.sb_social.id_type + '/';
               $url = $url + Drupal.settings.sb_social.market_source + '/';

               // conditionally add webform submission id if present
               if (typeof Drupal.settings.sb_social.submission_id !== 'undefined') {
                   $url = $url + '?sid=' + Drupal.settings.sb_social.submission_id;
               }

               // Register share event and provide share URL to AddThis.
               jQuery.ajax({
                   url: $url,
                   success:function(response) {
                       // Overwrite default url with share url (including share id and market source values)
                       $elem.attr('addthis:url', response);
                       if ($elem.hasClass('facebook')) {
                           $elem.attr('fb:like:href', response);
                       }
                       $elem.context.conf.url = response;
                       $elem.context.share.url = response;
                   },
                   async: false
               });
           });
         }
      });
    }
  };
  //});
})(jQuery);

