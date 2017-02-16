$(function(){

    $("#query").width("100%");
    
    $(".tabs").each(function(){
        $(this).tabs();
    });

    $(".daterange").each(function(){
        
        var $alt = $(this).find("input"),
            $from = $(this).find(".from"),
            $to = $(this).find(".to");
            
        var formatString = "yy-mm-dd",
            current = $alt.val().split(":"),
            start = $.datepicker.parseDate(formatString, current[0]),
            end = $.datepicker.parseDate(formatString, current[1]),
            lower = $.datepicker.parseDate(formatString, $alt.data("lower")),
            upper = $.datepicker.parseDate(formatString, $alt.data("upper"));
        
        var format = function(date){
            return (
                date.getFullYear()
                + "-" + (date.getMonth()+1)
                + "-" + date.getDate()
            );
        }, update = function(){
            $alt.val(
                format($from.datepicker("getDate"))
                + ":" +
                format($to.datepicker("getDate"))
            );
        }, updateDay = function(lastDay){
            return function(year, month, inst){
                $(this).datepicker("setDate", format(lastDay ? new Date(year, month, 0) : new Date(year, month-1, 1)));
                update();
            };
        };
            
        var base = {
            autoSize: false,
            dateFormat: formatString,
            minDate: lower,
            maxDate: upper,
            changeMonth: true,
            changeYear: true,
            yearRange: lower.getFullYear() + ":" + upper.getFullYear()
        };

        $from.datepicker($.extend({defaultDate: start, onChangeMonthYear: updateDay() }, base)).change(update);
        $to.datepicker($.extend({defaultDate: end, onChangeMonthYear: updateDay(true) }, base)).change(update);
    });


    $(".range").each(function(){
        var $slider = $(this).find(".slider"), $alt = $(this).find("input");
        var update = function(){
            $alt.val(
                $slider.slider("values", 0) + ":" + $slider.slider("values", 1)
            );
        };
        
        var current = $alt.val().split(":");
        $slider.slider({
            range: true,
            min: parseFloat($alt.data("lower")),
            max: parseFloat($alt.data("upper")),
            values: [parseFloat(current[0]), parseFloat(current[1])],
            slide: update,
            stop: update
        });
        update();
    });
    
    $(".mc input").each(function(){
        $(this).checkboxradio({icon:false});
    });

    $(".select select").each(function(){
        $(this).selectmenu();
    });


    /* Autocomplete */
    function split(string) {
        return string.split(/\s+/);
    }
    function extractLast(term) {
        return split(term).pop();
    }

    $("#query").on( "keydown", function(event){
        if(event.keyCode === $.ui.keyCode.TAB && $(this).autocomplete("instance").menu.active)
            event.preventDefault();
    }).autocomplete({
        minLength: 0,
        source: function(request, response){
            response($.ui.autocomplete.filter(AUTOCOMPLETE, extractLast(request.term)));
        },
        focus: function(){
            return false;
        },
        select: function(event, ui) {    
            var terms = split(this.value);
            terms.pop();
            terms.push(ui.item.value);
            if(!ui.item.value.slice(-1) == ":")
                terms.push("");
            this.value = terms.join(" ");
            return false;
        }
    });

    /* Filter hiding */
    
    var $filters = $("#tab-search .lbl input[type=checkbox]"),
        control_filter = function(){
            var $this = $(this), checked = $this.prop("checked");
            if(checked)
                $this.closest("td").next().fadeTo('medium', 1);
            else
                $this.closest("td").next().fadeTo('medium', 0.3);
        };
    $filters.each(control_filter).change(control_filter);


    $("button#submit").each(function(){
        var $button = $(this);
        $button.button({
            icon: "ui-icon-arrowthick-1-s"
        }).click(function(){
            $button.parents('form:first').submit();
        }).css({
            width: '100%',
            marginTop: '5px'
        });
        
    });

    $("input#download_fallback").hide();

    $(".top_buttons #admin").button({
        icon: "ui-icon-person",
        iconPosition: "end"
    });
    $(".top_buttons #logout").button({
        icon: "ui-icon-close",
        iconPosition: "end"
    });
    $(".top_buttons").css({
        float: 'right',
        marginBottom: -$(".top_buttons").outerHeight(),
        zIndex: '999',
        position: 'relative',
        top: '8px',
        right: '7px'
    });

    /* Search dialog */
    var $search_dialog = $("#search_dialog");
    $("#search").button({
        icon: "ui-icon-search"
    }).css({
        width: '100%',
        marginTop: '5px'
    }).click(function(){        
        $search_dialog.dialog("open");
    });
    $search_dialog.dialog({
        autoOpen: false,
        modal: true,
        width: 600,
        title: "Search",
        close: function(event, ui){
        },
        open: function(event, ui){
            $search_dialog.dialog("option", { buttons: [] });
            $search_dialog.text("Searching...");
            
            var post = {}, $form = $('form'), formdata = $form.serializeArray();
            for(var i = 0; i < formdata.length; i++)
                post[formdata[i].name] = formdata[i].value;
            
            $.post($CORPUS_ROOT + "/search.json", post, function(data){
                console.log(data);
                
                var t = data.table, n = t.length-1;
                
                if(n>0){
                    
                    var wrap = $("<div/>");
                    wrap.addClass("wrap");
                    
                    for(var row = 1; row < t.length; row++){
                        var table = $("<table/>");
                        for(var col = 0; col < t[row].length; col++){
                            var tr = $("<tr/>");
                            var td1 = $("<td/>"), td2 = $("<td/>");
                            td1.text(t[0][col]);
                            td2.text(t[row][col]);
                            tr.append(td1);
                            tr.append(td2);
                            table.append(tr);
                        }
                        wrap.append(table);
                    }
                    
                    $search_dialog.text("Your search resulted in "+(data.total)+" hits. Your download limit is "+(DOWNLOAD_LIMIT)+". This is a sample of "+(n)+" results:");
                    $search_dialog.append(wrap);
                    $search_dialog.dialog("option", {
                        buttons: [{
                            text: "Download",
                            click: function() {
                                $form.submit();
                                $search_dialog.dialog("close");
                            }
                        },
                        {
                            text: "Cancel",
                            click: function(){
                                $search_dialog.dialog("close");
                            }
                        }]    
                    });
                }
                else {
                    $search_dialog.text("There were no results to your query.");
                    $search_dialog.dialog("option", {
                        buttons: [
                        {
                            text: "OK",
                            click: function(){
                                $search_dialog.dialog("close");
                            }
                        }
                        ]    
                    });

                }
                
            }, "json").fail(function(jqXHR, textStatus, errorThrown) {
                var error = "Server request failed" + (errorThrown ? ", code: " + errorThrown+"." : ".");

                $search_dialog.text(error);
                $search_dialog.dialog("option", {
                    buttons: [
                        {
                            text: "OK",
                            click: function(){
                                $search_dialog.dialog("close");
                            }
                        }
                    ]
                });

            });
        }
    });

    $("#flashes *").delay(1000).fadeOut(500, function(){
        $(this).remove();
    });

});
