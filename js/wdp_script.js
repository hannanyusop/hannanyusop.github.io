jQuery(document).ready(function ($) {
  $(this).find(':submit').removeAttr("disabled");
  WDP = {
    ajaxurl: WDP_WP.ajaxurl,
    nonce: WDP_WP.wdpNonce,
    textCounter: WDP_WP.textCounter,
    textCounterNum: (WDP_WP.textCounterNum !== '') ? WDP_WP.textCounterNum : 300,
    jpages: WDP_WP.jpages,
    numPerPage: (WDP_WP.jPagesNum !== '') ? WDP_WP.jPagesNum : 10,
    widthWrap: (WDP_WP.widthWrap !== '') ? WDP_WP.widthWrap : '',
    autoLoad: WDP_WP.autoLoad,
    thanksComment: WDP_WP.thanksComment,
    thanksReplyComment: WDP_WP.thanksReplyComment,
    duplicateComment: WDP_WP.duplicateComment,
    insertImage: WDP_WP.insertImage,
    insertVideo: WDP_WP.insertVideo,
    insertLink: WDP_WP.insertLink,
    accept: WDP_WP.accept,
    cancel: WDP_WP.cancel,
    reply: WDP_WP.reply,
    checkVideo: WDP_WP.checkVideo,
    textWriteComment: WDP_WP.textWriteComment,
    classPopularComment: WDP_WP.classPopularComment,
  };

  //Remove duplicate comment box
  jQuery('.wdp-wrap-comments').each(function (index, element) {
    var ids = jQuery('[id=\'' + this.id + '\']');
    if (ids.length > 1) {
      ids.slice(1).closest('.wdp-wrapper').remove();
    }
  });

  //Remove id from input hidden comment_parent and comment_post_ID. Para prevenir duplicados
  jQuery('.wdp-container-form [name="comment_parent"], .wdp-container-form [name="comment_post_ID"]').each(function (index, input) {
    $(input).removeAttr('id');
  });


  // Textarea Counter Plugin
  if (typeof jQuery.fn.textareaCount == 'function' && WDP.textCounter == 'true') {
    $('.wdp-textarea').each(function () {
      var textCount = {
        'maxCharacterSize': WDP.textCounterNum,
        'originalStyle': 'wdp-counter-info',
        'warningStyle': 'wdp-counter-warn',
        'warningNumber': 20,
        'displayFormat': '#left'
      };
      $(this).textareaCount(textCount);
    });
  }

  // PlaceHolder Plugin
  if (typeof jQuery.fn.placeholder == 'function') {
    $('.wdp-wrap-form input, .wdp-wrap-form textarea, #wdp-modal input, #wdp-modal textarea').placeholder();
  }
  // Autosize Plugin
  if (typeof autosize == 'function') {
    autosize($('textarea.wdp-textarea'));
  }

  //Actualizamos alturas de los videos
  $('.wdp-wrapper').each(function () {
    rezizeBoxComments_WDP($(this));
    restoreIframeHeight($(this));
  });
  $(window).resize(function () {
    $('.wdp-wrapper').each(function () {
      rezizeBoxComments_WDP($(this));
      restoreIframeHeight($(this));
    });
  });

  // CAPTCHA
  if ($('.wdp-captcha').length) {
    captchaValues = captcha_WDP(9);
    $('.wdp-captcha-text').html(captchaValues.n1 + ' &#43; ' + captchaValues.n2 + ' = ');
  }

  // OBTENER COMENTARIOS

  $(document).delegate('a.wdp-link', 'click', function (e) {
    e.preventDefault();
    var linkVars = getUrlVars_WDP($(this).attr('href'));
    var post_id = linkVars.post_id;
    var num_comments = linkVars.comments;
    var num_get_comments = linkVars.get;
    var order_comments = linkVars.order;
    $("#wdp-wrap-commnent-" + post_id).slideToggle(200);
    var $container_comment = $('#wdp-container-comment-' + post_id);
    if ($container_comment.length && $container_comment.html().length === 0) {
      getComments_WDP(post_id, num_comments, num_get_comments, order_comments);
    }
    return false;
  });
  // CARGAR COMENTARIOS AUTOMÁTICAMENTE

  if ($('a.wdp-link').length) {
    $('a.wdp-link.auto-load-true').each(function () {
      $(this).click();
    });
  }

  //Mostrar - Ocultar Enlaces de Responder, Editar
  $(document).delegate('li.wdp-item-comment', 'mouseover mouseout', function (event) {
    event.stopPropagation();
    if (event.type === 'mouseover') {
      $(this).find('.wdp-comment-actions:first').show();
    } else {
      $(this).find('.wdp-comment-actions').hide();
    }
  });

  //Cancelar acciones
  $(document).find('.wdp-container-form').keyup(function (tecla) {
    post_id = $(this).find('form').attr('id').replace('commentform-', '');
    if (tecla.which == 27) {
      cancelCommentAction_WDP(post_id);
    }
  });

  //Mostrar - Ocultar Enlaces de Responder, Editar
  $(document).delegate('input.wdp-cancel-btn', 'click', function (event) {
    event.stopPropagation();
    post_id = $(this).closest('form').attr('id').replace('commentform-', '');
    cancelCommentAction_WDP(post_id);
  });

  // RESPONDER COMENTARIOS
  $(document).delegate('.wdp-reply-link', 'click', function (e) {
    e.preventDefault();
    var linkVars = getUrlVars_WDP($(this).attr('href'));
    var comment_id = linkVars.comment_id;
    var post_id = linkVars.post_id;
    //Restauramos cualquier acción
    cancelCommentAction_WDP(post_id);
    var form = $('#commentform-' + post_id);
    form.find('[name="comment_parent"]').val(comment_id);//input oculto con referencia al padre
    form.find('.wdp-textarea').val('').attr('placeholder', WDP_WP.reply + '. ESC (' + WDP_WP.cancel + ')').focus();
    form.find('input[name="submit"]').addClass('wdp-reply-action');
    $('#commentform-' + post_id).find('input.wdp-cancel-btn').show();
    //scroll
    scrollThis_WDP(form);

    return false;
  });

  //EDITAR COMENTARIOS
  $(document).delegate('.wdp-edit-link', 'click', function (e) {
    e.preventDefault();
    var linkVars = getUrlVars_WDP($(this).attr('href'));
    var comment_id = linkVars.comment_id;
    var post_id = linkVars.post_id;
    //Restauramos cualquier acción
    cancelCommentAction_WDP(post_id);
    var form = $('#commentform-' + post_id);
    form.find('[name="comment_parent"]').val(comment_id);//input oculto con referencia al padre
    form.find('.wdp-textarea').val('').focus();
    form.find('input[name="submit"]').addClass('wdp-edit-action');
    //scroll
    scrollThis_WDP(form);
    getCommentText_WDP(post_id, comment_id);
  });

  //ELIMINAR COMENTARIOS
  $(document).delegate('.wdp-delete-link', 'click', function (e) {
    e.preventDefault();
    var linkVars = getUrlVars_WDP($(this).attr('href'));
    var comment_id = linkVars.comment_id;
    var post_id = linkVars.post_id;
    if (confirm(WDP_WP.textMsgDeleteComment)) {
      deleteComment_WDP(post_id, comment_id);
    }
  });

  $('input, textarea').focus(function (event) {
    $(this).removeClass('wdp-error');
    $(this).siblings('.wdp-error-info').hide();
  });

  // ENVIAR COMENTARIO
  $(document).on('submit', '.wdp-container-form form', function (event) {
    event.preventDefault();
    $(this).find(':submit').attr("disabled", "disabled");
    $('input, textarea').removeClass('wdp-error');
    var formID = $(this).attr('id');
    var post_id = formID.replace('commentform-', '');
    var form = $('#commentform-' + post_id);
    var link_show_comments = $('#wdp-link-' + post_id);
    var num_comments = link_show_comments.attr('href').split('=')[2];
    var form_ok = true;

    // VALIDAR COMENTARIO
    var $content = form.find('textarea').val().replace(/\s+/g, ' ');
    //Si el comentario tiene menos de 2 caracteres no se enviará
    if ($content.length < 2) {
      form.find('.wdp-textarea').addClass('wdp-error');
      form.find('.wdp-error-info-text').show();
      setTimeout(function () {
        form.find('.wdp-error-info-text').fadeOut(500);
      }, 2500);
      $(this).find(':submit').removeAttr('disabled');
      return false;
    }
    else {
      // VALIDAR CAMPOS DE TEXTO
      if ($(this).find('input#author').length) {
        var $author = $(this).find('input#author');
        var $authorVal = $author.val().replace(/\s+/g, ' ');
        var $authorRegEx = /^[^?%$=\/]{1,30}$/i;

        if ($authorVal == ' ' || !$authorRegEx.test($authorVal)) {
          $author.addClass('wdp-error');
          form.find('.wdp-error-info-name').show();
          setTimeout(function () {
            form.find('.wdp-error-info-name').fadeOut(500);
          }, 3000);
          form_ok = false;
        }
      }
      if ($(this).find('input#email').length) {
        var $emailRegEx = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,6}$/i;
        var $email = $(this).find('input#email');
        var $emailVal = $email.val().replace(/\s+/g, '');
        $email.val($emailVal);

        if (!$emailRegEx.test($emailVal)) {
          $email.addClass('wdp-error');
          form.find('.wdp-error-info-email').show();
          setTimeout(function () {
            form.find('.wdp-error-info-email').fadeOut(500);
          }, 3000);
          form_ok = false;
        }
      }
      if (!form_ok) {
        $(this).find(':submit').removeAttr('disabled');
        return false;
      }

      // VALIDAR CAPTCHA
      if ($('.wdp-captcha').length) {
        var captcha = $('#wdp-captcha-value-' + post_id);
        form_ok = true;
        if (captcha.val() != (captchaValues.n1 + captchaValues.n2)) {
          form_ok = false;
          captcha.addClass('wdp-error');
        }
        captchaValues = captcha_WDP(9);
        $('.wdp-captcha-text').html(captchaValues.n1 + ' &#43; ' + captchaValues.n2 + ' = ');
        captcha.val('');
      }

      //Si el formulario está validado
      if (form_ok === true) {
        //Si no existe campo lo creamos
        if (!form.find('input[name="comment_press"]').length) {
          form.find('input[name="submit"]').after('<input type="hidden" name="comment_press" value="true">');
        }
        comment_id = form.find('[name="comment_parent"]').val();
        //Insertamos un nuevo comentario
        if (form.find('input[name="submit"]').hasClass('wdp-edit-action')) {
          editComment_WDP(post_id, comment_id);
        }
        else if (form.find('input[name="submit"]').hasClass('wdp-reply-action')) {
          insertCommentReply_WDP(post_id, comment_id, num_comments);
        }
        else {
          insertComment_WDP(post_id, num_comments);
        }
        cancelCommentAction_WDP(post_id);
      }
      $(this).find(':submit').removeAttr('disabled');
    }
    return false;
  });//end submit

  function getComments_WDP(post_id, num_comments, num_get_comments, order_comments) {
    var status = $('#wdp-comment-status-' + post_id);
    var $container_comments = $("ul#wdp-container-comment-" + post_id);
    if (num_comments > 0) {
      jQuery.ajax({
        type: "POST",
        dataType: "html",// tipo de información que se espera de respuesta
        url: WDP.ajaxurl,
        data: {
          action: 'get_comments',
          post_id: post_id,
          get: num_get_comments,
          order: order_comments,
          nonce: WDP.nonce
        },
        beforeSend: function () {
          status.addClass('wdp-loading').html('<span class="wdpo-loading"></span>').show();
        },
        success: function (data) {
          status.removeClass('wdp-loading').html('').hide();
          $container_comments.html(data);
          highlightPopularComments_WDP(post_id, $container_comments);
          $container_comments.show();//Mostramos los Comentarios
          //Insertamos Paginación de Comentarios
          jPages_WDP(post_id, WDP.numPerPage);
          toggleMoreComments($container_comments);
        },
        error: function (jqXHR, textStatus, errorThrown) {
          clog('ajax error');
          clog('jqXHR');
          clog(jqXHR);
          clog('errorThrown');
          clog(errorThrown);
        },
        complete: function (jqXHR, textStatus) {
        }
      });//end jQuery.ajax
    }//end if
    return false;
  }//end function


  function highlightPopularComments_WDP(post_id, $container_comments) {
    var order = $container_comments.data('order');
    if (order == 'likes' && $container_comments.hasClass('wdp-multiple-comments wdp-has-likes')) {
      var top_likes = $container_comments.find('>.wdp-item-comment').eq(0).data('likes');
      var temp = false;
      $container_comments.find('>.wdp-item-comment').each(function (index, comment) {
        if (!temp && $(comment).data('likes') == top_likes) {
          $(comment).addClass(WDP.classPopularComment);
          temp = true;
        }
      });
    }
  }

  function jQFormSerializeArrToJson(formSerializeArr) {
    var jsonObj = {};
    jQuery.map(formSerializeArr, function (n, i) {
      jsonObj[n.name] = n.value;
    });

    return jsonObj;
  }

  function insertComment_WDP(post_id, num_comments) {
    var link_show_comments = $('#wdp-link-' + post_id);
    var comment_form = $('#commentform-' + post_id);
    var status = $('#wdp-comment-status-' + post_id);
    var form_data = comment_form.serialize();//obtenemos los datos

    $.ajax({
      type: 'post',
      method: 'post',
      url: comment_form.attr('action'),
      data: form_data,
      dataType: "html",
      beforeSend: function () {
        status.addClass('wdp-loading').html('<span class="wdpo-loading"></span>').show();
      },
      success: function (data, textStatus) {
        cc('success data', data)
        status.removeClass('wdp-loading').html('');
        if (data != "error") {
          status.html('<p class="wdp-ajax-success">' + WDP.thanksComment + '</p>');
          if (link_show_comments.find('span').length) {
            num_comments = String(parseInt(num_comments, 10) + 1);
            link_show_comments.find('span').html(num_comments);
          }
        }
        else {
          status.html('<p class="wdp-ajax-error">Error processing your form</p>');
        }
        //Agregamos el nuevo comentario a la lista
        $('ul#wdp-container-comment-' + post_id).prepend(data).show();
        //Actualizamos el Paginador
        jPages_WDP(post_id, WDP.numPerPage, true);
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        status.removeClass('wdp-loading').html('<p class="wdp-ajax-error" >' + WDP.duplicateComment + '</p>');
      },
      complete: function (jqXHR, textStatus) {
        setTimeout(function () {
          status.removeClass('wdp-loading').fadeOut(600);
        }, 2500);
      }
    });//end ajax
    return false;
  }

  function insertCommentReply_WDP(post_id, comment_id, num_comments) {
    var link_show_comments = $('#wdp-link-' + post_id);
    var comment_form = $('#commentform-' + post_id);
    var status = $('#wdp-comment-status-' + post_id);
    var item_comment = $('#wdp-item-comment-' + comment_id);
    var form_data = comment_form.serialize();//obtenemos los datos

    $.ajax({
      type: 'post',
      method: 'post',
      url: comment_form.attr('action'),
      data: form_data,
      beforeSend: function () {
        status.addClass('wdp-loading').html('<span class="wdpo-loading"></span>').show();
      },
      success: function (data, textStatus) {
        cc('success data', data)
        status.removeClass('wdp-loading').html('');
        if (data != "error") {
          status.html('<p class="wdp-ajax-success">' + WDP.thanksReplyComment + '</p>');
          if (link_show_comments.find('span').length) {
            num_comments = parseInt(num_comments, 10) + 1;
            link_show_comments.find('span').html(num_comments);
          }
          if (!item_comment.find('ul').length) {
            item_comment.append('<ul class="children"></ul>');
          }
          //Agregamos el nuevo comentario a la lista
          item_comment.find('ul').append(data);

          //scroll
          setTimeout(function () {
            scrollThis_WDP(item_comment.find('ul li').last());
          }, 1000);
        }
        else {
          status.html('<p class="wdp-ajax-error">Error in processing your form.</p>');
        }
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        status.html('<p class="wdp-ajax-error" >' + WDP.duplicateComment + '</p>');
      },
      complete: function (jqXHR, textStatus) {
        setTimeout(function () {
          status.removeClass('wdp-loading').fadeOut(600);
        }, 2500);
      }
    });//end ajax
    return false;

  }

  function editComment_WDP(post_id, comment_id) {
    var form = $("#commentform-" + post_id);
    var status = $('#wdp-comment-status-' + post_id);
    jQuery.ajax({
      type: "POST",
      //dataType: "html",
      url: WDP.ajaxurl,
      data: {
        action: 'edit_comment_wdp',
        post_id: post_id,
        comment_id: comment_id,
        comment_content: form.find('.wdp-textarea').val(),
        nonce: WDP.nonce
      },
      beforeSend: function () {
        status.addClass('wdp-loading').html('<span class="wdpo-loading"></span>').show();
      },
      success: function (result) {
        status.removeClass('wdp-loading').html('');
        var data = jQuery.parseJSON(result);
        if (data.ok === true) {
          $('#wdp-comment-' + comment_id).find('.wdp-comment-text').html(data.comment_text);
          //scroll
          setTimeout(function () {
            scrollThis_WDP($('#wdp-comment-' + comment_id));
          }, 1000);
        }
        else {
          console.log("Errors: " + data.error);
        }
      },//end success
      complete: function (jqXHR, textStatus) {
        setTimeout(function () {
          status.removeClass('wdp-loading').fadeOut(600);
        }, 2500);
      }
    });//end jQuery.ajax
    return false;
  }

  function getCommentText_WDP(post_id, comment_id) {
    var form = $("#commentform-" + post_id);
    var status = $('#wdp-comment-status-' + post_id);
    jQuery.ajax({
      type: "POST",
      dataType: "html",
      url: WDP.ajaxurl,
      data: {
        action: 'get_comment_text_wdp',
        post_id: post_id,
        comment_id: comment_id,
        nonce: WDP.nonce
      },
      beforeSend: function () {
        //status.addClass('wdp-loading').html('<span class="wdpo-loading"></span>').show();
      },
      success: function (data) {
        //status.removeClass('wdp-loading').html('');
        if (data !== 'wdp-error') {
          $('#wdp-textarea-' + post_id).val(data);
          autosize.update($('#wdp-textarea-' + post_id));
          //$('#commentform-'+post_id).find('input[name="submit"]').hide();
          $('#commentform-' + post_id).find('input.wdp-cancel-btn').show();
        }
        else {

        }
      },//end success
      complete: function (jqXHR, textStatus) {
        //setTimeout(function(){
        //status.removeClass('wdp-loading').hide();
        //},2500);
      }
    });//end jQuery.ajax
    return false;
  }//end function


  function deleteComment_WDP(post_id, comment_id) {
    jQuery.ajax({
      type: "POST",
      dataType: "html",
      url: WDP.ajaxurl,
      data: {
        action: 'delete_comment_wdp',
        post_id: post_id,
        comment_id: comment_id,
        nonce: WDP.nonce
      },
      beforeSend: function () {
      },
      success: function (data) {
        if (data === 'ok') {
          $('#wdp-item-comment-' + comment_id).remove();
        }
      }//end success
    });//end jQuery.ajax
    return false;
  }//end function

  //MOSTRAR/OCULTAR MÁS COMENTARIOS
  function toggleMoreComments($container_comments) {
    //console.log("======================= toggleMoreComments ", $container_comments.attr('id'));
    var liComments = $container_comments.find('>li.depth-1.wdp-item-comment');
    liComments.each(function (index, element) {
      var ulChildren = $(this).find('> ul.children');
      if (ulChildren.length && ulChildren.find('li').length > 3) {
        ulChildren.find('li:gt(2)').css('display', 'none');
        ulChildren.append('<a href="#" class="wdp-load-more-comments">' + WDP_WP.textLoadMore + '</a>');
      }
    });
  }

  $(document).delegate('a.wdp-load-more-comments', 'click', function (e) {
    e.preventDefault();
    $(this).parent().find('li.wdp-item-comment').fadeIn("slow");
    $(this).remove();
  });

  $(document).delegate('.wdp-media-btns a', 'click', function (e) {
    e.preventDefault();
    var post_id = $(this).attr('href').split('=')[1].replace('&action', '');
    var $action = $(this).attr('href').split('=')[2];
    $('body').append('<div id="wdp-overlay"></div>');
    $('body').append('<div id="wdp-modal"></div>');
    $modalHtml = '<div id="wdp-modal-wrap"><span id="wdp-modal-close"></span><div id="wdp-modal-header"><h3 id="wdp-modal-title">Título</h3></div><div id="wdp-modal-content"><p>Hola</p></div><div id="wdp-modal-footer"><a id="wdp-modal-ok-' + post_id + '" class="wdp-modal-ok wdp-modal-btn" href="#">' + WDP.accept + '</a><a class="wdp-modal-cancel wdp-modal-btn" href="#">' + WDP.cancel + '</a></div></div>';
    $("#wdp-modal").append($modalHtml).fadeIn(250);

    switch ($action) {
      case 'url':
        $('#wdp-modal').removeClass().addClass('wdp-modal-url');
        $('#wdp-modal-title').html(WDP.insertLink);
        $('#wdp-modal-content').html('<input type="text" id="wdp-modal-url-link" class="wdp-modal-input" placeholder="' + WDP_WP.textUrlLink + '"/><input type="text" id="wdp-modal-text-link" class="wdp-modal-input" placeholder="' + WDP_WP.textToDisplay + '"/>');
        break;

      case 'image':
        $('#wdp-modal').removeClass().addClass('wdp-modal-image');
        $('#wdp-modal-title').html(WDP.insertImage);
        $('#wdp-modal-content').html('<input type="text" id="wdp-modal-url-image" class="wdp-modal-input" placeholder="' + WDP_WP.textUrlImage + '"/><div id="wdp-modal-preview"></div>');
        break;

      case 'video':
        $('#wdp-modal').removeClass().addClass('wdp-modal-video');
        $('#wdp-modal-title').html(WDP.insertVideo);
        $('#wdp-modal-content').html('<input type="text" id="wdp-modal-url-video" class="wdp-modal-input" placeholder="' + WDP_WP.textUrlVideo + '"/><div id="wdp-modal-preview"></div>');
        $('#wdp-modal-footer').prepend('<a id="wdp-modal-verifique-video" class="wdp-modal-verifique wdp-modal-btn" href="#">' + WDP.checkVideo + '</a>');
        break;
    }
  });//
  //acción Ok
  $(document).delegate('.wdp-modal-ok', 'click', function (e) {
    e.preventDefault();
    $('#wdp-modal input, #wdp-modal textarea').removeClass('wdp-error');
    var $action = $('#wdp-modal').attr('class');
    var post_id = $(this).attr('id').replace('wdp-modal-ok-', '');
    switch ($action) {
      case 'wdp-modal-url':
        processUrl_WDP(post_id);
        break;
      case 'wdp-modal-image':
        processImage_WDP(post_id);
        break;
      case 'wdp-modal-video':
        processVideo_WDP(post_id);
        break;
    }
    autosize.update($('.wdp-textarea'));
    closeModal_WDP();
    return false;
  });
  //eliminamos errores
  $(document).delegate('#wdp-modal input, #wdp-modal textarea', 'focus', function (e) {
    $(this).removeClass('wdp-error');
  });

  function processUrl_WDP(post_id) {
    var $ok = true;
    var $urlField = $('#wdp-modal-url-link');
    var $textField = $('#wdp-modal-text-link');
    if ($urlField.val().length < 1) {
      $ok = false;
      $urlField.addClass('wdp-error');
    }
    if ($textField.val().length < 1) {
      $ok = false;
      $textField.addClass('wdp-error');
    }
    if ($ok) {
      var $urlVal = $urlField.val().replace(/https?:\/\//gi, '');
      var link_show_comments = '<a href="http://' + $urlVal + '" title="' + $textField.val() + '" rel="nofollow" target="_blank">' + $textField.val() + '</a>';
      insertInTextArea_WDP(post_id, link_show_comments);
    }
    return false;
  }

  function processImage_WDP(post_id) {
    var $ok = true;
    var $urlField = $('#wdp-modal-url-image');
    if ($urlField.val().length < 1) {
      $ok = false;
      $urlField.addClass('wdp-error');
    }
    if ($ok) {
      var $urlVal = $urlField.val();
      var $image = '<img src="' + $urlVal + '" />';
      insertInTextArea_WDP(post_id, $image);
    }
    return false;
  }

  //vista previa de imagen
  $(document).delegate('#wdp-modal-url-image', 'change', function (e) {
    setTimeout(function () {
      $('#wdp-modal-preview').html('<img src="' + $('#wdp-modal-url-image').val() + '" />');
    }, 200);
  });

  function processVideo_WDP(post_id) {
    var $ok = true;
    var $urlField = $('#wdp-modal-url-video');
    if (!$('#wdp-modal-preview').find('iframe').length) {
      $ok = false;
      $('#wdp-modal-preview').html('<p class="wdp-modal-error">Please check the video url</p>');
    }
    if ($ok) {
      var $video = '<p>' + $('#wdp-modal-preview').find('input[type="hidden"]').val() + '</p>';
      insertInTextArea_WDP(post_id, $video);
    }
    return false;
  }

  //vista previa de video
  $(document).delegate('#wdp-modal-verifique-video', 'click', function (e) {
    e.preventDefault();
    var $urlVideo = $('#wdp-modal-url-video');
    var $urlVideoVal = $urlVideo.val().replace(/\s+/g, '');
    $urlVideo.removeClass('wdp-error');
    $(this).attr('id', '');//desactivamos el enlace

    if ($urlVideoVal.length < 1) {
      $urlVideo.addClass('wdp-error');
      $('.wdp-modal-video').find('a.wdp-modal-verifique').attr('id', 'wdp-modal-verifique-video');//activamos el enlace
      return false;
    }

    var data = 'url_video=' + $urlVideoVal;
    $.ajax({
      url: WDP.ajaxurl,
      data: data + '&action=verificar_video_WDP',
      type: "POST",
      dataType: "html",
      beforeSend: function () {
        $('#wdp-modal-preview').html('<div class="wdp-loading wdp-loading-2"></div>');
      },
      success: function (data) {
        if (data != 'error') {
          $('#wdp-modal-preview').html(data);
        } else {
          $('#wdp-modal-preview').html('<p class="wdp-modal-error">Invalid video url</p>');
        }
      },
      error: function (xhr) {
        $('#wdp-modal-preview').html('<p class="wdp-modal-error">Failed to process, try again</p>');
      },
      complete: function (jqXHR, textStatus) {
        $('.wdp-modal-video').find('a.wdp-modal-verifique').attr('id', 'wdp-modal-verifique-video');//activamos el enlace
      }
    });//end ajax
  });

  function closeModal_WDP() {
    $('#wdp-overlay, #wdp-modal').remove();
    return false;
  }

  //acción cancelar
  $(document).delegate('#wdp-modal-close, .wdp-modal-cancel', 'click', function (e) {
    e.preventDefault();
    closeModal_WDP();
    return false;
  });

  function jPages_WDP(post_id, $numPerPage, $destroy) {
    //Si existe el plugin jPages y está activado
    if (typeof jQuery.fn.jPages == 'function' && WDP.jpages == 'true') {
      var $idList = 'wdp-container-comment-' + post_id;
      var $holder = 'div.wdp-holder-' + post_id;
      var num_comments = jQuery('#' + $idList + ' > li').length;
      if (num_comments > $numPerPage) {
        if ($destroy) {
          jQuery('#' + $idList).children().removeClass('animated jp-hidden');
        }
        jQuery($holder).show().jPages({
          containerID: $idList,
          previous: "← " + WDP_WP.textNavPrev,
          next: WDP_WP.textNavNext + " →",
          perPage: parseInt($numPerPage, 10),
          minHeight: false,
          keyBrowse: true,
          direction: "forward",
          animation: "fadeIn",
        });
      }//end if
    }//end if
    return false;
  }

  function captcha_WDP($max) {
    if (!$max) $max = 5;
    return {
      n1: Math.floor(Math.random() * $max + 1),
      n2: Math.floor(Math.random() * $max + 1),
    };
  }

  function scrollThis_WDP($this) {
    if ($this.length) {
      var $position = $this.offset().top;
      var $scrollThis = Math.abs($position - 200);
      $('html,body').animate({ scrollTop: $scrollThis }, 'slow');
    }
    return false;
  }

  function getUrlVars_WDP(url) {
    var query = url.substring(url.indexOf('?') + 1);
    var parts = query.split("&");
    var params = {};
    for (var i = 0; i < parts.length; i++) {
      var pair = parts[i].split("=");
      params[pair[0]] = pair[1];
    }
    return params;
  }

  function cancelCommentAction_WDP(post_id) {
    $('form#commentform-' + post_id).find('[name="comment_parent"]').val('0');
    $('form#commentform-' + post_id).find('.wdp-textarea').val('').attr('placeholder', WDP.textWriteComment);
    $('form#commentform-' + post_id).find('input[name="submit"]').removeClass();
    $('form#commentform-' + post_id).find('input.wdp-cancel-btn').hide();
    autosize.update($('#wdp-textarea-' + post_id));
    $('input, textarea').removeClass('wdp-error');
    captchaValues = captcha_WDP(9);
    $('.wdp-captcha-text').html(captchaValues.n1 + ' &#43; ' + captchaValues.n2 + ' = ');
  }

  function restoreIframeHeight(wrapper) {
    var widthWrapper = WDP.widthWrap ? parseInt(WDP.widthWrap, 10) : wrapper.outerWidth();
    // if(widthWrapper >= 321 ) {
    // 	wrapper.find('iframe').attr('height','250px');
    // } else {
    // 	wrapper.find('iframe').attr('height','160px');
    // }
  }

  function rezizeBoxComments_WDP(wrapper) {
    var widthWrapper = WDP.widthWrap ? parseInt(WDP.widthWrap, 10) : wrapper.outerWidth();
    if (widthWrapper <= 480) {
      wrapper.addClass('wdp-full');
    } else {
      wrapper.removeClass('wdp-full');
    }
  }

  function insertInTextArea_WDP(post_id, $value) {
    //Get textArea HTML control
    var $fieldID = document.getElementById('wdp-textarea-' + post_id);

    //IE
    if (document.selection) {
      $fieldID.focus();
      var sel = document.selection.createRange();
      sel.text = $value;
      return;
    }
    //Firefox, chrome, mozilla
    else if ($fieldID.selectionStart || $fieldID.selectionStart == '0') {
      var startPos = $fieldID.selectionStart;
      var endPos = $fieldID.selectionEnd;
      var scrollTop = $fieldID.scrollTop;
      $fieldID.value = $fieldID.value.substring(0, startPos) + $value + $fieldID.value.substring(endPos, $fieldID.value.length);
      $fieldID.focus();
      $fieldID.selectionStart = startPos + $value.length;
      $fieldID.selectionEnd = startPos + $value.length;
      $fieldID.scrollTop = scrollTop;
    }
    else {
      $fieldID.value += textArea.value;
      $fieldID.focus();
    }
  }

  // LIKE COMMENTS
  $(document).delegate('a.wdp-rating-link', 'click', function (e) {
    e.preventDefault();
    var comment_id = $(this).attr('href').split('=')[1].replace('&method', '');
    var $method = $(this).attr('href').split('=')[2];
    commentRating_WDP(comment_id, $method);
    return false;
  });

  function commentRating_WDP(comment_id, $method) {
    var $ratingCount = $('#wdp-comment-' + comment_id).find('.wdp-rating-count');
    var $currentLikes = $ratingCount.text();
    jQuery.ajax({
      type: 'POST',
      url: WDP.ajaxurl,
      data: {
        action: 'comment_rating',
        comment_id: comment_id,
        method: $method,
        nonce: WDP.nonce
      },
      beforeSend: function () {
        $ratingCount.html('').addClass('wdpo-loading');
      },
      success: function (result) {
        var data = $.parseJSON(result);
        if (data.success === true) {
          $ratingCount.html(data.likes).attr('title', data.likes + ' ' + WDP_WP.textLikes);
          if (data.likes < 0) {
            $ratingCount.removeClass().addClass('wdp-rating-count wdp-rating-negative');
          }
          else if (data.likes > 0) {
            $ratingCount.removeClass().addClass('wdp-rating-count wdp-rating-positive');
          }
          else {
            $ratingCount.removeClass().addClass('wdp-rating-count wdp-rating-neutral');
          }
        } else {
          $ratingCount.html($currentLikes);
        }
      },
      error: function (xhr) {
        $ratingCount.html($currentLikes);
      },
      complete: function (data) {
        $ratingCount.removeClass('wdpo-loading');
      }//end success

    });//end jQuery.ajax
  }

  function clog(msg) {
    console.log(msg);
  }

  function cc(msg, msg2) {
    console.log(msg, msg2);
  }

});//end ready




