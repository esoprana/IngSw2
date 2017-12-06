'use strict'


const Telegram = require('telegram-node-bot')
const fs = require('fs')
const TelegramBaseController = Telegram.TelegramBaseController
const TextCommand = Telegram.TextCommand
const tg = new Telegram.Telegram('463633893:AAHwNAnIa6nz-thSKRJYFDNyP_5yBugeCTI')
const CustomInlineMenu = require('./CustomInlineMenu.js');

class StartController extends TelegramBaseController {

    /**
    * @param {Scope} $
    */
    startHandler($) {

        var inline_menu= new CustomInlineMenu.CustomInlineMenu($);

        inline_menu=inline_menu.getJsonMenu();
    
        $.runInlineMenu(inline_menu)
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
 