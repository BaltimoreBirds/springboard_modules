/**
 * @file
 */

/**
 * Advocacy recipients list  and search page
 */
(function ($) {

    // Functions which need to fire on initial page load AND ajax reloads.
    Drupal.behaviors.AdvocacyMessageRecipients = {
        attach: function(context, settings) {

            //manipulate form elements based on subscription level
            Sba.buildSubscriptions();

            // define trigger for custom event handler used by State dropdown's ajax callback.
            // Reset district option elements to default on State element change.
            Sba.buildStateField();

            // Set up tabs, click events and other customizations for committee search
            Sba.buildCommitteeSearch();

            // Define click events for add target links
            Sba.buildTargetLinkEvent(context);

            // Remove jQuery Uniform from selectors
            Sba.deUniform();

            //Update exposed form element states when a district is selected
            Sba.districtReloader(context);

            // Insert placeholder text and update exposed form elements when combo search is changed.
            Sba.comboSearchUpdater();

            if($('.view-targets div.view-empty:visible').length != 0) {
                var actions = $('#sba-message-edit-form #edit-actions');
                $('div.view-empty').clone().appendTo(actions);
                $('.view-targets div.view-empty').remove();
                $('#edit-actions .view-empty').show();
            }

            var subscr = Drupal.settings.sbaSubscriptionLevel;
            if (subscr == 'federal-and-states-selected') {
                Sba.toggleStateAndBranchState();
                Sba.toggleStateAndBranchBranch();
                Sba.toggleStateAndChambersState();
                Sba.toggleStateAndChambersChamber();
            }
        }
    };


    // Functions which need to happen on initial page load, but not ajax reload
    $(document).ready(function () {;

        // Hide the no search results message
        $('.view-empty').hide();

        //stop views ajax auto scroll from moving the exposed search form to top of screen
        $('.pager-item a, #edit-submit-targets').click(function(){
            Drupal.ajax.prototype.commands.viewsScrollTop = null;
        });

        // Add the show/hide toggle for admin-facing user-editable textarea
        Sba.userEditableFormDisplay();

        // Define click events for submit and delete buttons
        Sba.messageFormSubmitter();

        // rearrange/append recipients container, error message div, submit button
        Sba.prepareMessageForm()

        Sba.scroller();
    });


    /*********  Function Definitions **************/

    window.Sba = {};

    Sba.buildSubscriptions = function () {

        if (typeof(Drupal.settings.sbaSubscriptionLevel) !== "undefined") {
            if (Drupal.settings.sbaSubscriptionLevel == 'federal-only') {
                $("#edit-search-committee-chamber option").each(function () {
                    if ($(this).html().indexOf('State') != -1) {
                        $(this).remove();
                    }
                });
                if (window.search_state == 'committee') {
                    $('#edit-search-state-wrapper').hide();
                }
                else {
                    $('#edit-search-state-wrapper').show();
                }
            }
            if (Drupal.settings.sbaSubscriptionLevel == 'state-only') {
                $("#edit-search-committee-chamber option").each(function () {
                    if ($(this).html().indexOf('Federal') != -1) {
                        $(this).remove();
                    }
                });
            }

            if (Drupal.settings.sbaSubscriptionLevel == 'states-selected') {
                $("#edit-search-committee-chamber option").each(function () {
                    if ($(this).html().indexOf('Federal') != -1) {
                        $(this).remove();
                    }
                });

            }

            if (Drupal.settings.sbaSubscriptionLevel == 'federal-and-states-selected') {
                if(window.search_state == 'committee') {
                    $("#edit-search-state option").each(function () {
                        if ($(this).val() != "All" && $.inArray($(this).val(), Drupal.settings.sbaAllowedStates) == -1) {
                            $(this).hide();
                        }
                    });
                }
                else {
                    $("#edit-search-state option").each(function () {
                        $(this).show();
                    });
                }
            }
        }
    }

    Sba.buildStateField = function () {

        if(typeof(Drupal.settings.sbaAllowedStates) !== "undefined") {
            $('#edit-search-state').on('change', function (e) {
                if($(this).val() != 'All' && ($.inArray($(this).val(), Drupal.settings.sbaAllowedStates) !=-1
                    || Drupal.settings.sbaSubscriptionLevel == 'federal-and-states-selected')) {
                    if(window.search_state != 'committee') {
                        $(this).trigger('custom_event');
                    }
                }
                else {
                    $('select[name="search_district_name"]').html('<option selected="selected" value="All">- Any -</option>');
                }
            });
        }
        else {
            $('#edit-search-state').on('change', function (e) {
                $('select[name="search_district_name"]').html('<option selected="selected" value="All">- Any -</option>');
                if($(this).val() != 'All') {
                    if(window.search_state != 'committee') {
                        $(this).trigger('custom_event');
                    }
                }
            });
        }
    }

    Sba.buildCommitteeSearch = function () {

        $('.view-targets').once('advocacy-committee-search', function() {
            var finder = $('#springboard-advocacy-find-targets-container .view-targets');
            finder.prepend('<div class="faux-tab-container"><div class="faux-tab"' +
            '><a href ="#full" class="full-search">Target Search</a></div><' +
            'div class="faux-tab"><a href ="#committee" class="committee-search">Committee Search</a></div>');
        });

        var hideWidgets = $('#edit-search-role-1-wrapper, #edit-search-party-wrapper, #edit-search-social-wrapper, #edit-search-gender-wrapper, #edit-search-district-name-wrapper, #edit-combine-wrapper');
        var comWidgets = $('#edit-search-committee-chamber-wrapper, #edit-search-committee-wrapper');
        $('.committee-search').click(function (e) {
            Sba.reset('committee');
            hideWidgets.hide();
            $('.views-targets-button-wrappers, .search-reset').hide();
            comWidgets.show(300);
            $('a.committee-search').closest('.faux-tab').addClass('active');
            $('a.full-search').closest('.faux-tab').removeClass('active');
            window.search_state = 'committee';
            Sba.buildSubscriptions();
            Sba.toggleStateAndChambers();
            Sba.CommitteeElStates(true);

            return false;
        });

        $('.full-search').click(function (e) {
            $('div.narrow-search').remove();
            comWidgets.hide();
            $('a.committee-search').closest('.faux-tab').removeClass('active');
            $('a.full-search').closest('.faux-tab').addClass('active');
            hideWidgets.show(300);
            $('.search-reset').show(300);
            window.search_state = 'full-search';
            Sba.buildSubscriptions();
            Sba.reset('committee');
            $('#edit-submit-targets').attr('value', 'Search');
            $('#edit-submit-targets').show();
            $('#edit-search-state').prop('disabled', false);
            $('#edit-search-state').removeClass('disabled');
            return false;
        });

        $('#edit-search-committee').on('blur', function() { // "change" no work in ie11
            Sba.CommitteeElStates();
        });

        if(window.search_state == 'committee' ) {
            $('.views-targets-button-wrapper').hide();
            hideWidgets.hide();
           //$('.views-targets-button-wrappers, .search-reset').hide();
            comWidgets.show(300);
            $('a.committee-search').closest('.faux-tab').addClass('active');
            Sba.CommitteeElStates();
        }
        else {
            Sba.toggleStateAndBranch();
            $('a.committee-search').closest('.faux-tab').removeClass('active');
            $('a.full-search').closest('.faux-tab').addClass('active');
            hideWidgets.show(300);
            comWidgets.hide();
            $('#edit-submit-targets').show();
            $('#edit-submit-targets').attr('value', 'Search');

        }

        if ($('#edit-search-committee').text().length == 0) {
            var placeholder = $('#edit-search-committee-wrapper .description').text().trim();
            $('#edit-search-committee-wrapper .description').hide();
            $('#edit-search-committee').attr('placeholder', placeholder);
            $('#edit-search-committee').focus(function () {
                $(this).attr('placeholder', '');
            });
        }

        $('#edit-search-committee-wrapper input').on('keydown', function(input, e){
            if($('div.view-targets').is(':visible')) {
                Sba.reset();
            }
            Sba.setElStates();
        });
    }

    Sba.buildTargetLinkEvent = function (context) {
        // Apply click event to the search form add links
        // Allows views search results to be appended to the recipients list
        var links = $('a.advocacy-add-target, a#advo-add-all');
        links.each(function() {
            $(this, context).once('advocacy-add-target', function() {
                $(this).click(function (e){
                    e.preventDefault();
                    Sba.addTarget('search', this);
                });
            });
        });

        //set the click event for the quick target button
        $('#quick-target', context).once('advocacy-add-quick-target', function() {
            Sba.setElStates();//need this?
            Sba.reset('all');
            $('input#quick-target').click(function(e) {
                //$('.views-targets-button-wrapper').hide();
                var query = Sba.getQuickQuery();
                Sba.addTarget('quick', query);
                return false;

            });
        });
    }

    Sba.deUniform = function () {
        if ($.isFunction($.fn.uniform)) {
            $('select').each(function () {
                $.uniform.restore(this);
            });
        }
    }

    Sba.districtReloader = function (context) {
        $('select[name="search_district_name"]', context).once('advocacy-district-reloaded', function() {
            Sba.setElStates();
            $('#views-exposed-form-targets-block-3 input, #views-exposed-form-targets-block-3 select').on('change', function(){
                if(this.type != 'button' && this.type !='hidden') {
                    if($('div.view-targets').is(':visible')) {
                        Sba.reset();
                    }
                    $( '#edit-actions .view-empty').hide();

                    Sba.setElStates();
                }
            });
        });
    }

    Sba.comboSearchUpdater = function () {
        if ($('#edit-combine').text().length == 0) {
            var placeholder = $('#edit-combine-wrapper .description').text().trim();
            $('#edit-combine-wrapper .description').hide();
            $('#edit-combine').attr('placeholder', placeholder);
            $('#edit-combine').focus(function () {
                $(this).attr('placeholder', '');
            });
        }

        //update exposed form element states when the text search field is changed
        var combine, oldVal;
        $('#edit-combine').on('keyup', function() {
            clearTimeout(combine);
            var newVal = $(this).val();
            if (oldVal != newVal) {
                combine = setTimeout(function() {
                    oldVal = newVal;
                    if($('div.view-targets').is(':visible')) {
                        Sba.reset();
                    }
                    Sba.setElStates();
                }, 400);
            }
        });
    }

    Sba.userEditableFormDisplay = function () {
        var showEdit = $('input[name*=field_sba_user_editable]');
        var editable = $('#sba_message_sba_message_action_message_form_group_sba_editable, #edit-field-sba-bottom-conclusion')
        if(showEdit.prop('checked')) {
            editable.show();
            Sba.scroller();
        }
        showEdit.on('change', function() {
            if(this.checked) {
                editable.show(400, 'linear');
                Sba.scroller();
            }
            else {
                editable.hide(400, 'linear');
                Sba.scroller();
            }
        });
    }

    Sba.messageFormSubmitter = function () {
        $("#edit-submit, #edit-delete").click(function (e) {
            e.preventDefault();
            var messages = [];
            //if($('[name*="field_sba_subject_editable"]').length != 0 && !$('[name*="field_sba_subject_editable"]').is(':checked')) {
            //    messages.push( 'Subject is editable');
            //}
            //if($('[name*="field_message_editable"]').length != 0 && !$('[name*="field_message_editable"]').is(':checked')) {
            //    messages.push('Message is editable');
            //}
            $('input.required').each(function() {
                if ($(this).val() == '') {
                    messages.push($("label[for='" + this.id + "']").text().replace('*', ''));
                }
            });
            if(messages.length === 0) {
                $("#sba-message-edit-form").submit();
            }
            else {
                Sba.setError(messages);
            }
        });
    }

    Sba.prepareMessageForm = function () {
        var recipContainer = $('#springboard-advocacy-message-recipients-container');
        var finder = $('#springboard-advocacy-find-targets-container');
        var actions = $('#sba-message-edit-form #edit-actions');
        var err = $('#advo-error-wrapper');

        $('#springboard-advocacy-message-form-container').append(finder);
        finder.append(recipContainer)
        finder.append(actions);
        actions.append(err);
        $('.views-targets-button-wrapper').hide();

        // Editing a pre-existing message, append the recipients
        // to the recipients div using hidden form value
        var recipients =  $('input[name="data[recipients]"]').val();
        if(recipients.length > 0) {
            $('body').once('edit-page', function() {
                Sba.buildEditPage(recipients);
            });
        }
        else {
            $('.sba-message-status').text('No recipients have been selected.').show('slow');
        }
    }

    Sba.scroller = function () {
        setTimeout(function() {
            var offset = $('#springboard-advocacy-message-recipients').offset();
            var footerOffset = $('#footer-wrapper').offset();
            var newTop;
            $(window).scroll(function() {
                if(offset.top <= $(window).scrollTop() && $('#springboard-advocacy-message-recipients').css('position') == 'absolute') {
                    var recipHeight = $('#springboard-advocacy-message-recipients').height();
                    var newTop = $(window).scrollTop() - offset.top;
                    if((offset.top +  newTop + recipHeight + 20) < footerOffset.top) {
                        $('#springboard-advocacy-message-recipients').css('top', newTop).addClass('recipients-fixed');
                    }
                    else {
                        $('#springboard-advocacy-message-recipients').css('top', 0).removeClass('recipients-fixed');
                    }
                }
                else {
                    $('#springboard-advocacy-message-recipients').css('top', 0).removeClass('recipients-fixed');
                }
            });

        }, 500);
    }


    Sba.toggleStateAndChambers = function () {
        //state/chamber event driven enabling goes here.
        if (window.search_state == 'committee') {
            $('#edit-search-committee-chamber-wrapper select').change(function() {
                sba.toggleStateAndChambersChamber();
            });

            $('select', '#edit-search-state-wrapper').change(function() {
                Sba.toggleStateAndChambersState();
            });
        }
    }

    Sba.toggleStateAndChambersChamber = function () {
        chamber = $('#edit-search-committee-chamber-wrapper select')
        text = $( '#' + chamber.id + ' option:selected').text();
        if(text.indexOf('Federal') != -1 ) {
            $('#edit-search-state').prop('disabled', true);
            $('#edit-search-state').addClass('disabled');
            $('#edit-search-state').siblings('label').css({'cursor': 'not-allowed'});
        }
        else {
            $('#edit-search-state').prop('disabled', false);
            $('#edit-search-state').siblings('label').css({'cursor': 'default'});
        }
    }

    Sba.toggleStateAndChambersState = function () {
        state = $('select', '#edit-search-state-wrapper')
        if (state.val() != 'All') {
            $("#edit-search-committee-chamber option").each(function() {
                if($(this).html().indexOf('Federal') != -1) {
                    $(this).hide();
                }
            });
        }
        else {
            $("#edit-search-committee-chamber option").each(function() {
                if($(this).html().indexOf('Federal') != -1) {
                    $(this).show();
                }
            });
        }
    }

    Sba.toggleStateAndBranch = function () {
        var subscr = Drupal.settings.sbaSubscriptionLevel;
        if (subscr == 'federal-and-states-selected') {
            var states = Drupal.settings.sbaAllowedStates;
            $('select', '#edit-search-state-wrapper').change(function () {
                Sba.toggleStateAndBranchState();
            });

            $('input', '#edit-search-role-1-wrapper').change(function () {
                Sba.toggleStateAndBranchBranch();
            });
        }
    }

    Sba.toggleStateAndBranchState = function () {
        value = $('select', '#edit-search-state-wrapper').val();
        if (value != 'All' && $.inArray(value, Drupal.settings.sbaAllowedStates) == -1) {
            $("#edit-search-role-1-wrapper input").each(function () {
                if ($(this).siblings('label').html().indexOf('Federal') == -1) {
                    $(this).closest('.control-group').hide();
                }
            });
        }
        else {
            $("#edit-search-role-1-wrapper input").each(function () {
                $(this).closest('.control-group').show();
            });
        }
    }

    Sba.toggleStateAndBranchBranch = function () {
        var checkedState = false;
        $boxes = $('input', '#edit-search-role-1-wrapper');
        $boxes.each(function(){
            var fed = $(this).siblings('label').html().indexOf('State');
            if($(this).prop('checked') &&  fed != -1) {
                checkedState = true;
            }
        });

        var options = $('select option', '#edit-search-state-wrapper');
        options.each(function () {
            if ($.inArray($(this).val(), Drupal.settings.sbaAllowedStates) == -1) {
                if (checkedState == true) {
                    $(this).hide();
                }
                else {
                    $(this).show();
                }
            }
        });

    }

    // selectively disable/enable exposed form elements based on user actions
    Sba.setElStates = function () {

        //element state meta-variables
        var notGroupable = false;
        var groupable = false;
        var hasDistrict = false;
        var hasState = false;
        //elements
        var combine = $('input#edit-combine');
        var district = $('select[name="search_district_name"]');
        var state = $('select[name="search_state"]');
        var allBoxes = $('#views-exposed-form-targets-block-3 input[type="checkbox"]');
        var allInputs =$('#views-exposed-form-targets-block-3 input[type="checkbox"], #views-exposed-form-targets-block-3 input[type="text"], #views-exposed-form-targets-block-3 select');

        allInputs.each(function() {
            //update our element state meta-variables
            var nm = this.name;
            if(nm.indexOf('combine') != -1 || nm.indexOf('district') != -1 ||
                nm.indexOf('PRES')  != -1 || nm.indexOf('GOVNR') != -1) {
                if ($(this).prop('checked') || (nm.indexOf('district') != -1 && district.val() != 'All')) {
                    notGroupable = true;
                    if (nm.indexOf('district') != -1) {
                        hasDistrict = true;
                    }
                }
                if(nm.indexOf('district') != -1 && district.val() == 'All') {
                    hasDistrict = false;
                }

                if( nm.indexOf('combine') != -1) {
                    if ($(this).val().length > 0) {
                        notGroupable = true;
                    }
                }
            } else {

                if ((this.type=='checkbox' && $(this).prop('checked'))) {
                    groupable = true;
                }
                if((nm == 'search_state' && $(this).val() != 'All')) {
                    hasState = true;
                }
            }
        });

        //update form element states based on meta-variables
        if(hasDistrict == true){
            allBoxes.each(function(){
                $(this).prop('disabled', true);
                $(this).closest('.views-exposed-widget').addClass('disabled');
                $(this).siblings('label').css({'cursor': 'not-allowed'});
            })
            combine.prop('disabled', true);
            combine.closest('.views-exposed-widget').addClass('disabled');

        }
        if(hasDistrict == false) {
            allBoxes.each(function(){
                if($(this).prop('disabled') == true) {
                    $(this).prop('disabled', false);
                    $(this).closest('.views-exposed-widget').removeClass('disabled');
                    $(this).siblings('label').css({'cursor': 'pointer'});

                }
            });
            combine.prop('disabled', false);
            combine.closest('.views-exposed-widget').removeClass('disabled');
            if(state.val() != "All" && groupable == false && notGroupable == false && $('select[name="search_district_name"] option').size() > 1) {
                district.prop('disabled', false);
                district.removeClass('disabled');

                //jquery uniform
                $('#edit-search-district-name-wrapper div.disabled').removeClass('disabled');
            }
            else {
                district.prop('disabled', true);
                district.addClass('disabled');
                //jquery uniform
                $('#edit-search-district-name-wrapper div.selector').addClass('disabled');
            }
        }
        //update quick target button based on meta-variables
        if( notGroupable == true || hasDistrict == true || (groupable == false && hasState == false)) {
            if(window.search_state != 'committee') {
                $('.views-targets-button-wrapper').prop("disabled", true).fadeOut(400, function(){$(this).hide(500)}).css({'cursor': 'default'}).addClass('cancel-hover');
                $('.views-targets-button-wrapper input').prop("disabled", true).fadeOut(400,  function(){$(this).hide(500)}).css({'cursor': 'default'}).addClass('cancel-hover');
            }

        }

        else if((groupable == true || hasState == true)  && window.search_state != 'committee' && hasDistrict == false && notGroupable == false) {
            $('.views-targets-button-wrapper').prop("disabled", false).fadeIn(200).css({'cursor': 'pointer'}).removeClass('cancel-hover');
            $('.views-targets-button-wrapper input').prop("disabled", false).fadeIn(200).css({'cursor': 'pointer'}).removeClass('cancel-hover');
        }
    }

    Sba.CommitteeElStates = function(tab) {
        var pattern = /(id:[0-9]+)/;
        var state  = $('#edit-search-state');
        var submit = $('#edit-submit-targets');
        var chamber = $('#edit-search-committee-chamber');
        var commit = $('#edit-search-committee');

        $('#state-district-wrapper').append($('#edit-search-committee-chamber-wrapper'));
        $('div.narrow-search').remove();
        $('#state-district-wrapper').before('<div class = "narrow-search">You may narrow the autocomplete results by state or chamber.</div>');

        hasId = pattern.test(commit.val());
        if(hasId === true) {
            submit.show('400');
            $('.search-reset').show();
            submit.attr('value', 'Get Members');
            state.prop('disabled', true);
            state.addClass('disabled');
            chamber.prop('disabled', true);
            chamber.addClass('disabled');
        }
        else {
            submit.hide('400');
            $('.search-reset').hide();
            if (tab != true && commit.val() != '') {
                commit.val('').attr('placeholder', 'Invalid search. Please select a suggested committee name from the list.');
            }
            state.prop('disabled', false);
            state.removeClass('disabled');
            chamber.prop('disabled', false);
            chamber.removeClass('disabled');

        }

    }

    // quick target click function, builds query array
    Sba.getQuickQuery = function () {

        var roles = []
        var parties = []
        var states = []
        var genders = []
        var socials = []


        $('#views-exposed-form-targets-block-3 input[type="checkbox"], #views-exposed-form-targets-block-3 select').each(function(i){
            if ($(this).prop('checked') || (this.name == 'search_state' && this.value != "All")) {
                var nm = this.name
                var v = this.value
                if (nm.indexOf('role') != -1) {
                    roles.push(v);
                }
                else if (nm.indexOf('party') != -1) {
                    parties.push(v);
                }
                else if (nm.indexOf('state') != -1) {
                    states.push(v);
                }
                else if (nm.indexOf('gender') != -1) {
                    genders.push(v);
                }
                else if (nm.indexOf('social') != -1) {
                    socials.push(v);
                }
                else return false;
            }
        });

        roles = roles.toString().replace(/,/g, '|');
        parties = parties.toString().replace(/,/g, '|');
        states = states.toString().replace(/,/g, '|');
        genders = genders.toString().replace(/,/g, '|');
        socials = socials.toString().replace(/,/g, '|');

        var query = [];
        if(states.length > 0) {
            query.push('state=' + states)
        }
        if(roles.length > 0) {
            query.push('role=' + roles)
        }
        if(parties.length > 0) {
            query.push('party=' + parties)
        }
        if(genders.length > 0) {
            query.push('gender=' + genders)
        }
        if(socials.length > 0) {
            query.push('social=' + socials)
        }
        return query;
    }

    // add target
    Sba.addTarget = function (type, query) {
        // create unique ids for target divs
        if (type == 'search') {
            var qArr = $(query).attr('href').replace('add-all?', '').replace('add-target?', '').split('&');
        }
        else {
           qArr = query;
        }

        var duplicate;
        var existing = [];
        var solo;
        $('.target-recipient').each(function(i) {
            data = $.makeArray($(this).data())
            $.each(data, function(index, value){
                var existing = $.map(value, function(content, name) {
                    return name + '=' + content;
                })
                var newTarget =  qArr.toString().replace(/%7C/g, '|');
                var oldTarget = existing.toString();
                solo = newTarget.indexOf('id=');

                if (newTarget == oldTarget) {
                    duplicate = true;
                }
                if(existing.length < qArr.length && duplicate != true) {
                    var missing = false;
                    $.each(existing, function(index, item) {
                        if($.inArray(item, qArr) == -1) {
                            missing = true;
                        }
                        else {
                            duplicate = true;
                        }
                    });
                    if(missing == true) {
                        duplicate = false;
                    }
                }
            })
        });
        if(solo == -1) {
            var message = 'Duplicate Targets. The group you are trying to add is already fully contained within another group.'
        }
        else {
            message = 'Duplicate Target.'
        }
        if(duplicate == true) {
            Sba.setUpdateMessage(message);
            return false;
        }

        var readable = Sba.buildReadableQuery(qArr);
        var id = Sba.calcDivId();
        Sba.buildDiv(id, readable, qArr, false);
        Sba.setUpdateMessage('');
        Sba.setCountMessage();
        Sba.setFormValue();
    }

    Sba.calcDivId = function (){
        if ($('.target-recipient').length !== 0) {
            var count = $(".target-recipient").map(function() {
                return $(this).attr('id').replace('target-', '');
            }).get().sort(function(a, b){
                return a-b
            });
            var  id = parseInt(count.pop()) + 1;
        }
        else {
            id = 0;
        }
        return id;
    }

    // validation error message displayed next to save button
    Sba.setError =function (messages) {
        var err = $('#advo-error-wrapper');
        err.text('').hide().css('margin-bottom', 0);
        err.prepend('<div class = "advo-warning"><strong>Oops!</strong> it looks like you missed the following required fields:</div>');
        $.each(messages, function(i, message) {
            err.append('<div>' + message + ' field is required </div>');
        });
        err.fadeIn(500);//.delay(7000).fadeOut(1000);
    }

    // Rebuild the recipients list on existing messages
    Sba.buildEditPage = function (recipients) {
       $('#springboard-advocacy-message-recipients-content').text('');
        recipients = recipients.replace(/&quot;/g, '"')
         $.each(JSON.parse(recipients), function(id, obj) {
            var query = '';
            query = JSON.stringify(obj)
                .replace(/"/g, '')
                .replace(/,/g, '&')
                .replace(/:/g, '=')
                .replace('{', '')
                .replace('}', '')
                .split('&');

            var readable = Sba.buildReadableQuery(query);
             Sba.buildDiv(id, readable, query, 'reload');
       });
        //reverse the display order
        var content = $('#springboard-advocacy-message-recipients-content');
        var contentItems = content.children('.target-recipient');
        content.append(contentItems.get().reverse());
        Sba.setCountMessage();
    }

    // Create the recipients list divs, apply data attributes which
    // will be aggregated as a JSON string used by a hidden form field
    // for submission to the API
    Sba.buildDiv = function (id, readable, query, reload) {
        if (reload == false) {
            var isnew = 'new';
        }
        else{
            isnew = 'reloaded';
        }
        $('#springboard-advocacy-message-recipients-content')
            .prepend('<div id = "target-' + id + '" class = "target-recipient ' + isnew +'" style="display: none;">' + readable +
            ' <span><a class ="target-delete remove-target" href="#"></a></span></div>');
        $('#target-' + id).show(200).addClass('trans');
        $('#target-' + id + ' a').click(function(ev){
            ev.preventDefault();
            $(this).closest('.target-recipient').hide(300, function(){
                $(this).remove();
                Sba.setUpdateMessage('');
                Sba.setFormValue();
                Sba.setCountMessage();
            });

        })
        $(query).each(function(i, v) {
            v = v.split('=');
            $('#target-' + id).attr('data-' + v[0], v[1].replace(/%7C/g, '|'));
        });
    }

    // attaches JSONified data attributes of the recipients list to a hidden form field
    Sba.setFormValue = function () {
        var obj = {};
        $('.target-recipient').each(function(i) {
            obj[i] = $(this).data();
        });
        recipients = JSON.stringify(obj).replace(/"/g, '&quot;');
        $('input[name="data[recipients]"]').val(recipients);
    }

    Sba.setUpdateMessage = function (message) {
        if(message == '') {
            message = 'You have unsaved changes.'
        }
        else {
          current =  $('.sba-message-status').text();
            if(current.indexOf('You have') != -1) {
                message = message + " You have unsaved changes."
            }

        }
        $('.sba-message-status').hide().text(message).show('slow');
    }

     Sba.setCountMessage = function () {
        $('.targeting-count, .remove-all-targets').remove();
        var message = [];
        var groups = parseInt($('.target-recipient .title').length);
        var individs = parseInt($('.target-recipient .individual').length);
        var gCount = groups > 1 ? 'groups' : 'group'
        var iCount = individs > 1 ? 'individuals' : 'individual';
        //'<strong>Targeting: </strong> '
        if(groups > 0) {
            message.push(groups + ' ' + gCount);
        }
        if(individs > 0 ) {
            message.push(individs + ' ' + iCount)
        }

        countMessage =     '<strong>Targeting: </strong> ' + message.join(' & ');
        var counter = '<div class="targeting-count">' + countMessage + '</div><a class="remove-all-targets">Remove All Targets</a></div>';
        if(individs > 0 || groups > 0) {
            $('#springboard-advocacy-message-recipients-content').append(counter);
        }

        $('.remove-all-targets').click(function(){
            $('.target-recipient').remove();
            $('.targeting-count, .remove-all-targets').remove();
            Sba.setUpdateMessage('');
            Sba.setFormValue();
        });
    }

    // Takes a url query string from the search form "add" links
    // or the quick target parameters
    // and builds readable text for the recipients list.
    Sba.buildReadableQuery = function (query) {
        var queryObj = {};
        $(query).each(function(index, value) {
            var segments = value.split('=');
            if (segments[0] == 'ids') {
                return false;
            }
            segments[0] = segments[0].SbaUcfirst();
            if(segments[0] != 'Search_committee') {
                segments[1] = segments[1].replace(/%7C/g, '|');
                queryObj[segments[0]] = segments[1].split('|');
            }
            else {
                segments[1] = segments[1].replace(/%7C/g, ' ');
                queryObj['Committee'] = segments[1];
            }

            $(queryObj[segments[0]]).each(function(i, v){
                switch(v) {
                    case 'FR':
                        queryObj[segments[0]][i] = 'Federal Representatives';
                        break;
                    case 'SR':
                        queryObj[segments[0]][i] = 'State Representatives';
                        break;
                    case 'FS':
                        queryObj[segments[0]][i] = 'Federal Senators';
                        break;
                    case 'SS':
                        queryObj[segments[0]][i] = 'State Senators';
                        break;
                    case 'PRES01':
                        queryObj[segments[0]][i] = 'US President';
                        break;
                    case 'PRES03':
                        queryObj[segments[0]][i] = 'US Vice-President';
                        break;
                    case 'GOVNR':
                        queryObj[segments[0]][i] = 'State Governors';
                        break;
                    case 'R':
                        queryObj[segments[0]][i] = 'Republicans';
                        break;
                    case 'D':
                        queryObj[segments[0]][i] = 'Democrats';
                        break;
                    case 'O':
                        queryObj[segments[0]][i] = 'Other';
                        break;
                    case 'M':
                        queryObj[segments[0]][i] = 'Male';
                        break;
                    case 'F':
                        queryObj[segments[0]][i] = 'Female';
                        break;
                    case 'twitter':
                        queryObj[segments[0]][i] = 'Twitter';
                        break;
                    case 'facebook':
                        queryObj[segments[0]][i] = 'Facebook';
                        break;
                }
            });
        });

        if (typeof(queryObj.Id) !== 'undefined') {
            return  '<div class="individual">' + queryObj.Sal + " " +  queryObj.First + " " + queryObj.Last + '</div>';
        }
        var cleanUp = JSON.stringify(queryObj).SbaJsonToReadable();
        if (typeof(queryObj.Fields) !== 'undefined' || typeof(queryObj.Genderxxxx) !== 'undefined'
            || typeof(queryObj.Socialxxxx) !== 'undefined' ||  typeof(queryObj.District) !== 'undefined') {
            return '<div class="title"><h4>Group Target</h4></div>' +  cleanUp;
        }
        return '<div class="title"><h4>Group Target</h4></div> ' +  cleanUp;
    }

   Sba.reset = function (type) {
        if (type == 'all') {
            $('.views-submit-button').append('<a class = "search-reset" href ="#">reset</a>');
            $('.search-reset').click(function () {
                Sba.resetFull();
                return false;
            });
        }
        else if (type == 'committee') {
            Sba.resetFull();
        }
        else {
            $('.view-empty').hide();
            $('.view-content').fadeOut(333);
            $('.attachment').fadeOut(333);
            $('div.view-targets .item-list').fadeOut(333);
            //$('#advocacy-attachment-before-add-all').fadeOut(333);

        }
    }

    Sba.resetFull = function () {
        $('.view-empty').hide();

        var allInputs = $('#views-exposed-form-targets-block-3 input[type="checkbox"], #views-exposed-form-targets-block-3 input[type="text"], #views-exposed-form-targets-block-3 select');
        allInputs.each(function () {
            if ($(this).prop('tagName') == "SELECT") {
                $(this).prop('selectedIndex', 0);
                if ($.isFunction($.fn.uniform)) {
                    $.uniform.restore(this);
                }
            }
            if (this.type == 'checkbox') {
                $(this).prop('checked', false);
                $(this).prop('disabled', false);
                $(this).removeClass('disabled');
                $(this).siblings('label').removeClass('disabled').css({'cursor': 'pointer'});
                $(this).closest('.views-exposed-widget').removeClass('disabled');
            }
            if (this.type == 'text') {
                $(this).val('');
            }
        });
        $('.views-targets-button-wrapper').fadeOut(333);
        $('.view-content').fadeOut(333);
        $('.attachment').fadeOut(333);
        $('div.view-targets .item-list').fadeOut(333);
        $('select[name="search_district_name"]').prop('disabled', true).addClass('disabled');
        if(window.search_state == 'committee') {
            Sba.CommitteeElStates(true);
        }

        return false;
    }

    //Uc first helper
    String.prototype.SbaUcfirst = function()
    {
        return this.charAt(0).toUpperCase() + this.substr(1);
    }

    //json notation to readable string helper
    String.prototype.SbaJsonToReadable = function()
    {
      return this.replace(/{"/g, '<ul><li class ="heading">')
            .replace(/]}/g, '</li></ul>')
            .replace(/\["/g, '<li>')
            .replace(/\],"/g, '</li></ul><ul><li class ="heading">')
            .replace(/:/g, '</li>')
            .replace(/","/g, '<li>')
            .replace(/"/g, '')
            .replace(/%20/g, ' ')
            .replace(/%2C/g, ', ')
            .replace(/%28/g, '(')
            .replace(/%29/g, ')')
            .replace(/%3A/g, ':')
    }

})(jQuery);