/* global $, remote */
let currentPage = '#frame_pop';
let b4settings = '';
function goTo(page) {
  if (page !== '#settings') {
    const settings = document.querySelector('#settings');
    settings.executeJavaScript(`if ($("#jwt").val()) {
                    $("#jwt").prop("disabled", true).addClass("secret");
                    $("#show-jwt").prop('checked', false);
                  }`);
  } else if (currentPage !== '#settings') {
    b4settings = currentPage;
  } else {
    b4settings = '';
  }
  currentPage = page;
  window.location = page;
}
$(window).on('resize', () => {
  window.location = currentPage;
});

$('#nav button').on('click', () => {
  $('#nav button').css('display', 'none');
});
$('.goto_settings').on('click', () => {
  $('.goBack').css('display', 'inline-block');
  goTo('#settings');
});

$('.goto_chat').on('click', () => {
  $('.goBack').css('display', 'inline-block');
  goTo('#chat');
});
$('.goBack').on('click', () => {
  if (b4settings && b4settings !== '#main' && !$('#error').length) {
    if (b4settings === '#frame_sr') {
      $('.goto_pop').css('display', 'inline-block');
      $('.goto_settings').css('display', 'inline-block');
    } else {
      $('.goto_sr').css('display', 'inline-block');
      $('.goto_chat').css('display', 'inline-block');
      $('.goto_settings').css('display', 'inline-block');
    }
    goTo(b4settings);
  } else {
    $('.goto_settings').css('display', 'inline-block');
    if ($('#frame_pop').length) {
      $('.goto_sr').css('display', 'inline-block');
      $('.goto_chat').css('display', 'inline-block');
      goTo('#frame_pop');
    } else {
      goTo('#main');
    }
  }
});
function goSr() {
  $('#nav button').css('display', 'none');
  $('.goto_pop').css('display', 'inline-block');
  $('.goto_settings').css('display', 'inline-block');
  goTo('#frame_sr');
}

function goChat() {
  $('#nav button').css('display', 'none');
  $('.goto_chat').css('display', 'inline-block');
  $('.goto_settings').css('display', 'inline-block');
  goTo('#chat');
}

function goPop() {
  $('#nav button').css('display', 'none');
  $('.goto_sr').css('display', 'inline-block');
  $('.goto_settings').css('display', 'inline-block');
  goTo('#frame_pop');
}
$('.goto_sr').on('click', () => {
  goSr();
});
$('.goto_pop').on('click', () => {
  goPop();
});


let intDev;
$('.goto_settings').on('mousedown', () => {
  intDev = setInterval(() => {
    remote.getCurrentWindow().toggleDevTools();
  }, 5000);
});
$('.goto_settings').on('mouseup', () => {
  clearInterval(intDev);
});
$('.goto_settings').on('mouseout', () => {
  clearInterval(intDev);
});

let upDev = 0;
$('#updater').on('click', () => {
  upDev++;
  if (upDev >= 10) {
    remote.getCurrentWindow().toggleDevTools();
  }
});
