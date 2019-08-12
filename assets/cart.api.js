/* override functions api.jquery.js */
Shopify.onItemAdded = function(line_item) {
  Shopify.getCart();
};

Shopify.onCartUpdate = function(cart) {
  Shopify.cartUpdateInfo(cart, '.cart-group-1 ul');
};

Shopify.onError = function(XMLHttpRequest, textStatus) {
  var data = eval('(' + XMLHttpRequest.responseText + ')');
  if (!!data.message) {
    var str = data.description;
  } else {
   	var str = 'Error : ' + Shopify.fullMessagesFromErrors(data).join('; ') + '.';
  }
  jQuery('#modalAddToCartError .error_message').text(str);
  jQuery('#modalAddToCartError').modal("toggle");
}

Shopify.addItem = function(variant_id, quantity, callback) {
  var quantity = quantity || 1;
  var params = {
    type: 'POST',
    url: '/cart/add.js',
    data: 'quantity=' + quantity + '&id=' + variant_id,
    dataType: 'json',
    success: function(line_item) {
      if ((typeof callback) === 'function') {
        callback(line_item);
      }
      else {
        Shopify.cartPopap(variant_id);
        Shopify.onItemAdded(line_item);
      }
    },
    error: function(XMLHttpRequest, textStatus) {
      Shopify.onError(XMLHttpRequest, textStatus);
    }
  };
  jQuery.ajax(params);
};

Shopify.addItemFromForm = function(form_id, variant_id,callback) {
    var params = {
      type: 'POST',
      url: '/cart/add.js',
      beforeSend: function(){
        if(form_id == "add-item-qv") {
          jQuery('#' + form_id).find(".addtocartqv").html(jQuery(".quickViewModal_info .button_wait").html());
        }
      },
      data: jQuery('#' + form_id).serialize(),
      dataType: 'json',
      success: function(line_item) {
        if ((typeof callback) === 'function') {
          callback(line_item);
        }
        else {
          if(form_id != "add-item-qv") {
            Shopify.cartPopapForm(variant_id);
          } else {
          	jQuery('#' + form_id).find(".addtocartqv").html(jQuery(".quickViewModal_info .button_added").html());
            jQuery('#' + form_id).find(".addtocartqv").addClass("added_in_cart");
            setTimeout(function(){
              	jQuery('#' + form_id).find(".addtocartqv").removeClass("added_in_cart");
            	jQuery('#' + form_id).find(".addtocartqv").html(jQuery(".quickViewModal_info .button").html());
            }, 2000);
          }
          Shopify.onItemAdded(line_item);
        }
      },
      error: function(XMLHttpRequest, textStatus) {
        if(form_id != "add-item-qv") {
          Shopify.onError(XMLHttpRequest, textStatus);
        } else {
          jQuery('#' + form_id).find(".addtocartqv").html(jQuery(".quickViewModal_info .button_error").html());
          jQuery('#' + form_id).find(".addtocartqv").addClass("error_in_cart");
          setTimeout(function(){
            jQuery('#' + form_id).find(".addtocartqv").removeClass("error_in_cart");
            jQuery('#' + form_id).find(".addtocartqv").html(jQuery(".quickViewModal_info .button").html());
          }, 2000);
        }
      }
    };
    jQuery.ajax(params);
};

Shopify.removeItemByLine = function(line, callback) {
  var params = {
    type: "POST",
    url: "/cart/change.js",
    data: "quantity=0&line=" + line,
    dataType: "json",
    success: function(line) {
      "function" == typeof callback ? callback(line) : Shopify.onCartUpdate(line)
    },
    error: function(line, callback) {
      Shopify.onError(line, callback)
    }
  };
  jQuery.ajax(params);
};

/* user functions */

Shopify.addItemFromFormStart = function(form, product_id) {
  Shopify.addItemFromForm(form, product_id);
}

Shopify.cartPopap = function(variant_id) {
  	var title = jQuery('.'+variant_id+':first .product_title').text();
  	jQuery('.productmsg').text('');
  	jQuery('#modalAddToCart').modal("toggle");
}
Shopify.cartPopapForm = function(variant_id) {
  	var title = jQuery('.product-info__title:first h2').text();
	jQuery('.productmsg').text('');
	jQuery('#modalAddToCart').modal("toggle");
}

Shopify.cartUpdateInfo = function(cart, cart_cell_id) {
  //BOLD PO AJAX INSTALLATION
  if(typeof window.BOLD !== 'undefined'
     && typeof window.BOLD.common !== 'undefined'
     && typeof window.BOLD.common.cartDoctor !== 'undefined') {
    // NOTE: "cart" should be the variable containing the cart json data
    cart = window.BOLD.common.cartDoctor.fix(cart);
  }
  //END BOLD

  var formatMoney = "<span class='money'>${{amount}}</span>";
  if ((typeof cart_cell_id) === 'string') {
    var cart_cell = jQuery(cart_cell_id);
    if (cart_cell.length) {

      cart_cell.empty();

      jQuery.each(cart, function(key, value) {
        if (key === 'items') {

          if (value.length) {
            jQuery('.cart_message').hide();

            var table = jQuery(cart_cell_id);
            jQuery.each(value, function(i, item) {
              if(i > 19){
                  return false;
              }
              var line = i + 1;
              var optionsBlock = '';
              if (item.properties) {
                optionsBlock = '<span class="Bold-theme-hook-DO-NOT-DELETE bold_cart_item_properties" style="display:none !important;"></span><div class="cart__meta-text">';
                Object.keys(item.properties).forEach(function(key) {
                  var firstCharInKey = key.charAt(0);
                  if (item.properties[key].length != 0 && firstCharInKey != "_") {
                    optionsBlock += key + ':&nbsp;';
                    if (item.properties[key].includes("/uploads")) {
                      optionsBlock += '<a href="' + item.properties[key] + '">' + item.properties[key].split("/").slice(-1) + '</a>';
                    } else {
                      optionsBlock += item.properties[key];
                    }
                    optionsBlock += '<br />';
                  }
                });
              }
              jQuery('<li class="cart__item"><div class="cart__item__image pull-left"><img src="' + item.image + '" alt=""/> </div><div class="cart__item__control"><div class="cart__item__delete"><a href="javascript:void(0);" onclick="Shopify.removeItemByLine(' + line + ');" class="icon icon-delete"><span>'+jQuery(".cart_messages .delete").text()+
              '</span></a></div></div><div class="cart__item__info"><div class="cart__item__info__title"><h2 class="title-center">' + item.title + optionsBlock + '</h2></div><div class="cart__item__info__price"><span class="info-label">'+jQuery(".cart_messages .price").text()+'</span><span>' + Shopify.formatMoney(item.price, formatMoney) + '</span></div><div class="cart__item__info__price" style="right: 35%;"><span class="info-label">'+
              jQuery(".cart_messages .qty").text()+'</span><span>' + item.quantity + '</span></div></div></li>').appendTo(table);
            });
          }
          else {
            jQuery('.cart_message').show();
          }
        }
      });
      $('[data-toggle="tooltip"]').tooltip();
    }
  }

  changeHtmlValue(".shopping-cart__total", Shopify.formatMoney(cart.total_price, formatMoney));
  changeHtmlValue(".bigcounter", cart.item_count);

  jQuery('.currency .active').trigger('click');

  //BOLD PO AJAX INSTALLATION
  if (window.BOLD && BOLD.common && BOLD.common.eventEmitter &&
      typeof BOLD.common.eventEmitter.emit === 'function'){
    BOLD.common.eventEmitter.emit('BOLD_COMMON_cart_loaded');
  }
  //END BOLD
}

//BOLD PO AJAX INSTALLATION
$.getJSON("/cart.js", function(cart) {
  Shopify.cartUpdateInfo(cart, '.cart-group-1 ul');
});
//END BOLD

//Utils
function changeHtmlValue (cell, value) {
  var $cartLinkText = jQuery(cell);
  $cartLinkText.html(value);
};
