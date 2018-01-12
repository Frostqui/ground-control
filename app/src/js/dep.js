/* eslint-disable no-unused-vars */
const fs = require('fs');
const got = require('got');
const path = require('path');
const os = require('os');
const chokidar = require('chokidar');

const configLocation = path.normalize(`${os.homedir()}/.se-gc/`);
const configFile = path.join(configLocation, 'config.json');
const { shell, remote } = require('electron'); // eslint-disable-line import/no-extraneous-dependencies

let pack;
if (fs.existsSync('./package.json')) {
  pack = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
} else if (fs.existsSync('./resources/app/package.json')) {
  pack = JSON.parse(fs.readFileSync('./resources/app/package.json', 'utf8'));
} else if (fs.existsSync('./resources/app.asar')) {
  pack = JSON.parse(fs.readFileSync('./resources/app.asar/package.json', 'utf8'));
} else if (fs.existsSync(`${__filename.replace(/src.*/, '')}package.json`)) {
  pack = JSON.parse(fs.readFileSync(`${__filename.replace(/src.*/, '')}package.json`, 'utf8'));
}
const url = 'streamelements.com';
const api = 'api.streamelements.com';
const cBotApi = 'wss://omegalul.streamelements.com';

let currentLang = 'en';
if (fs.existsSync(configFile)) {
  let a;
  try {
    a = JSON.parse(fs.readFileSync(configFile));
    if (a.lang) {
      currentLang = a.lang;
    }
  } catch (err) {
    console.error('Could not parse JSON');
  }
}
const myText = {
  'alert:skip': {
    en: 'Skip alert',
    ru: 'Пропустить оповещение',
    fr: "Passer l'alerte",
    es: "Saltar alerta"
  },
  'alert:stop': {
    en: 'Stop/Resume alerts',
    ru: 'Остановить/Продолжить оповещения',
    fr: 'Arrêter/Reprendre alertes',
    es: "Parar/pausar las alertas"
  },
  'song:skip': {
    en: 'Skip song',
    ru: 'Пропустить песню',
    fr: 'Passer la chanson',
    es: 'Saltar la canción'
  },
  'song:stop': {
    en: 'Stop/Resume song',
    ru: 'Остановить/Продолжить песню',
    fr: 'Arrêter reprendre la chanson',
    es: 'Parar/pausar las alertas'
  },
  'song:show': {
    en: 'Show/Hide video',
    ru: 'Показать/Скрыть видео',
    fr: 'Masquer/afficher la vidéo',
    es: 'Mostrar/Ocular vídeo'
  },
  'keyboard:warning': {
    en: 'DEPENDING ON YOUR KEYBOARD-LAYOUT SOME COMBINATIONS MAY NOT WORK!',
    ru: 'В зависимости от вашей раскладки на клавиатуре некоторые комбинации могут не работать!',
    fr: 'CERTAINES COMBINAISONS PEUVENT NE PAS FONCTIONNER EN FONCTION DE VOTRE CLAVIER !',
    es: 'DEPENDE DEL DISEÑO DE TU TECLADO, PUEDE QUE ALGUNAS COMBINACIONES NO FUNCIONEN'
  },
  'keyboard:available': {
    en: 'Available keys:',
    ru: 'Доступные клавиши:',
    fr: 'Touches disponibles',
    es: 'Teclas disponibles'
  },
  'keyboard:punctuations': {
    en: 'Punctuations',
    ru: 'Punctuations',
    fr: 'Ponctuations',
    es: 'Sigos de puntuación',
  },
  'keyboard:alias:enter': {
    en: 'or Enter as alias',
    ru: 'or Enter as alias',
    fr: 'ou Entrée',
    es: 'o Intro como alias'
  },
  'keyboard:alias:esc': {
    en: 'or Esc for short',
    ru: 'or Esc for short',
    fr: 'ou Esc',
    es: 'o escape como alias'
  },
  settings: {
    en: 'Settings',
    ru: 'Настройки',
    fr: 'Réglages',
    es: 'Ajustes'
  },
  authentication: {
    en: 'Authentication',
    ru: 'Авторизация',
    fr: 'Connexion',
    es: 'Autenticación'
  },
  jwt: {
    en: 'Your JWT Token...',
    ru: 'Ваш JWT Token...',
    fr: 'Votre Token JWT...',
    es: 'Tu token JWT...'
  },
  oauth: {
    en: 'Your Oauth Token... (for chat display)',
    ru: 'Ваш Oauth Token...(чат-дисплей)',
    fr: 'Votre Oauth JWT...(affichage de chat)',
    es: 'Tu token Oauth... (para mostrar el chat)'
  },
  'jwt:link': {
    en: 'You can find it under ',
    ru: 'Вы можете это найти там ',
    fr: 'Disponible dans ',
    es: 'Puedes encontrarlo debajo'
  },
  account: {
    en: 'My Account',
    ru: 'Ваш аккаунт',
    fr: 'Mon Compte',
    es: 'Mi cuenta'
  },
  'keyboard:bindings': {
    en: 'Keybindings',
    ru: 'Сочетания клавиш',
    fr: 'Raccourcis clavier',
    es: 'Atajos de teclado'
  },
  'keyboard:bindings:info': {
    en: 'Show info about keybindings',
    ru: 'Показать информацию о сочетаниях клавиш',
    fr: "Plus d'infos sur les raccourcis clavier",
    es: 'Mostrar información sobre los atajos de teclado'
  },
  other: {
    en: 'Other',
    ru: 'Другие',
    fr: 'Divers',
    es: 'Otro'
  },
  'use:sr': {
    en: 'Use Songrequest: ',
    ru: 'Использовать Songrequest: ',
    fr: 'Activer le songrequest : ',
    es: 'Usar Songrequest'
  },
  'use:compact': {
    en: 'Use Compact Mode: ',
    ru: 'Использовать компактный режим: ',
    fr: 'Activer le mode réduit : ',
    es: 'Usar modo compacto'
  },
  'session:reset': {
    en: 'Reset Session',
    ru: 'Сбросить сессию',
    fr: 'Réinitialiser la session',
    es: 'Reiniciar la sesión',
  },
  updating: {
    en: '&nbsp;&nbsp;Updating',
    ru: '&nbsp;Обновляем',
    fr: '&nbsp;Chargement',
    es: '&nbsp;&nbsp;Actualizando'
  },
  'jwt:invalid': {
    en: 'You entered an invalid <a>JWT Token</a>.',
    ru: 'Вы ввели неправильный <a>JWT Token</a>.',
    fr: 'Votre <a>Token JWT</a> est invalide.',
    es: 'Has introducido un <a>Token JWT</a> inválido'
  },
  'jwt:500': {
    en: 'Something is wrong on our site...',
    ru: 'Что-то не так на нашем сервисе...',
    fr: 'Oops! Notre site est inaccessible...',
    fr: 'Algo ha fallado al conectar a nuestro sitio'
  },
  'jwt:missing': {
    en: 'To use the activity feed, please enter your <a>JWT Token</a> in the settings menu.',
    ru: 'Для получения оповещений, пожалуйста введите ваш <a>JWT Token</a> в меню настроек.',
    fr: "Pour utiliser le fil d'actualité, veuillez saisir votre <a>Token JWT</a> dans les réglages.",
    es: 'Para usar la feed, por favor introduce tu <a>JWT Token</a> en los ajustes '
  },
  loading: {
    en: '&nbsp;&nbsp;&nbsp;Loading',
    ru: 'Загружаемся',
    fr: '&nbsp;&nbsp;Chargement',
    es: '&nbsp;&nbsp;&nbsp;Cargando'
  },
  done: {
    en: 'Done',
    ru: 'сделанный',
    fr: 'Terminé',
    es: 'Hecho'
  },
  customBotName: {
    en: 'Custom bot name',
    ru: 'Кастомное название бота',
    fr: 'Nom du bot personnalisé',
    es: 'Nombre personalizado para el bot'
  },
  Name: {
    en: 'Name',
    ru: 'Имя',
    fr: 'Nom',
    es: 'Nombre'
  },
  'bot:test': {
    en: 'Test Bot',
    ru: 'Тест бот',
    fr: 'Bot de test',
    es: 'Bot de prueba'
  },
  'bot:generate': {
    en: 'You can generate your OAuth Token ',
    ru: 'Вы можете создать токен авторизации ',
    fr: 'Vous pouvez générer votre Token OAuth ',
    es: 'Puedes generar tu Token Oauth'
  },
  here: {
    en: 'here',
    ru: 'тут',
    fr: 'ici',
    es: 'aquí'
  }
};

/**
 * @param {string} str
 */
function atob(str) {
  return Buffer.from(str, 'base64').toString('binary');
}

/**
 * @param {string} token
 */
function checkValidToken(token) {
  return new Promise((resolve, reject) => {
    got.get(`https://${api}/kappa/v2/channels/me`, {
      headers: {
        authorization: `Bearer ${token}`
      }
    }).then(res => {
      try {
        resolve({
          valid: true,
          username: JSON.parse(res.body).username
        });
      } catch (err) {
        resolve({
          valid: true,
          username: '#'
        });
      }
    }).catch(err => {
      reject(err);
    });
  });
}

/**
 * @param {string} jwt
 */
async function canUseBot(jwt) {
  try {
    const channelId = JSON.parse(atob(jwt.split('.')[1])).channel;
    const req0 = await got.get(`https://${api}/kappa/v2/bot/${channelId}`, {
      json: true,
      headers: {
        authorization: `Bearer ${jwt}`
      }
    });
    if (req0.body.bot.allowCustomName) {
      return true;
    }
    const req1 = await got.get(`https://${api}/kappa/v2/channels/me`, {
      json: true,
      headers: {
        authorization: `Bearer ${jwt}`
      }
    });
    const req2 = await got.get(`https://api.twitch.tv/api/channels/${req1.body.username}/panels`, {
      json: true,
      headers: {
        'client-id': 'sv6t1c3j2s5uuz3elxftm7s1bx54b31'
      }
    });
    const panels = req2.body;
    for (let i = 0; i < panels.length; i++) {
      if (/^https:\/\/streamelements\.com\/tip\/.+$/.test(panels[i].data.link)) {
        return true;
      }
    }
  } catch (err) {
    // It will return false
  }
  return false;
}


/**
 * @param {() => any} func
 * @param {number} wait in ms
 * @param {bool} immediate
 */
function debounce(func, wait, immediate) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments; // eslint-disable-line prefer-rest-params
    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

try {
  module.exports = {
    atob, url, api, cBotApi, pack, configLocation, configFile, checkValidToken, debounce, canUseBot
  };
} catch (err) {
  // Not loaded with require()
}
