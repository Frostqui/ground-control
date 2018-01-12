/* global $, fs, configFile, goTo, currentPage, shell, url, myText, currentLang, checkValidToken */

function changeModeNoToken() {
  const settings = document.querySelector('#settings');
  settings.addEventListener('ipc-message', event => {
    if (event.channel.startsWith('reload')) {
      const mod = event.channel.split(':')[1] || false;
      if (mod) {
        window.location.hash = mod;
      }
      setTimeout(() => {
        window.location.reload();
      }, 10);
    }
  });
}

function loadIframe() {
  setTimeout(() => {
    if (fs.existsSync(configFile)) {
      let a;
      try {
        a = JSON.parse(fs.readFileSync(configFile));
        if (a.token && a.token !== '') {
          checkValidToken(a.token).then(res => {
            if (res.valid) {
              if ($('#error').length) {
                if (a.other && a.other.useSR === false) {
                  $('.goto_sr').remove();
                  $('.goto_pop').remove();
                 
                  $('#main').html(`<webview id="frame_pop" src="https://${url}/dashboard/${res.username || '%20'}/activity/popout" class="frame"></webview>`);
                } else {
                  $('#main').html(`<webview id="frame_pop" src="https://${url}/dashboard/${res.username || '%20'}/activity/popout" class="frame"></webview>` +
                                        `<webview id="frame_sr" src="https://${url}/dashboard/songrequest/general" class="frame"></webview>`);
                                        
                }
                if (currentPage !== '#settings') {
                  $('.goto_sr').css('display', 'inline-block');
                }
                const pop = document.querySelector('#frame_pop');
                const sr = document.querySelector('#frame_sr');
                const settings = document.querySelector('#settings');
                settings.addEventListener('ipc-message', event => {
                  if (event.channel.startsWith('reload')) {
                    const mod = event.channel.split(':')[1] || false;
                    const lang = event.channel.split(':')[2] || 'en';
                    if (mod) {
                      window.location.hash = mod;
                    }
                    pop.executeJavaScript(`localStorage["StreamElements.lang"] = '"${lang}"';`);
                    setTimeout(() => {
                      window.location.reload();
                    }, 10);
                  } else if (event.channel.startsWith('sr')) {
                    const mod = event.channel.split(':')[1] || false;
                    if (mod) {
                      if (mod === 'close') {
                        $('.goto_sr').remove();
                        $('.goto_pop').remove();
                        $('#frame_sr').remove();
                        b4settings = '#main'; // eslint-disable-line no-undef
                      } else if (mod === 'open') {
                        $('#nav').prepend('<button onclick="goSr();" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect goto_sr">' +
                          '<i class="material-icons">music_note</i></button>' +
                          '<button onclick="goPop();" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect goto_pop">' +
                          '<i class="material-icons">menu</i></button>');
                        $('#main').append(`<webview id="frame_sr" src="https://${url}/dashboard/songrequest/general" class="frame"></webview>`);
                        loadSr(document.querySelector('#frame_sr'));
                      }
                    }
                  }
                });
                pop.addEventListener('dom-ready', () => {
                  $('#updater').css('display', 'none');
                  if (currentPage === '#settings') {
                    goTo('#settings');
                  }
                  pop.insertCSS(fs.readFileSync(`${__dirname}/../css/pop.css`).toString());
                  pop.addEventListener('new-window', e => {
                    const { protocol } = require('url').parse(e.url); // eslint-disable-line global-require
                    if (protocol === 'http:' || protocol === 'https:') {
                      shell.openExternal(e.url);
                    }
                  });
                  pop.executeJavaScript(`
                    window.onbeforeunload = function() {
                        return false;
                    }
                    function oh_yea() {
                        if($("md-switch[ng-model='vm.adsEnabled']").length) {
                            $("md-switch[ng-model='vm.adsEnabled']").removeClass("flex-60");
                            $("md-switch[ng-model='vm.adsEnabled']").next().css("max-width", "calc(100% - 18.7em)");
                        } else if ($(".flex.md-button.md-ink-ripple[ng-click='vm.skipAlert()']").length) {
                            $(".flex.md-button.md-ink-ripple[ng-click='vm.skipAlert()']").removeClass("flex");
                        } else {
                            setTimeout(function() {
                                oh_yea();
                            }, 10);
                        }
                    }
                    setTimeout(function() {
                        oh_yea();
                    }, 1000 * 2);`);
                  /* Start Dark mode */
                  if ($('html').hasClass('darkMode')) {
                    pop.executeJavaScript('$("html").addClass("darkMode");');
                  }
                  /* End Dark mode */
                  /* Start Compact mode */
                  if ($('html').hasClass('compact')) {
                    pop.executeJavaScript(` $("html").addClass("compact");
                                            $("body").bind("DOMSubtreeModified",function(){
                                                $("h4.mb-event-type:not([moved])").each(function() {
                                                    $(this).attr("moved", "").css("margin-left", "1em");
                                                    $(this).prev().append($(this));
                                                });
                                            });
                   `);
                  }
                  /* End Compact mode */
                });
                function loadSr(srA = sr) { // eslint-disable-line no-inner-declarations
                  srA.addEventListener('dom-ready', () => {
                    if (currentPage === '#settings') {
                      goTo('#settings');
                    }
                    srA.executeJavaScript(`
                      window.onbeforeunload = function() {
                        return false;
                      };
                      $(document).ready(function() {
                          var timeIsUp = false;
                          function closeN() {
                              setTimeout(function() {
                                  if (timeIsUp) {
                                      // Nothing
                                  } else if ($("body.md-dialog-is-showing").length == true) {
                                      var esc = $.Event("keydown", { keyCode: 27 });
                                      $("body").trigger(esc);
                                      console.log("Closed news");
                                  } else {
                                      closeN();
                                  }
                              }, 1000);
                              setTimeout(function() {
                                  timeIsUp = true;
                              }, 1000 * 60);
                              $(document).on("click", function() {
                                  timeIsUp = true;
                              });
                          }
                          closeN();
                      });`);
                    srA.insertCSS(fs.readFileSync(`${__dirname}/../css/sr.css`).toString());
                    /* Start Dark mode */
                    if ($('html').hasClass('darkMode')) {
                      srA.executeJavaScript('$("html").addClass("darkMode");');
                    }
                    /* End Dark mode */
                  });
                }
                if (!(a.other && a.other.useSR === false)) {
                  loadSr();
                }
              }
            } else {
              displayError(myText['jwt:invalid'][currentLang]);
            }
          }).catch(err => {
            if (err.statusCode < 500) {
              displayError(myText['jwt:invalid'][currentLang]);
            } else {
              console.warn(err);
              displayError(myText['jwt:500'][currentLang]);
            }
          });
        } else {
          displayError(myText['jwt:missing'][currentLang]);
        }
      } catch (err) {
        displayError(myText['jwt:missing'][currentLang]);
      }
    } else {
      displayError(myText['jwt:missing'][currentLang]);
    }
  }, 10);
}
module.exports = {
  checkValidToken,
  loadIframe
};

/**
 * @param {string} message
 */
function displayError(message) {
  changeModeNoToken();
  $('#updater').css('display', 'none');
  $('#main').css('display', 'none');
  $('.goto_sr').css('display', 'none');
  $('#main').html(`<p id="error">${message}</p>`);
  $('#main').css('display', 'block');
}
