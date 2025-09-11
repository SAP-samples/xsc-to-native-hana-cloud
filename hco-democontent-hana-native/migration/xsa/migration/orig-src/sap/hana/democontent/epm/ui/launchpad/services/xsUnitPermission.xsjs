function createConnection() {
    return $.db.getConnection();
}
function setResponse(status,msg) {
    $.response.status = status;
    $.response.setBody(msg);
}
 function checkDUImported(oConnection) {
    var rs = oConnection.prepareStatement('select * from "_SYS_REPO"."DELIVERY_UNITS" WHERE DELIVERY_UNIT =\'HANA_TEST_TOOLS\'').executeQuery();
    if (rs.next()) {
        setResponse($.net.http.OK,"Hana Test Tools imported");
    }else{
         setResponse($.net.http.OK,"Hana Test Tools not imported");
    }
    rs.close();
}
function checkRoleExists(oConnection) {
    var ps = oConnection.prepareStatement('SELECT COUNT(*) FROM "PUBLIC"."GRANTED_ROLES" where GRANTEE = ? AND ROLE_NAME in (\'sap.hana.testtools.common::TestExecute\',\'sap.hana.democontent.epm.roles::Admin\')');
    ps.setString(1, $.session.getUsername());
    var rs = ps.executeQuery();
    if (rs.next()) {
        if(rs.getInteger(1) === 2){
            setResponse($.net.http.OK,"Test Execute Role available");
        }else{
            setResponse($.net.http.OK,"Test Execute Role not available");
        }
    }else{
         setResponse($.net.http.OK,"Test Execute Role not available");
    }
    rs.close();
    ps.close();
} 
try {
    var connection = createConnection();
    var cmd = $.request.parameters.get('cmd');
    switch (cmd) {
        case "DU":
            checkDUImported(connection);
            break;
        case "Role":
            checkRoleExists(connection);
            break;
        default:
            setResponse($.net.http.OK,"Invalid Command");
    connection.close();
    }
} catch (e) {
    setResponse($.net.http.INTERNAL_SERVER_ERROR,e);
}