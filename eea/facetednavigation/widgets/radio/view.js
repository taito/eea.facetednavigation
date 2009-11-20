/* Radio Widget
*/
Faceted.RadioWidget = function(wid){
  this.wid = wid;
  this.widget = jQuery('#' + wid + '_widget');
  this.widget.show();
  this.title = jQuery('legend', this.widget).html();
  this.elements = jQuery('input[type=radio]', this.widget);
  this.selected = [];
  this.hideitems = jQuery('li.faceted-maxitems-hide', this.widget);

  // Handle checkbox click
  jQuery('form', this.widget).submit(function(){
    return false;
  });

  var js_widget = this;
  this.elements.click(function(evt){
    js_widget.radio_click(this, evt);
  });

  // Default value
  var selected = jQuery('input[type=radio]:checked', this.widget);
  if(selected.length){
    this.selected = selected;
    Faceted.Query[this.wid] = [this.selected.val()];
  }

  // Bind events
  jQuery(Faceted.Events).bind(Faceted.Events.QUERY_CHANGED, function(evt){
    js_widget.synchronize();
  });
  jQuery(Faceted.Events).bind(Faceted.Events.RESET, function(){
    js_widget.reset();
  });
  if(this.widget.hasClass('faceted-count')){
    jQuery(Faceted.Events).bind(Faceted.Events.QUERY_INITIALIZED, function(evt){
      js_widget.count();
    });
    jQuery(Faceted.Events).bind(Faceted.Events.FORM_DO_QUERY, function(evt, data){
      if(data.wid == js_widget.wid || data.wid == 'b_start'){
        return;
      }
      js_widget.count();
    });
  }
  FacetedExpand.ExpandColapse(this.wid, jQuery('.widget-fieldset', this.widget));
};

Faceted.RadioWidget.prototype = {
  radio_click: function(element, evt){
    if(!jQuery(element).val()){
      element = null;
    }
    this.do_query(element);
  },

  do_query: function(element){
    if(!element){
      this.selected = [];
      return Faceted.Form.do_query(this.wid, []);
    }else{
      this.selected = [element];
      var value = jQuery(this.selected[0]).val();
      return Faceted.Form.do_query(this.wid, value);
    }
  },

  reset: function(){
    jQuery(this.elements[0]).attr('checked', true);
    this.selected = [];
  },

  synchronize: function(){
    var value = Faceted.Query[this.wid];
    if(!value){
      this.reset();
      return;
    }

    var context = this;
    if(typeof value != 'object'){
      value = [value];
    }
    jQuery.each(value, function(){
      var radio = jQuery('#' + context.wid + '_widget input[type=radio][value='+ this + ']');
      if(!radio.length){
        context.reset();
      }else{
        context.selected = radio;
        context.selected.attr('checked', true);
      }
    });
  },

  criteria: function(){
    var html = [];
    var title = this.criteria_title();
    var body = this.criteria_body();
    if(title){
      html.push(title);
    }
    if(body){
      html.push(body);
    }
    return html;
  },

  criteria_title: function(){
    if(!this.selected.length){
      return '';
    }
    var link = jQuery('<a href="#">[X]</a>');
    link.attr('id', 'criteria_' + this.wid);
    link.attr('title', 'Remove ' + this.title + ' filters');
    var widget = this;
    link.click(function(evt){
      widget.criteria_remove();
      return false;
    });

    var html = jQuery('<dt>');
    html.append(link);
    html.append('<span>' + this.title + '</span>');
    return html;
  },

  criteria_body: function(){
    if(!this.selected.length){
      return '';
    }

    var widget = this;
    var html = jQuery('<dd>');
    var element = jQuery(this.selected);
    var id = element.attr('id');
    var value = element.val();
    var label = jQuery('label[for=' + id + ']');
    var title = label.attr('title');
    label = label.html();
    var link = jQuery('<a href="#">[X]</a>');

    link.attr('id', 'criteria_' + id);
    link.attr('title', 'Remove ' + title + ' filter');
    link.click(function(evt){
      widget.criteria_remove();
      return false;
    });
    html.append(link);
    html.append('<span>' + label + '</span>');

    return html;
  },

  criteria_remove: function(){
    var element = jQuery(this.elements[0]);
    element.attr('checked', true);
    this.do_query();
  },

  count: function(){
    var query = {};
    jQuery.each(Faceted.Query, function(key){
      query[key] = Faceted.Query[key];
    });
    query.cid = this.wid;

    var context = this;
    jQuery(Faceted.Events).trigger(Faceted.Events.AJAX_START, {wid: context.wid});
    jQuery.getJSON('@@faceted_counter', query, function(data){
      context.count_update(data);
      jQuery(Faceted.Events).trigger(Faceted.Events.AJAX_STOP, {wid: context.wid});
    });
  },

  count_update: function(data){
    var context = this;
    var lis = jQuery('li', context.widget);
    jQuery(lis).each(function(){
      var li = jQuery(this);
      li.removeClass('faceted-radio-item-disabled');
      var input = jQuery('input', li);
      input.unbind();
      var key = input.val();

      var span = jQuery('span', li);
      if(!span.length){
        li.append(jQuery('<span>'));
        span = jQuery('span', li);
      }

      var value = data[key];
      value = value ? value : 0;
      span.text('(' + value + ')');
      if(!value){
        li.addClass('faceted-radio-item-disabled');
        input.attr('disabled', 'disabled');
      }else{
        input.attr('disabled', false);
        input.click(function(evt){
          context.radio_click(this, evt);
        });
      }
    });
  }
};

Faceted.initializeRadioWidget = function(evt){
  jQuery('div.faceted-radio-widget').each(function(){
    var wid = jQuery(this).attr('id');
    wid = wid.split('_')[0];
    Faceted.Widgets[wid] = new Faceted.RadioWidget(wid);
  });
};

jQuery(document).ready(function(){
  jQuery(Faceted.Events).bind(
    Faceted.Events.INITIALIZE,
    Faceted.initializeRadioWidget);
});