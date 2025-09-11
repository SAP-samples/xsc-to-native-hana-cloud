$.response.contentType = "text/html";
$.import("sap.hana.democontent.epm.services", "messages");
var MESSAGES = $.sap.hana.democontent.epm.services.messages;
$.import("sap.hana.democontent.epm.services", "session");
var SESSIONINFO = $.sap.hana.democontent.epm.services.session;



    var conn = $.hdb.getConnection();
    var conn2 = $.hdb.getConnection();
    var query;
    var rs;

    
  	try {
        // Business Partner Company Name  
        query = 'select * from "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Util.SeriesData" where "t" >= (select current_timestamp from dummy ) and "t" < (SELECT ADD_SECONDS (TO_TIMESTAMP (CURRENT_TIMESTAMP), 60*120) "add seconds" FROM DUMMY)';
        rs = conn.executeQuery(query);
        conn.close();
    } catch (e) {
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        $.response.setBody(e.message);                
    }
 
	
if (rs.length == 0) {
   

    try {
        // Business Partner Company Name
        query = 'alter sequence "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::seriesData" RESTART WITH 1';
        rs = conn2.executeUpdate(query);        
    } catch (e) {
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        $.response.setBody(e.message);                
    }
	
	
    var procLoad = conn2.loadProcedure('SAP_HANA_DEMO', 'sap.hana.democontent.epm.Procedures::seriesData');
    var execProc = procLoad();
   	var procOut = execProc;
    var resultSets = execProc['$resultSets'];
 
   if(resultSets == 0)
   {
   $.response.setBody("Currency Conversion Table Loaded");  
   }
    
  
   $.trace.debug(JSON.stringify(resultSets));
   $.response.contentType = 'application/json';   
   $.response.status = $.net.http.OK;
    
   }
   
   else
   {
   $.response.setBody("Currency Conversion Table Already Contain Values");
   }
   
   conn2.commit();
   conn.close();
   conn2.close();
    
