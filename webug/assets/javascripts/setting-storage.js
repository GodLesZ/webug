var SettingStorageData = {
    showFileAndLineInformation: true
};

var SettingStorage = {
    DEFAULTS: SettingStorageData,

    save: function (opts, callback) {
        var data = SettingStorage.getExtended(opts);
        chrome.storage.sync.set(data, callback);
    },

    load: function (callback, defaults) {
        chrome.storage.sync.get(SettingStorage.getExtended(defaults || {}), callback);
    },

    getExtended: function(opts) {
        return $.extend(true, {}, SettingStorage.DEFAULTS, opts);
    }
};