module.exports = {
	beforeInit: ['doctor'],	// commands before the running command
	afterInit: [],	// commands after the running command
	reserveCmd: ['config', 'list', 'doctor'], // reserve commands
};