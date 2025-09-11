//Inserts timestamp into the 'JobsDemo' table.
function createEntry(input) {
    var conn = $.hdb.getConnection();
    var comment = input.description; 
    var desc = "'" + comment + "'";

    var query = 'insert into "sap.hana.democontent.epm.data::JobsDemo.Details"(TIME,SOURCE) values (now(), ' + desc + ')';
    conn.executeUpdate(query);
    conn.commit();   
    conn.close();
}