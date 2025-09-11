var query;
var createUserXmlTable = function(connection,tableName){
    connection.executeUpdate('CREATE COLUMN TABLE ' + tableName + ' (xml TEXT)');
};

var excuteInsert = function(connection,tableName,xmlList){
    var i = 0;
    while(i < xmlList.data.length){
        xmlList.data[i] = xmlList.data[i].replace(/\s+/g, " ");
        query = 'INSERT INTO ' + tableName + ' values(?)';
        connection.executeUpdate(query,xmlList.data[i]);
        connection.commit();
        i++;
    }
};

var insertXmlDataToTable = function(xmlList){
    var connection = $.hdb.getConnection();
    var userSchema = $.session.getUsername();
    var tableName = "USR_XML_DATA";
    var query = 'SELECT table_name FROM TABLES WHERE schema_name = ? AND table_name = ?';
    var rs = connection.executeQuery(query,userSchema,tableName);
    if(!rs.length){
        createUserXmlTable(connection,tableName);
    }
    excuteInsert(connection,tableName,xmlList);
    connection.commit();
    connection.close();
};