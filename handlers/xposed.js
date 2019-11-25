const Telegram = require('telegram-node-bot')
const TelegramBaseController = Telegram.TelegramBaseController;

var request = require('request');
var requestPromise = require('request-promise');

const JSDOM = require('jsdom')
const config = require('../config')

class XposedController extends TelegramBaseController {

    search($) {

        if (!$.command.success || $.command.arguments.length === 0) {
            $.sendMessage("Usage: /xposed _keywords_", {
                parse_mode: "markdown",
                reply_to_message_id: $.message.messageId
            });
            return;
        }

        var keyword = $.command.arguments.join(" ");

        request.post("https://repo.xposed.info/views/ajax", {
            form: {
                "combine": keyword,
                "view_name": "module_overview",
                "view_display_id": "module_overview",
                "view_base_path": "module_overview",
                "view_path": "module_overview",
            },
            headers: {
                "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:58.0) Gecko/20100101 Firefox/58.0",
            }
        }, async function (error, response, body) {
            var json = JSON.parse(body);
            var dom = new JSDOM.JSDOM(json[1].data);

            var results = dom.window.document.querySelectorAll(".ds-1col");

            if (!results || results.length === 0) {
                $.sendMessage("*No modules found*", {
                    parse_mode: "markdown",
                    reply_to_message_id: $.message.messageId
                });
                return;
            }

            var msg = "*Modules search results:*\n";
            var loopCount = results.length > 5 ? 5 : results.length
            for (var i = 0; i < loopCount; i++) {

                var details = await getXposedDetails("http://repo.xposed.info" + results[i].querySelector("a").href)

                var domdetails = new JSDOM.JSDOM(details);

                var version = domdetails.window.document.querySelector(".field-name-field-version-number .even").textContent;

                var downloadLink = domdetails.window.document.querySelector(".field-name-field-download .even a").href;

                var appName = results[i].querySelector("a").textContent.replace("[", "").replace("]", "")

                msg += "[" + appName + " " + version + " ](" + downloadLink + ")\n"

            }

            $.sendMessage(msg, {
                parse_mode: "markdown",
                reply_to_message_id: $.message.messageId
            });

        });
    }


    get routes() {
        return {
            'xposedHandler': 'search',
        }
    }

    get config() {
        return {
            commands: [{
                command: "/xposed",
                handler: "xposedHandler",
                help:"Get latest xposed package, and search for addons"
            }],
            type: config.commands_type.XPOSED
        }
    }
}

async function getXposedDetails(url) {

    // Return new promise
    // Do async job
    return await requestPromise.get(url)

}



module.exports = XposedController;
