const Telegram = require('telegram-node-bot')
const TelegramBaseController = Telegram.TelegramBaseController;

var request = require('request');
const JSDOM = require('jsdom')
const BotUtils = require('../utils')
const config = require('../config')

class CarbonController extends TelegramBaseController {

    triggerCommand($) {
        BotUtils.getRomFilter($, this.search)
    }

    search($) {

        var kb = {
            inline_keyboard: []
        };

        if (!$.command.success || $.command.arguments.length === 0) {
            $.sendMessage("Usage: /carbon device", {
                parse_mode: "markdown",
                reply_to_message_id: $.message.messageId
            });
            return;
        }

        var keyword = $.command.arguments[0]

        request.get('https://get.carbonrom.org/device-' + keyword + '.html',
            function (error, response, body) {

                if (response.statusCode === 404) {
                    // Fallback to bb
                    BotUtils.getJSON("https://basketbuild.com/api4web/devs/CarbonROM/" + keyword,
                        function (json, err) {

                            var files = json.files.sort(function (a, b) {
                                a = a.fileTimestamp;
                                b = b.fileTimestamp;
                                return a > b ? -1 : a < b ? 1 : 0;
                            })

                            var msg = "🔍 *CarbonROM Build for " + keyword + " *: \n";

                            kb.inline_keyboard.push(
                                [{
                                    text: files[0].file,
                                    url: "https://basketbuild.com/uploads/devs/CarbonROM/" + keyword + "/" + files[0].file
                                }]);

                            $.sendMessage(msg, {
                                parse_mode: "markdown",
                                reply_markup: JSON.stringify(kb),
                                reply_to_message_id: $.message.messageId
                            });

                        })
                } else {

                    var results = new JSDOM.JSDOM(body);

                    var msg = "🔍 *CarbonROM Build for " + keyword + " *: \n";

                    var romTable = results.window.document.querySelector("#rom-table");

                    if (!romTable) {
                        $.sendMessage("No results", {
                            parse_mode: "markdown",
                            reply_to_message_id: $.message.messageId
                        });
                        return;
                    }

                    var tr = romTable.querySelectorAll("tr")[1];

                    var downloadLink = tr.querySelectorAll("a")[1].href;
                    var fileName = tr.querySelectorAll("a")[1].textContent;


                    if (downloadLink && fileName) {
                        kb.inline_keyboard.push(
                                [{
                                text: fileName,
                                url: downloadLink
                                }]);

                        $.sendMessage(msg, {
                            parse_mode: "markdown",
                            reply_markup: JSON.stringify(kb),
                            reply_to_message_id: $.message.messageId
                        });
                    } else {
                        $.sendMessage("No results", {
                            parse_mode: "markdown",
                            reply_to_message_id: $.message.messageId
                        });
                    }
                }
            });

    }

    get routes() {
        return {
            'carbonBuildHandler': 'triggerCommand',
        }
    }

    get config() {
        return {
            commands: [{
                command: "/carbon",
                handler: "carbonBuildHandler",
                help: "Get CarbonROM builds"
            }],
            type: config.commands_type.ROMS
        }
    }
}

module.exports = CarbonController;
