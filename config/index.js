const deepAssign = require('deep-assign');
const fs = require('fs');
let mailerUsername, mailerPassword;

try {
  mailerUsername = fs.readFileSync('/run/secrets/mail_user', 'utf-8')
} catch (err) {
  mailerUsername = ''
}
try {
  mailerPassword = fs.readFileSync('/run/secrets/mail_password', 'utf-8')
} catch (err) {
  mailerPassword = ''
}

const config = {
	default: {
		port: 8084,
		postgres: {
			host: process.env.DB_HOST || 'postgres-oms-statutory',
			port: parseInt(process.env.DB_PORT) || 5432,
			username: parseInt(process.env.USERNAME) || 'postgres',
			password: parseInt(process.env.PASSWORD) || 'postgres',
			database: parseInt(process.env.DB_DATABASE) ||'statutory'
		},
		registry: {
			url: 'http://omsserviceregistry',
			port: 7000
    },
    mailer: {
      host: process.env.MAILER_HOST || 'mail.aegee.org',
      port: parseInt(process.env.MAILER_PORT) || 25,
      username: mailerUsername,
      password: mailerPassword
    },
		media_dir: '/usr/app/media',
		media_url: '/frontend/media',
		bugsnagKey: process.env.BUGSNAG_KEY || ''
	},
	development: {

	},
	test: {
		port: 8085,
		postgres: {
			host: 'localhost',
			database: 'statutory-testing'
		},
		registry: {
			url: 'http://localhost',
			port: 7000
		},
		enable_user_caching: false,
		media_dir: './tmp_upload',
		bugsnagKey: 'CHANGEME'
	}
}


// Assuming by default that we run in 'development' environment, if no
// NODE_ENV is specified.
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const env = process.env.NODE_ENV;

// The config.json file can contain a 'default' field and some environment
// fields. (e.g. 'development'). The 'default' field is loaded first, if exists,
// and then its fields are overwritten by the environment field, if exists.
// If both 'default' and environment fields are missing, than there's no config
// and we throw an error.
if (!config[env] && !config.default) {
    throw new Error(`Both 'default' and '${process.env.NODE_ENV}' are not set in lib/config.json; \
cannot run without config.`);
}

// If we have the default config, set it first.
let appConfig = config.default || {};

// If we have the environment config, overwrite the config's fields with its fields
if (config[env]) {
    appConfig = deepAssign(appConfig, config[env]);
}

module.exports = appConfig;
