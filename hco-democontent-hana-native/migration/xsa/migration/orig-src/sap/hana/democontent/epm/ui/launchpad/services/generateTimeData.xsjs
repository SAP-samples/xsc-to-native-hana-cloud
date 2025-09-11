$.response.contentType = "application/json";
var output = {
    entry: {}
};

try{
var conn = $.db.getConnection();
var currentTime = new Date();
var year = currentTime.getFullYear();
// get keys from MapKeys table
var pstmt = conn.prepareStatement('MDX UPDATE TIME DIMENSION Day 2012 '+year);
var rs = pstmt.executeQuery();

conn.commit();

$.response.status = $.net.http.OK;
$.response.setBody("Data Generated from 2012 to "+year);
} catch (e){
    $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
    $.response.setBody(e.message);
}

rs.close();
pstmt.close();
conn.close();
