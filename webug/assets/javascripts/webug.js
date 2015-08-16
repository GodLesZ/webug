var isPoweredOn = true;

function processWfHeaders(headers) {
    var messages       = [];
    var currentMessage = '';
    for (var i in headers) {
        if (!headers.hasOwnProperty(i)) {
            continue;
        }

        var wf_header = headers[i]['name'].match(/^X-Wf-1-(\d+)-1-(\d+)/i);
        if (!wf_header) {
            continue;
        }

        var m = headers[i]['value'].match(/^(\d+)?\|(.*)\|/i);

        currentMessage += m[2];

        if (headers[i].value.charAt(headers[i].value.length - 1) === "\\") {
            // this is a partial message (or continuation)
            continue;
        }

        try {
            var entry = jQuery.parseJSON(currentMessage);
            messages.push(entry)
        }
        catch (e) {
            console.log('could not parse', currentMessage);
        }

        currentMessage = '';
    }

    if (currentMessage.length > 0) {
        throw new Error('Unfinished Wildfire header: ' + currentMessage);
    }

    return messages;
}

function logToTab(tabId, meta, type, message, label) {
    var data = {
        type:     'webug.log',
        meta:     meta,
        log_type: type,
        message:  message,
        label:    label
    };

    chrome.tabs.sendMessage(tabId, data);
}

chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.browserAction.setBadgeText({'text': ''});
    isPoweredOn = !isPoweredOn;

    var icon = 'FirePHP_19';
    if (!isPoweredOn) {
        icon = 'FirePHP_19_gray';
    }

    chrome.browserAction.setIcon({path: 'assets/images/'+icon+'.png'});
});

chrome.webRequest.onBeforeSendHeaders.addListener(
    function (details) {
        if (!isPoweredOn) {
            return {};
        }

        details.requestHeaders.push({
            name:  'X-FirePHP',
            value: '0.4.4'
        });
        details.requestHeaders.push({
            name:  'X-FirePHP-Version',
            value: '0.4.4'
        });
        details.requestHeaders.push({
            name:  'X-Wf-Max-Combined-Size',
            value: '262144'
        });

        return {
            requestHeaders: details.requestHeaders
        };
    }, {
        urls:  ['<all_urls>'],
        types: ['main_frame', 'xmlhttprequest']
    },
    ['blocking', 'requestHeaders']
);

chrome.webRequest.onHeadersReceived.addListener(
    function (details) {
        if (!isPoweredOn) {
            return {};
        }

        var messages = processWfHeaders(details.responseHeaders);
        for (var i in messages) {
            if (!messages.hasOwnProperty(i)) {
                continue;
            }

            var message = messages[i],
                label   = message[0]['Label'],
                text    = message[1],
                type    = message[0]['Type'];

            switch (type) {
                case 'GROUP_START':
                    logToTab(details.tabId, message[0], 'group', label);
                    break;

                case 'GROUP_END':
                    logToTab(details.tabId, message[0], 'groupEnd', '');
                    break;

                case 'TABLE':
                    logToTab(details.tabId, message[0], 'table', text, label);
                    break;

                case 'WARN':
                    logToTab(details.tabId, message[0], 'warn', text, label);
                    break;

                case 'ERROR':
                    logToTab(details.tabId, message[0], 'error', text, label);
                    break;

                case 'INFO':
                    logToTab(details.tabId, message[0], 'info', text, label);
                    break;

                case 'DEBUG':
                    logToTab(details.tabId, message[0], 'debug', text, label);
                    break;

                default:
                    logToTab(details.tabId, message[0], 'log', text, label);
            }
        }

        return {};
    }, {
        urls:  ['<all_urls>'],
        types: ['main_frame', 'xmlhttprequest']
    },
    ['responseHeaders']
);
