$.import("sap.hana.democontent.epm.services", "messages");
var MESSAGES = $.sap.hana.democontent.epm.services.messages;


function deletePO() {
    var body = '';
    var purchaseOrderID = $.request.parameters.get('PURCHASEORDERID');
    purchaseOrderID = purchaseOrderID.replace("'", "");
    if (purchaseOrderID === null) {
        $.response.status = $.net.http.BAD_REQUEST;
        $.response.setBody(MESSAGES.getMessage('SEPM_POWRK', '012'));
        return;
    }

    var conn = $.hdb.getConnection();
    var rs;
    var query;

    try {
        // Read Current Status for PO
        query = 'SELECT LIFECYCLESTATUS, APPROVALSTATUS, CONFIRMSTATUS, ORDERINGSTATUS, INVOICINGSTATUS ' + 'from "sap.hana.democontent.epm.data::PO.Header" where PURCHASEORDERID = ?';
        rs = conn.executeQuery(query, purchaseOrderID);
    } catch (e) {
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        $.response.setBody(e.message);
        return;
    }

    if (rs.length < 1) {
        $.response.status = $.net.http.BAD_REQUEST;
        $.response.setBody(MESSAGES.getMessage('SEPM_POWRK', '013',
            encodeURI(purchaseOrderID))); // Invalid purchase order number specified
        return;
    }

    // If Lifecycle is Closed; can't delete
    if (rs[0].LIFECYCLESTATUS === "C") {
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        // Closed purchase orders can not be deleted
        $.response.setBody(MESSAGES.getMessage('SEPM_POWRK', '014'));
        return;
    }

    // If Lifecycle is Cancelled; can't delete
    if (rs[0].LIFECYCLESTATUS === "X") {
        // Purchase Order &1 has already been deleted
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        $.response.setBody(MESSAGES.getMessage('SEPM_POWRK', '015',
            encodeURI(purchaseOrderID))); 
        return;
    }

    // If Approval is Approved; can't delete
    if (rs[0].APPROVALSTATUS === "A") {
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        // Approved Purchase Orders can not be deleted
        $.response.setBody(MESSAGES.getMessage('SEPM_POWRK', '016')); 
        return;
    }

    // If Confirmed is Confirmed; can't delete
    if (rs[0].CONFIRMSTATUS === "C") {
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        // Confirmed Purchase Orders can not be deleted
        $.response.setBody(MESSAGES.getMessage('SEPM_POWRK', '017')); 
        return;
    }

    // If Confirmed is Sent; can't delete
    if (rs[0].CONFIRMSTATUS === "S") {
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        // Confirmed Purchase Orders which have been sent
        // to the partner can not be deleted
        $.response.setBody(MESSAGES.getMessage('SEPM_POWRK', '018')); 
        return;
    }

    // If Delivered; can't delete
    if (rs[0].ORDERINGSTATUS === "D") {
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        // Delivered Purchase Orders can not be deleted
        $.response.setBody(MESSAGES.getMessage('SEPM_POWRK', '019')); 
        return;
    }

    // If Invoiced; can't delete
    if (rs[0].INVOICINGSTATUS === "D") {
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        // Invoiced Purchase Orders can not be delete
        $.response.setBody(MESSAGES.getMessage('SEPM_POWRK', '020')); 
        return;
    }

    try {
        // Update Purchase Order Status in order to delete it
        query = "UPDATE \"sap.hana.democontent.epm.data::PO.Header\" set LIFECYCLESTATUS = 'X' where PURCHASEORDERID = ?";
        conn.executeUpdate(query, purchaseOrderID);
        conn.commit();
        conn.close();
    } catch (err) {
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        $.response.setBody(err.message);
        return;
    }

    body = MESSAGES.getMessage('SEPM_POWRK', '021'); // Success
    $.trace.debug(body);
    $.response.contentType = 'application/text';
    $.response.setBody(body);
    $.response.status = $.net.http.OK;

}

function approvePO() {
    var body = '';
    var purchaseOrderID = $.request.parameters.get('PURCHASEORDERID');
    purchaseOrderID = purchaseOrderID.replace("'", "");
    if (purchaseOrderID === null) {
        $.response.status = $.net.http.BAD_REQUEST;
        // No purchase order specified
        $.response.setBody(MESSAGES.getMessage('SEPM_POWRK', '012')); 
        return;
    }
    var action = $.request.parameters.get('Action');
    if (action === null) {
        $.response.status = $.net.http.BAD_REQUEST;
        // No Purchase Order Action Supplied
        $.response.setBody(MESSAGES.getMessage('SEPM_POWRK', '022')); 
        return;
    }

    switch (action) {
        case "Reject":
            break;
        case "Accept":
            break;
        default:
            $.response.status = $.net.http.BAD_REQUEST;
            // Action &1 is an invalid choice
            $.response.setBody(MESSAGES.getMessage('SEPM_POWRK', '023', encodeURI(action))); 
            return;
    }
    var conn = $.hdb.getConnection();
    var rs;
    var query;
    try {
        
         
        // Read Current Status for PO
        query = 'SELECT LIFECYCLESTATUS, APPROVALSTATUS, CONFIRMSTATUS, ORDERINGSTATUS, INVOICINGSTATUS ' + 'from "sap.hana.democontent.epm.data::PO.Header" where PURCHASEORDERID = ?';
        rs = conn.executeQuery(query, purchaseOrderID);
    } catch (e) {
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        $.response.setBody(e.message);
        return;
    }

    if (rs.length < 1) {
        $.response.status = $.net.http.BAD_REQUEST;
        $.response.setBody(MESSAGES.getMessage('SEPM_POWRK', '013',
            encodeURI(purchaseOrderID))); // Invalid purchase order number specified
        return;
    }

    // If Lifecycle is Closed; can't approve or reject
    if (rs[0].LIFECYCLESTATUS === "C") {
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        // Closed purchase orders can not be accepted or rejected
        $.response.setBody(MESSAGES.getMessage('SEPM_POWRK', '024')); 
        return;
    }

    // If Lifecycle is Cancelled; can't delete
    if (rs[0].LIFECYCLESTATUS === "X") {
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        // Deleted purchase orders can not be accepted or rejected
        $.response.setBody(MESSAGES.getMessage('SEPM_POWRK', '025')); 
        return;
    }

    // If Confirmed is Confirmed; can't delete
    if (rs[0].CONFIRMSTATUS === "C") {
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        // Confirmed Purchase Orders can not be rejected
        $.response.setBody(MESSAGES.getMessage('SEPM_POWRK', '026')); 
        return;
    }

    // If Confirmed is Sent; can't delete
    if (rs[0].CONFIRMSTATUS === "S") {
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        // Confirmed Purchase Orders which have been 
        // sent to the partner can not be rejected
        $.response.setBody(MESSAGES.getMessage('SEPM_POWRK', '027')); 
        return;
    }

    // If Delivered; can't delete
    if (rs[0].ORDERINGSTATUS === "D") {
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        // Delivered Purchase Orders can not be rejected
        $.response.setBody(MESSAGES.getMessage('SEPM_POWRK', '028')); 
        return;
    }

    // If Invoiced; can't delete
    if (rs[0].INVOICINGSTATUS === "D") {
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        // Invoiced Purchase Orders can not be rejected
        $.response.setBody(MESSAGES.getMessage('SEPM_POWRK', '029')); 
        return;
    }

    try {

        // Update Purchase Order Status in order to delete it
        if (action === "Reject") {
            query = "UPDATE \"sap.hana.democontent.epm.data::PO.Header\" set APPROVALSTATUS = 'R' where PURCHASEORDERID = ?";
        }

        if (action === "Accept") {
            query = "UPDATE \"sap.hana.democontent.epm.data::PO.Header\" set APPROVALSTATUS = 'A' where PURCHASEORDERID = ?";
        }

        conn.executeUpdate(query, purchaseOrderID);
        conn.commit();
        conn.close();
    } catch (err) {
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        $.response.setBody(err.message);
        return;
    }

    body = MESSAGES.getMessage('SEPM_POWRK', '021'); // Success
    $.trace.debug(body);
    $.response.contentType = 'application/text';
    $.response.setBody(body);
    $.response.status = $.net.http.OK;

}

var aCmd = $.request.parameters.get('cmd');
switch (aCmd) {
    case "delete":
        deletePO();
        break;
    case "approval":
        approvePO();
        break;
    default:
        $.response.status = $.net.http.BAD_REQUEST;
        $.response.setBody(MESSAGES.getMessage('SEPM_ADMIN', '002', encodeURI(aCmd)));
}