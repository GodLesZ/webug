var backgroundPage = chrome.extension.getBackgroundPage();

$(function () {
    console.log('Start loading..');
    backgroundPage.SettingStorage.load(function (options) {
        console.log('Got data:', options);
        $('#option-display-files').prop('checked', options.showFileAndLineInformation);
    });

    $('#save')
        .click(function (e) {
            var data = {
                showFileAndLineInformation: $('#option-display-files').prop('checked')
            };

            console.log('Start saving..');
            backgroundPage.SettingStorage.save(data, function () {
                console.log('Done');
                var $status = $('#status');
                $status.text('Options saved.');

                setTimeout(function () {
                    $status.text('');
                }, 750);
            });
        })

});