/* global $, fs, configFile, pack, ipcRenderer, got, api, url, canUseBot, shell, myText, currentLang, debounce */

/**
 * @param {string} text
 */
function mustache(text) {
  return text.replace(/{{((?:[^}]+.)*)}}/g, (m, p) => {
    let x = '';
    if (p !== '((?:[^}]+.)*)') {
      try {
        x = eval(`${p}`) || ''; // eslint-disable-line no-eval
      } catch (a) {
        x = '';
      }
    }
    return x;
  });
}

const botStuff = fs.readFileSync(`${__dirname}/bot/index.html`).toString();
$('#loadBot').html(botStuff);

loadOtherStuff();

function loadOtherStuff() {
  // Load text
  document.body.innerHTML = mustache(document.body.innerHTML);

  window.updateS = debounce(_updateS, 20);
  const { updateS } = window;

  // Update settings
  function _updateS() {
    const tmp = {
      token: '',
      keys: {},
      oauth: $('#oauth').val() || '',
      darkMode: $('#darkMode_sub').is(':checked'),
      lang: $('#languageSelection select').val(),
      other: {
        useSR: $('#use_sr').is(':checked'),
        useCompact: $('#use_compact').is(':checked')
      },
      bot: {
        use: $('#use_bot').is(':checked') || false,
        name: $('#bot-name').val() || '',
        token: $('#bot-pw').val() || ''
      }
    };

    $('.autoC').each(function () {
      tmp.keys[$(this).attr('id')] = $(this).val() || '';
    });
    // Token
    if (!$('#jwt').parent().hasClass('is-invalid')) {
      tmp.token = $('#jwt').val();
    }
    // Bot
    if (tmp.token) {
      canUseBot(tmp.token).then(res => {
        if (res) {
          $('#loadBot').css('display', 'inline');
        } else {
          $('#loadBot').css('display', 'none');
        }
      });
    } else {
      $('#loadBot').css('display', 'none');
    }
    // Write to file
    fs.writeFile(configFile, JSON.stringify(tmp), (err => {
      if (err) {
        console.error(err);
      } else if (currentLang !== tmp.lang) {
        changeMode();
      }
    }));
  }

  $('#getToken').on('click', () => {
    shell.openExternal(`https://${url}/dashboard/account/information`);
  });

  $('#getBotOAuth').on('click', () => {
    shell.openExternal('https://twitchapps.com/tmi/');
  });
  function genKeybinding(title, id) {
    $('#keybindings').append(`<!-- ${title} -->
      <div id="${id}_top">
        <h6>${title}:</h6>
        <div class="inputF">
          <button class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect clearThis">
            <i class="material-icons">clear</i>
          </button>
          <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label" style="width: 20em;margin-right: 1em;">
            <input class="mdl-textfield__input autoC" type="text" id="${id}" ondragstart="return false;" ondrop="return false;">
            <label class="mdl-textfield__label" for="$${id}">Key...</label>
          </div>
        </div>
      </div>
      <div class="clear"></div>`);
  }
  genKeybinding(myText['alert:skip'][currentLang], 'skip_alert');
  genKeybinding(myText['alert:stop'][currentLang], 'SnR_alert');
  genKeybinding(myText['song:skip'][currentLang], 'skip_song');
  genKeybinding(myText['song:stop'][currentLang], 'SnR_song');
  genKeybinding(myText['song:show'][currentLang], 'x_show_song');

  // Show keybindings
  function keyInfo() {
    $('#key-info').on('click', () => {
      $('#key-info').prop('onclick', null).off('click');
      $('#key-info').html(`<a><b>${myText['keyboard:warning'][currentLang]}</b></a><p style="margin-bottom: 0;">${myText['keyboard:available'][currentLang]}</p><ul>` +
        '<li>0 to 9, A to Z, F1 to F24, Punctuations like ~, !, @, #, $, etc.</li><li>Plus, Space, Tab, Backspace, Delete, Insert, Return (or Enter as alias)</li>' +
        '<li>Up, Down, Left and Right, Home and End, PageUp and PageDown</li><li>Escape (or Esc for short), VolumeUp, VolumeDown and VolumeMute</li>' +
        '<li>MediaNextTrack, MediaPreviousTrack, MediaStop and MediaPlayPause</li><li>PrintScreen</li></ul>');
      $('#key-info').on('click', () => {
        $('#key-info').prop('onclick', null).off('click');
        $('#key-info').html(`<a style="cursor: pointer;">${myText['keyboard:bindings:info'][currentLang]}</a>`);
        keyInfo();
      });
    });
  }
  keyInfo();

  // Show version
  $('#version').html(`v${pack.version}`);

  // Show token
  $('#show-jwt').prop('checked', true);
  $('#show-jwt').on('change', () => {
    if ($('#show-jwt').prop('checked')) {
      $('#jwt').prop('disabled', false).removeClass('secret');
    } else {
      $('#jwt').prop('disabled', true).addClass('secret');
    }
  });
  if ($('#jwt').val()) {
    $('#jwt').prop('disabled', true).addClass('secret');
    $('#show-jwt').prop('checked', false);
  }

  // Show bot token
  $('#show-bot-pw').prop('checked', true);
  $('#show-bot-pw').on('change', () => {
    if ($('#show-bot-pw').prop('checked')) {
      $('#bot-pw').prop('disabled', false).removeClass('secret');
    } else {
      $('#bot-pw').prop('disabled', true).addClass('secret');
    }
  });
  if ($('#bot-pw').val()) {
    $('#bot-pw').prop('disabled', true).addClass('secret');
    $('#show-bot-pw').prop('checked', false);
  }

  // Load old settings
  (function () {
    if (fs.existsSync(configFile)) {
      let a;
      try {
        a = JSON.parse(fs.readFileSync(configFile));
      } catch (err) {
        console.error('Could not parse JSON');
        return;
      }
      if (a.keys) {
        for (const key in a.keys) { // eslint-disable-line guard-for-in, no-restricted-syntax
          $(`#${key}`).val(a.keys[key]);
        }
      }
      if (a.token && a.token !== '') {
        const channelId = JSON.parse(atob(a.token.split('.')[1])).channel;
        setInterval(() => {
          $('#jwt').parent().removeClass('is-disabled');
        }, 10);
        $('#jwt').prop('disabled', true).addClass('secret').val(a.token);
        $('#show-jwt').prop('checked', false);
        canUseBot(a.token).then(res => {
          if (res) {
            $('#loadBot').css('display', 'inline');
          }
        });
        // Test Bot
        $('#testBot').on('click', function () {
          $(this).attr('disabled', true);
          got.post(`https://${api}/kappa/v2/bot/${channelId}/say`, {
            body: {
              message: 'Hello, is this thing on? 4Head'
            },
            headers: {
              authorization: `Bearer ${a.token}`
            }
          }).then(() => {
            $(this).attr('disabled', false);
          });
        });
      }
      if (a.oauth) {
        $('#oauth').val(a.oauth);

      }

      if (a.darkMode) {
        $('html').addClass('darkMode');
        $('#darkMode_sub').prop('checked', true);
      }
      if (a.other) {
        if (a.other.useSR === false) {
          ipcRenderer.sendToHost('sr:close');
          $('div').filter(function () {
            return this.id.match(/.*_song_top$/);
          }).css('display', 'none');
        } else {
          $('#use_sr').prop('checked', true);
        }
        if (a.other.useCompact === true) {
          $('#use_compact').prop('checked', true);
        }
      } else {
        $('#use_sr').prop('checked', true);
      }
      if (a.lang) {
        $('#languageSelection select').val(a.lang);

      }
      if (a.bot) {
        if (a.bot.use) {
          $('#use_bot').prop('checked', true);
        }
        if (a.bot.name) {
          $('#bot-name').val(a.bot.name);
        }
        if (a.bot.token) {
          setInterval(() => {
            $('#bot-pw').parent().removeClass('is-disabled');
          }, 10);
          $('#bot-pw').prop('disabled', true).addClass('secret').val(a.bot.token);
          $('#show-bot-pw').prop('checked', false);
        } else {
          $('#show-bot-pw').prop('checked', true);
        }
      }
    }
  }());

  // Change mode
  function changeMode() {
    setTimeout(() => {
      const dark = $('#darkMode_sub').is(':checked') ? 'dark' : 'light';
      let mod = $('#use_compact').is(':checked') ? '-compact' : '';
      const lang = $('#languageSelection select').val();
      mod = `${dark + mod}:${lang}`;
      ipcRenderer.sendToHost(`reload:${mod}`);
    }, 50);
  }
  $('#use_compact').on('property change mouseup', () => {
    changeMode();
  });
  $('#darkMode_sub').on('property change mouseup', () => {
    changeMode();
  });

  // Change SR
  $('#use_sr').on('property change mouseup', () => {
    setTimeout(() => {
      let mod;
      if ($('#use_sr').is(':checked')) {
        $('div').filter(function () {
          return this.id.match(/.*_song_top$/);
        }).css('display', 'block');
        mod = 'open';
      } else {
        $('div').filter(function () {
          return this.id.match(/.*_song_top$/);
        }).css('display', 'none');
        mod = 'close';
      }
      ipcRenderer.sendToHost(`sr:${mod}`);
    }, 10);
  });

  $("input:not([id^='show'])").on('property change keyup', updateS);
  $('select').on('property change keyup', updateS);
  $('darkMode_sub').on('property change mouseup', updateS);



  // Reset Session
  $('#resetSession').on('click', () => {

    let sessionUrl = '';
    try {
      sessionUrl = `https://${api}/kappa/v2/sessions/${JSON.parse(atob($('#jwt').val().split('.')[1])).channel}/reset`;
    } catch (err) {
      return;
    }
    got.put(sessionUrl, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${$('#jwt').val()}`
      },
      body: '{}'
    }).then(res => {
      if (res.body.toLocaleLowerCase() !== 'ok') {
        console.error(res);
      }
      $('#resetSession a').html(myText.done[currentLang]);
      setTimeout(() => {
        $('#resetSession a').html(myText['session:reset'][currentLang]);
      }, 1000);
    }).catch(err => {
      console.error(err);
    });
  });
}


// Prevent Redirection
window.onbeforeunload = function () {
  return false;
};
