var fs = require('fs');
let path = require('path');
var logUtil = require('./log-util');

if(process.argv.length < 4) {
    logUtil.error('Input parameter not specified');
    process.exit(1);
}

var parameter = process.argv[2];
var mode = process.argv[3];


try {
    var xsEnvRaw = fs.readFileSync(path.join(__dirname, 'env_json'), 'utf-8');
    
    if(mode === 'service') {
        xsEnvRaw = xsEnvRaw.replace(/Getting service key ".*" for service instance.*/, '');
	xsEnvRaw = xsEnvRaw.replace(/OK/, '');
    }
   
    var xsEnv = JSON.parse(xsEnvRaw);
    var output;    

    if(mode === 'app') {
        if(!xsEnv.VCAP_SERVICES) throw new Error('No VCAP_SERVICES in app env');
        if(!xsEnv.VCAP_SERVICES.hana || xsEnv.VCAP_SERVICES.hana.length < 1) throw new Error('No hana service bound to app');
        if(!xsEnv.VCAP_SERVICES.hana[0].credentials) throw new Error('No credentials found in bound hana service');
        if(!xsEnv.VCAP_SERVICES.hana[0].credentials[parameter]) throw new Error('Variable ' + parameter + ' not found in service credentials');

        output = xsEnv.VCAP_SERVICES.hana[0].credentials[parameter];    
    }

    if(mode === 'service') {
	if(!xsEnv[parameter]) throw new Error('Variable ' + parameter + ' not found in service credentials');

        output = xsEnv[parameter];

    }

    logUtil.info(output);

} catch (error) {
    logUtil.error(`Error occured during parsing of app env: ${error.message}`);
}

