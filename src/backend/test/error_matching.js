expect.extend({
	toMatchError(received,argument){
		if (received instanceof Error) {
			if(received.message == argument) {
				return {
					message: () => ``,
					pass: true,
				};
			} else {
				return {
					message: () =>
						this.utils.matcherHint('.toMatchError') +
						'\n\n' +
						`Expected message of error to be :\n` +
						`  ${this.utils.printExpected(argument)}\n` +
						`Received:\n` +
						`  ${this.utils.printReceived(received.message)}`,
					pass: false,
				};
			}
		} else {
			return {
				message: () =>
						this.utils.matcherHint('.toMatchError') +
						'\n\n' +
						`Expected type ${this.utils.printExpected('Error')} `+
						`but type of object is ${this.utils.printReceived(typeof received)}`,
				pass: false,
			};
		}
	},
	toMatchLengthErrorLines(received,argument){
		if(received instanceof Error){
			const s = received.message.split('\n');
			if((s.length) == argument) {
				return {
					message: () => ``,
					pass: true,
				};
			} else {
				return {
					message: () =>
						this.utils.matcherHint('.toMatchLengthErrorLines') +
						'\n\n' +
						`Expected number of lines of the error message to be :\n` +
						`  ${this.utils.printExpected(argument)}\n` +
						`Received:\n` +
						`  ${this.utils.printReceived(s.length)}\n` +
						`with\n` +
						`${this.utils.printReceived(received.message)}`,
					pass: false,
				};
			}
		} else {
			return {
				message: () =>
						this.utils.matcherHint('.toMatchLengthErrorLines') +
						'\n\n' +
						`Expected type ${this.utils.printExpected('Error')} `+
						`but type of object is ${this.utils.printReceived(typeof received)}`,
				pass: false,
			};
		}
	}
});
