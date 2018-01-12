var tmi = require("tmi.js");

let currentOauth = '';
let tempToken = '';

if (fs.existsSync(configFile)) {
    let a;
    try {
        a = JSON.parse(fs.readFileSync(configFile));
        if (a.lang) {
            currentOauth = a.oauth;
        }

        if (a.token) {
            tempToken = a.token;
        }
    } catch (err) {
        console.error('Could not parse JSON');
    }
}

if (currentOauth) {

    checkValidToken(tempToken).then(res => {

        var options = {
            options: {
                debug: true
            },
            connection: {
                reconnect: true
            },
            identity: {
                username: res.username,
                password: currentOauth
            },
            channels: ["#" + res.username]
        };

        var showConnectionNotices = true;

        var client = new tmi.client(options);

        // Connect the client to the server..
        client.connect();



        function formatEmotes(text, emotes) {
            var splitText = text.split('');
            for (var i in emotes) {
                var e = emotes[i];
                for (var j in e) {
                    var mote = e[j];
                    if (typeof mote == 'string') {
                        mote = mote.split('-');
                        mote = [parseInt(mote[0]), parseInt(mote[1])];
                        var length = mote[1] - mote[0],
                            empty = Array.apply(null, new Array(length + 1)).map(function () { return '' });
                        splitText = splitText.slice(0, mote[0]).concat(empty).concat(splitText.slice(mote[1] + 1, splitText.length));
                        splitText.splice(mote[0], 1, '<img class="emoticon" src="http://static-cdn.jtvnw.net/emoticons/v1/' + i + '/3.0">');
                    }
                }
            }
            return htmlEntities(splitText).join('')
        }

        function htmlEntities(html) {
            function it() {
                return html.map(function (n, i, arr) {
                    if (n.length == 1) {
                        return n.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
                            return '&#' + i.charCodeAt(0) + ';';
                        });
                    }
                    return n;
                });
            }
            var isArray = Array.isArray(html);
            if (!isArray) {
                html = html.split('');
            }
            html = it(html);
            if (!isArray) html = html.join('');
            return html;
        }


        function formatBadges(chan, user, isBot) {

            function createBadge(name) {
                var badge = document.createElement('div');
                badge.className = 'chat-badge-' + name;
                return badge;
            }

            var chatBadges = document.createElement('span');
            chatBadges.className = 'chat-badges';

            if (!isBot) {

                if (user.username == chan) {
                    chatBadges.appendChild(createBadge('broadcaster'));

                }
                if (user['user-type']) {
                    chatBadges.appendChild(createBadge(user['user-type']));
                }
                if (user.turbo) {
                    chatBadges.appendChild(createBadge('turbo'));
                }
            }
            else {
                chatChages.appendChild(createBadge('bot'));
            }

            return chatBadges;
        }

        function capitalize(n) {
            return n[0].toUpperCase() + n.substr(1);
        }


        function dehash(channel) {
            return channel.replace(/^#/, '');
        }


        client.on("chat", function (channel, user, message, self) {

            var chat = document.getElementById('chat');

            var chan = dehash(channel),
                name = user.username,
                chatLine = document.createElement('div'),
                chatChannel = document.createElement('span'),
                chatName = document.createElement('span'),
                chatColon = document.createElement('span'),
                chatMessage = document.createElement('span');

            var color = user.color;
            if (color === null) {
                if (!randomColorsChosen.hasOwnProperty(chan)) {
                    randomColorsChosen[chan] = {};
                }
                if (randomColorsChosen[chan].hasOwnProperty(name)) {
                    color = randomColorsChosen[chan][name];
                }
                else {
                    color = defaultColors[Math.floor(Math.random() * defaultColors.length)];
                    randomColorsChosen[chan][name] = color;
                }
            }

            chatLine.className = 'chat-line';
            chatLine.dataset.username = name;
            chatLine.dataset.channel = channel;

            if (user['message-type'] == 'action') {
                chatLine.className += ' chat-action';
            }

            chatChannel.className = 'chat-channel';
            chatChannel.innerHTML = chan;

            chatName.className = 'chat-name';
            chatName.style.color = color;
            chatName.innerHTML = user['display-name'] || name;

            chatColon.className = 'chat-colon';
            chatColon.innerHTML = ":  ";

            chatMessage.className = 'chat-message';

            chatMessage.innerHTML = formatEmotes(message, user.emotes);

            chatLine.appendChild(formatBadges(chan, user, self));
            chatLine.appendChild(chatName);
            chatLine.appendChild(chatColon);
            chatLine.appendChild(chatMessage);

            chat.appendChild(chatLine);
        });

        function chatNotice(information, noticeFadeDelay, level, additionalClasses) {
            var chat = document.getElementById('chat');
            var ele = document.createElement('div');

            ele.className = 'chat-line chat-notice';
            ele.innerHTML = information;

            if (additionalClasses !== undefined) {
                if (Array.isArray(additionalClasses)) {
                    additionalClasses = additionalClasses.join(' ');
                }
                ele.className += ' ' + additionalClasses;
            }

            if (typeof level == 'number' && level != 0) {
                ele.dataset.level = level;
            }

            chat.appendChild(ele);

            if (typeof noticeFadeDelay == 'number') {
                setTimeout(function () {
                    ele.dataset.faded = '';
                }, noticeFadeDelay || 500);
            }

            return ele;
        }

        var recentTimeouts = {};

        function timeout(channel, username) {
            if (!doTimeouts) return false;
            if (!recentTimeouts.hasOwnProperty(channel)) {
                recentTimeouts[channel] = {};
            }
            if (!recentTimeouts[channel].hasOwnProperty(username) || recentTimeouts[channel][username] + 1000 * 10 < +new Date) {
                recentTimeouts[channel][username] = +new Date;
                chatNotice(capitalize(username) + ' was timed-out in ' + capitalize(dehash(channel)), 1000, 1, 'chat-delete-timeout')
            };
            var toHide = document.querySelectorAll('.chat-line[data-channel="' + channel + '"][data-username="' + username + '"]:not(.chat-timedout) .chat-message');
            for (var i in toHide) {
                var h = toHide[i];
                if (typeof h == 'object') {
                    h.innerText = '<Message deleted>';
                    h.parentElement.className += ' chat-timedout';
                }
            }
        }
        function clearChat(channel) {
            if (!doChatClears) return false;
            var toHide = document.querySelectorAll('.chat-line[data-channel="' + channel + '"]');
            for (var i in toHide) {
                var h = toHide[i];
                if (typeof h == 'object') {
                    h.className += ' chat-cleared';
                }
            }
            chatNotice('Chat was cleared in ' + capitalize(dehash(channel)), 1000, 1, 'chat-delete-clear')
        }
        function hosting(channel, target, viewers, unhost) {
            if (!showHosting) return false;
            if (viewers == '-') viewers = 0;
            var chan = dehash(channel);
            chan = capitalize(chan);
            if (!unhost) {
                var targ = capitalize(target);
                chatNotice(chan + ' is now hosting ' + targ + ' for ' + viewers + ' viewer' + (viewers !== 1 ? 's' : '') + '.', null, null, 'chat-hosting-yes');
            }
            else {
                chatNotice(chan + ' is no longer hosting.', null, null, 'chat-hosting-no');
            }
        }

        client.addListener('timeout', timeout);
        client.addListener('clearchat', clearChat);
        client.addListener('hosting', hosting);
        client.addListener('unhost', function (channel, viewers) { hosting(channel, null, viewers, true) });


        client.addListener('connecting', function (address, port) {
            if (showConnectionNotices) chatNotice('Connecting', 1000, -4, 'chat-connection-good-connecting');
        });
        client.addListener('logon', function () {
            if (showConnectionNotices) chatNotice('Authenticating', 1000, -3, 'chat-connection-good-logon');
        });
        client.addListener('connectfail', function () {
            if (showConnectionNotices) chatNotice('Connection failed', 1000, 3, 'chat-connection-bad-fail');
        });
        client.addListener('connected', function (address, port) {
            if (showConnectionNotices) chatNotice('Connected', 1000, -2, 'chat-connection-good-connected');
            joinAccounced = [];
        });
        client.addListener('disconnected', function (reason) {
            if (showConnectionNotices) chatNotice('Disconnected: ' + (reason || ''), 3000, 2, 'chat-connection-bad-disconnected');
        });
        client.addListener('reconnect', function () {
            if (showConnectionNotices) chatNotice('Reconnected', 1000, 'chat-connection-good-reconnect');
        });
        client.addListener('join', function (channel, username) {
            if (username == client.getUsername()) {
                if (showConnectionNotices) chatNotice('Joined ' + capitalize(dehash(channel)), 1000, -1, 'chat-room-join');
                joinAccounced.push(channel);
            }
        });
        client.addListener('part', function (channel, username) {
            var index = joinAccounced.indexOf(channel);
            if (index > -1) {
                if (showConnectionNotices) chatNotice('Parted ' + capitalize(dehash(channel)), 1000, -1, 'chat-room-part');
                joinAccounced.splice(joinAccounced.indexOf(channel), 1)
            }
        });

        client.addListener('crash', function () {
            chatNotice('Crashed', 10000, 4, 'chat-crash');
        });

    }).catch(err => {
        if (err.statusCode < 500) {
            displayError(myText['jwt:invalid'][currentLang]);
        } else {
            console.warn(err);
            displayError(myText['jwt:500'][currentLang]);
        }
    });


}


