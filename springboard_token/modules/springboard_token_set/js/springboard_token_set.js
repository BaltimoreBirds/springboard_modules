(function ($) {
  Drupal.behaviors.SpringboardTokenSet = {
    attach: function (context, settings) {
      // Add token click handler to form elements with token set IDs.
      $(".form-wrapper").each(function() {
        var token_set_id = $(this).data("token-set-id");

        if (typeof token_set_id !== typeof undefined) {
          $(this).addClass("has-token-data");

          $(this).find("input").click(function() {
            Drupal.settings.token_set_last_selected_field = this;
            showTokens($(this));
          });
          $(this).find("textarea").click(function() {
            Drupal.settings.token_set_last_selected_field = this;
            showTokens($(this));
          });
        }
      });

      var showTokens = function (element) {
        // Remove existing tokens div.
        $("#token-set-tokens").remove();

        var token_set_id = element.closest(".has-token-data").data("token-set-id");
        var tokens = Drupal.settings.token_sets[token_set_id];

        // Generate tokens div.
        var html = '<ul id="token-set-tokens">';
        for (var i = 0; i < tokens.length; i++) {
          html += renderToken(tokens[i].token);
        }
        html += '</ul>';

        element.parent().append(html);

        $(".token-set-token-link").each(function() {
          $(this).click(function(event) {
            event.preventDefault();

            var token = $(this).data("token");

            insertToken(Drupal.settings.token_set_last_selected_field, token);
          });
        });
      };

      var renderToken = function (token) {
        var html = '<li><a class="token-set-token-link" data-token="' + token + '" href="#">' + token + '</a></li>';

        return html;
      };

      var insertToken = function (element, token) {
        // IE support.
        if (document.selection) {
          element.focus();
          sel = document.selection.createRange();
          sel.text = token;
        }
        // Mozilla support.
        else if (element.selectionStart || (element.selectionStart === '0')) {
          element.value = element.value.substring(0, element.selectionStart)
            + token
            + element.value.substring(element.selectionEnd, element.value.length);
        } else {
          element.value += token;
        }
      };
    }
  };
})(jQuery);
