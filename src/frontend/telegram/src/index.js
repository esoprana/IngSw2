'use strict'


const Telegram = require('telegram-node-bot')
const fs = require('fs')
const TelegramBaseController = Telegram.TelegramBaseController
const TextCommand = Telegram.TextCommand
const tg = new Telegram.Telegram('429072411:AAGrDMFv_kQAtwRq28hlEK3kO3ih-CEjKH4')//@ingSw2bot
const menu = require('./menu.js');


class StartController extends TelegramBaseController {

    /**
    * @param {Scope} $
    */
    startHandler($) {

        let menuScelta = {
            layout: 1,
            method: "sendMessage",
            params: ["Come posso aiutarti?"],
            menu: [
                {
                    text: "Informazioni sull'orario",
                    callback: (callbackQuery, message) => {
                        $.sendMessage('recupero dei dati dal server... potrebbe volerci qualche istante! :)')
                        menu.init($)
                    }
                },
                {
                    text: "Informazioni sulle sessioni",
                    callback: (callbackQuery, message) => {
                        $.sendMessage('recupero dei dati dal server... potrebbe volerci qualche istante! :)')
                        menu.init($, true);
                    }
                }
            ]
        };
        $.runInlineMenu(menuScelta)
    }


    get routes() {
        return { 'startCommand': 'startHandler' }
    }
}
class OtherwiseController extends TelegramBaseController {

    handle($) { $.sendMessage('What?!') }
}


tg.router
    .when(
    new TextCommand('/start', 'startCommand'),
    new StartController()
    ).otherwise(new OtherwiseController)
