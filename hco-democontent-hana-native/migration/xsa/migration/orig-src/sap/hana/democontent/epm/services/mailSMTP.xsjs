$.import("sap.hana.democontent.epm.services", "messages");
var textAccess = $.import("sap.hana.xs.i18n", "text");
var bundle = textAccess.loadBundle("sap.hana.democontent.epm.i18n", "messages");

var conn = $.hdb.getConnection();
var rs, pstmt, pc, result, lv_host, lv_port;

var MESSAGES = $.sap.hana.democontent.epm.services.messages;

var aCmd = encodeURI($.request.parameters.get('cmd'));
var email = $.request.parameters.get('email');
var soid = $.request.parameters.get('soid');

//check SMTP is configured		    
function checkSMTP() {

    try {
        //Check if the the index server parameters for smtp host and port are set
        var query = 'select * from PUBLIC.M_INIFILE_CONTENTS WHERE FILE_NAME = ? AND LAYER_NAME = ? AND SECTION = ? AND KEY = ?';
        rs = conn.executeQuery(query, 'xsengine.ini', 'SYSTEM', 'smtp', 'server_host');

        if (rs.length < 1) {
            // if no entry, throw a response as 'SMTP Host is not configured'
            $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
            $.response.setBody(bundle.getText("SMTP_CONFIG"));
        } else {
            // read the host name
            lv_host = rs[0].VALUE;

            // If host is empty ,throw a response as 'SMTP Host is not configured'
            if (lv_host === "" || lv_host === "localhost") {
                $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
                $.response.setBody(bundle.getText("SMTP_CONFIG"));
            } else {
                query = 'select * from PUBLIC.M_INIFILE_CONTENTS WHERE FILE_NAME = ? AND LAYER_NAME = ? AND SECTION = ? AND KEY = ?';
                rs = conn.executeQuery(query, 'xsengine.ini', 'SYSTEM', 'smtp', 'server_port');
                if (rs.length > 1) {
                    lv_port = rs[0].VALUE;

                    //If port is empty ,throw a response as 'SMTP Port is not configured'
                    if (lv_port === "") {
                        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
                        $.response.setBody(bundle.getText("SMTP_PORT_CONFIG"));
                    }

                }
            }
            conn.close();
        }

    } catch (e) {
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        $.response.setBody(bundle.getText("SMTP_MAIL_NOT_SEND"));
    }
}

function sendMail() {

    //If the SMTP configuration is set,send an email with the PO ID details to the sender email 
    try {

        var mail = new $.net.Mail({
            sender: "donotreply@sap.com",
            to: email,
            subject: bundle.getText("SMTP_MAIL_SUBJECT", [soid]),
            subjectEncoding: "UTF-8",
            parts: [new $.net.Mail.Part({
                type: $.net.Mail.Part.TYPE_TEXT,
                text: bundle.getText("SMTP_MAIL_TEXT", [soid]),
                contentType: "text/plain",
                encoding: "UTF-8"
            })]
        });

        var returnValue = mail.send();

        var response = bundle.getText("SMTP_RESPONSE", [returnValue.messageId, returnValue.finalReply]);
        $.response.status = $.net.http.OK;
        $.response.contentType = "text/html";
        $.response.setBody(response);

    } catch (e) {
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        $.response.setBody(bundle.getText("SMTP_MAIL_NOT_SEND"));
    }
}

switch (aCmd) {
    case "checkSMTP":
        checkSMTP();
        break;
    case "sendMail":
        sendMail();
        break;
    default:
        $.response.status = $.net.http.BAD_REQUEST;
        $.response.setBody(MESSAGES.getMessage('SEPM_ADMIN', '002', aCmd));
}