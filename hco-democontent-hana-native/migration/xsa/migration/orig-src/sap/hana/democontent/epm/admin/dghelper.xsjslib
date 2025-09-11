$.import("sap.hana.democontent.epm.services", "messages");
var MESSAGES = $.sap.hana.democontent.epm.services.messages;

//below two functions for displaying time taken during data generation through temporary global column table
function insertStartTime(start,hdbconn)  {

    var query = 'insert into "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Util.DataGenerationTime" '+'(starttime,endtime)'+'values ('+start+',0)';
    hdbconn.executeUpdate(query);
    hdbconn.commit();
}

function insertEndTime(end,hdbconn) {
    var query = 'insert into "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Util.DataGenerationTime" '+'(starttime,endtime) '+' values (0,' + end+ ')';
     hdbconn.executeUpdate(query);
    hdbconn.commit();
    
}


function getTransactionTime(hdbconn){
    var total;
    var query = 'select starttime,endtime  from "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Util.DataGenerationTime"';
    var rs=hdbconn.executeQuery(query);
    if(rs.length !== 0)
    {
        var end=rs[1][1];
        var start=rs[0][0];
        if (end > start)
        {
        //to convert it into seconds so divide by 1000
        total=(end-start)/1000;
        }
    }
    
    return total;
    
}

//Get all the Business Partners into an array
function getBuinessPartners() {
    var bpDict = [];
    var hdbconn = $.hdb.getConnection();
    var query = "SELECT \"PARTNERID\" FROM \"SAP_HANA_DEMO\".\"sap.hana.democontent.epm.data::MD.BusinessPartner\"";
    var rsBP = hdbconn.executeQuery(query);
    var row;
    for (row = 0; row < rsBP.length; row++){
       bpDict.push(rsBP[row].PARTNERID); 
    }
    hdbconn.close();
    return bpDict;
}
//Get all Products into an array
function getProducts() {
    var prodDict = [];
    var hdbconn = $.hdb.getConnection();
    var row;
    // Select ProductId and the corresponding Price
    var query = "SELECT \"PRODUCTID\", \"PRICE\" FROM \"SAP_HANA_DEMO\".\"sap.hana.democontent.epm.data::MD.Products\"";
    var rs = hdbconn.executeQuery(query);
    for (row = 0; row < rs.length; row++){
     	 prodDict.push({
             prod: rs[row].PRODUCTID,
             price: rs[row].PRICE
         }); 
    }
    hdbconn.close();
    return prodDict;
}
function throwError(message){
    $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
	$.response.setBody(message);
}
//Reset the sequence of the specified table
function resetTableSequence(object) {
    var selectQuery = '';
    var altQuery = '';
    var rs;
    var maxId = -1;
    switch (object) {
        case "addressSeqId":
            selectQuery = 'SELECT to_int(MAX("ADDRESSID") + 1) FROM "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::MD.Addresses"';
            altQuery = 'ALTER SEQUENCE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::addressSeqId" RESTART WITH ';
            break;
        case "employeeSeqId":
            selectQuery = 'SELECT to_int(MAX("EMPLOYEEID") + 1) FROM "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::MD.Employees"';
            altQuery = 'ALTER SEQUENCE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::employeeSeqId" RESTART WITH ';
            break;
        case "partnerSeqId":
            selectQuery = 'SELECT to_int(MAX("PARTNERID") + 1) FROM "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::MD.BusinessPartner"';
            altQuery = 'ALTER SEQUENCE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::partnerSeqId" RESTART WITH ';
            break;
        case "purchaseOrderSeqId":
            selectQuery = 'SELECT to_int(MAX("PURCHASEORDERID") + 1) FROM "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::PO.Header"';
            altQuery = 'ALTER SEQUENCE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::purchaseOrderSeqId" RESTART WITH ';
            break;
        case "salesOrderId":
            selectQuery = 'SELECT to_int(MAX("SALESORDERID") + 1) FROM "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::SO.Header"';
            altQuery = 'ALTER SEQUENCE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::salesOrderId" RESTART WITH ';
            break;
        case "textSeqId":
            selectQuery = 'SELECT to_int(MAX("TEXTID") + 1) FROM "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Util.Texts"';
            altQuery = 'ALTER SEQUENCE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::textSeqId" RESTART WITH ';
            break;
        default:
            return maxId;
    }
    // open db connection needed for repository sessions
    var hdbconn = $.hdb.getConnection();
    rs =hdbconn.executeQuery(selectQuery);
 
    if (rs.length!==0){
        maxId = rs[0][0];
    }
    if (maxId !== null && maxId !== -1) {
        hdbconn.executeUpdate(altQuery + maxId);
        hdbconn.commit();
    }
    //	End of code based on new logic
    hdbconn.close();
    return maxId;
}


function reloadSeed() {
	try {
		var object = encodeURI($.request.parameters.get('object'));
		var body = '';
		var tblNames;
		var hdbconn;
		var query;
		var i;

		switch (object) {
		case "master":
			tblNames = ['MD.Addresses', 'MD.BusinessPartner', 'MD.Employees', 'MD.Products',
			            'Util.Constants', 'Util.Texts', 'Util.Notes', 'Util.Attachments'];
			break;
		case "transactional":
			tblNames = ['SO.Header', 'SO.Item', 'PO.Header', 'PO.Item'];
			break;
		default:
			$.response.status = $.net.http.BAD_REQUEST;
		$.response.setBody(MESSAGES.getMessage('SEPM_ADMIN', '003'));
		return;
		}

		// open db connection needed for repository sessions
		hdbconn = $.hdb.getConnection();
		for (i = 0; i < tblNames.length; i++) {
			// Truncate the existing table
			query = 'TRUNCATE TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::' + tblNames[i] + '"';
			hdbconn.executeUpdate(query);
			hdbconn.commit();
			body = body + 'Truncated: sap.hana.democontent.epm.data::' + tblNames[i] + ' \n';
		}
		hdbconn.close();
		for (i = 0; i < tblNames.length; i++) {
			body = body + 'Reseeded: sap.hana.democontent.epm.data.loads::' + tblNames[i] + '\n';
		}
		$.response.status = $.net.http.OK;
		$.response.setBody(body);

	} catch (e) {
		$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
		$.response.setBody(e.message);
	}
}
//Reset sequence after generating data.
function resetSequence() {
	try {

		var object = encodeURI($.request.parameters.get('object'));
		var body = '';
		var maxId =resetTableSequence(object);
		body = body + 'Sequence reset: sap.hana.democontent.epm.data::' + object + ' to ' + maxId + ' \n';
		if (maxId === -1) {
			$.response.status = $.net.http.BAD_REQUEST;
			$.response.setBody(MESSAGES.getMessage('SEPM_ADMIN', '004'));
		} else {
			$.response.status = $.net.http.OK;
			$.response.setBody(body);
		}

	} catch (e) {
		$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
		$.response.setBody(e.message);
	}
}

function getMaxId(idType){
    var hdbconn = $.hdb.getConnection();
    var query,rs,maxId=-1;
    	switch (idType) {
		case "SalesOrderId":
		    query = 'SELECT MAX("SALESORDERID") FROM "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::SO.Header"';
			break;
		case "PurchaseOrderId":
			query = 'SELECT MAX("PURCHASEORDERID") FROM "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::PO.Header"';
			break;
    	}
    rs = hdbconn.executeQuery(query);
    hdbconn.close();
    if (rs.length!==0){
             maxId = rs[0][0];
        }
    
    return maxId;
}

//Generate Purchase Orders by replicating from table 
function replicatePurchaseOrders() {
	var body = '';
	var maxPoId = '';
	var query;
	try {
		var hdbconn = $.hdb.getConnection();
		var d=new Date();
		insertStartTime(d.getTime(),hdbconn);
		maxPoId = getMaxId("PurchaseOrderId");
		if (maxPoId===-1){
		    throwError("Unable to get Purchase Order ID next sequence");
		}
        maxPoId = parseInt(maxPoId, 10) + 1;
		query = 'INSERT INTO "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::PO.Header" ' + '("PURCHASEORDERID", "HISTORY.CREATEDBY.EMPLOYEEID", "HISTORY.CREATEDAT", "HISTORY.CHANGEDBY.EMPLOYEEID", "HISTORY.CHANGEDAT", "NOTEID", ' + ' "PARTNER.PARTNERID", "CURRENCY", "GROSSAMOUNT", "NETAMOUNT", "TAXAMOUNT", ' + ' "LIFECYCLESTATUS", "APPROVALSTATUS", "CONFIRMSTATUS", "ORDERINGSTATUS", "INVOICINGSTATUS" ) ' + 'select \'0\' || to_int("PURCHASEORDERID" + ' + maxPoId + ' - 300000000 ), "HISTORY.CREATEDBY.EMPLOYEEID", "HISTORY.CREATEDAT", "HISTORY.CHANGEDBY.EMPLOYEEID", "HISTORY.CHANGEDAT", "NOTEID", ' + ' "PARTNER.PARTNERID", "CURRENCY", "GROSSAMOUNT", "NETAMOUNT", "TAXAMOUNT", ' + ' "LIFECYCLESTATUS", "APPROVALSTATUS", "CONFIRMSTATUS", "ORDERINGSTATUS", "INVOICINGSTATUS" ' + '  from "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::PO.Header" WHERE "PURCHASEORDERID" <= ' + "  '0300000999' ";
		var iNumPo = hdbconn.executeUpdate(query);
	    hdbconn.commit();
		body = body + MESSAGES.getMessage('SEPM_ADMIN', '001', iNumPo,
		'Purchase.Header') + "\n";

		query = 'INSERT INTO "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::PO.Item" ' + '("PURCHASEORDERID", "PURCHASEORDERITEM", "PRODUCT.PRODUCTID", "NOTEID", "CURRENCY", "GROSSAMOUNT", "NETAMOUNT", "TAXAMOUNT", ' + ' "QUANTITY", "QUANTITYUNIT", "DELIVERYDATE") ' + 'select \'0\' || to_int("PURCHASEORDERID" + ' + maxPoId + ' - 300000000 ), "PURCHASEORDERITEM", "PRODUCT.PRODUCTID", "NOTEID", "CURRENCY", "GROSSAMOUNT", "NETAMOUNT", "TAXAMOUNT", ' + ' "QUANTITY", "QUANTITYUNIT", "DELIVERYDATE" ' + '  from "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::PO.Item" WHERE "PURCHASEORDERID" <= ' + " '0300000999' ";
		var iNumItem = hdbconn.executeUpdate(query);
		hdbconn.commit();
		var d1=new Date();
		insertEndTime(d1.getTime(),hdbconn);
        
        var totalTime=getTransactionTime(hdbconn);
		body = body + MESSAGES.getMessage('SEPM_ADMIN', '001', iNumItem,'PO.Item') + "\n";
		body=body+'Total time taken= '+totalTime+'  seconds'+'\n';
		hdbconn.close();
		resetTableSequence('purchaseOrderSeqId');
		$.response.status = $.net.http.OK;
		$.response.setBody(body);
	} catch (e) {
		$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
		$.response.setBody(e.message);
	}
}

//Helper method to create time based purchase orders when the batch size is more than 1
function createTimeBasedPO(startDates, batchSizes, totalSize,bpDict,prodDict) {
	var maxPoId = '';
	var randProductIndex, randProduct, randPrice, randQuantity, randNetAmount = 0, randTaxAmount = 0, randGrossAmount = 0, randBPIndex, randBP;
    var poItems = [];
    var poHeaders = [];
	try {

	    var hdbconn = $.hdb.getConnection(); 
		var i;

		//Insert statement for purchaseOrderItem table
		var query = "INSERT INTO \"SAP_HANA_DEMO\".\"sap.hana.democontent.epm.data::PO.Item\" " + "(\"PURCHASEORDERID\", \"PURCHASEORDERITEM\", \"PRODUCT.PRODUCTID\", \"NOTEID\", \"CURRENCY\", \"GROSSAMOUNT\", \"NETAMOUNT\", \"TAXAMOUNT\", \"QUANTITY\", \"QUANTITYUNIT\", \"DELIVERYDATE\") " + "VALUES (?,?,?,?,?,?,?,?,?,?,?)";
//		var pstmtPOItem = conn.prepareStatement(query);

		//Insert statement for purchaseOrderHeader table
		var queryPO = "INSERT INTO \"SAP_HANA_DEMO\".\"sap.hana.democontent.epm.data::PO.Header\"" + "(\"PURCHASEORDERID\", \"HISTORY.CREATEDBY.EMPLOYEEID\", \"HISTORY.CREATEDAT\", \"HISTORY.CHANGEDBY.EMPLOYEEID\", \"HISTORY.CHANGEDAT\", \"NOTEID\", \"PARTNER.PARTNERID\", \"CURRENCY\", \"GROSSAMOUNT\", \"NETAMOUNT\", \"TAXAMOUNT\", \"LIFECYCLESTATUS\", \"APPROVALSTATUS\", \"CONFIRMSTATUS\", \"ORDERINGSTATUS\", \"INVOICINGSTATUS\" )" + "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

		// generate itemCounts to calculate the batch count for items
		var itemCounts = [];
		var l;
		var count;
		var j;
		var StartDateStr;
		var BATCHSIZE;
		var itemCount;
		var productIDs;
		var k;
		var netAmountItem;
		var taxAmountItem;
		var grossAmountItem;
		
		for ( l = 0; l < totalSize; l++) {
		    // Decide number of items, max 5
		    count = Math.floor((Math.random() * 4) + 1);
		    itemCounts.push(count);
		}
		l = 0;
		
		//Extract the max PO Id
		maxPoId = getMaxId("PurchaseOrderId");
		if (maxPoId===-1){
		    throwError("Unable to get Purchase Order ID next sequence");
		}
	
        // loop for every day in the arguments
        for (j = 0; j < batchSizes.length; j++) {
            
            StartDateStr = startDates[j];
            BATCHSIZE = batchSizes[j];
                        
    		// batch inserts
    		for (i = 0; i < BATCHSIZE; i++) {
    		    
    		    itemCount = itemCounts[l];
    		    l++;
    		    productIDs = [];
    		    
    		    // create the next purchase order ID
    			maxPoId = parseInt(maxPoId, 10) + 1;
    			maxPoId = maxPoId.toString();
    			
    			// reset amounts
    			randNetAmount = 0;
    			randTaxAmount = 0;
    			randGrossAmount = 0;
    		    
    		    for (k = 0; k < itemCount; k++) {
    		        
    		        // Creating values to be inserted purchaseOrderItem table	
    		        
    		        // Randomly extract the product and the corresponding price of the selected product
    		        do {
    		            
    		            randProductIndex = Math.floor(Math.random() * 105);
    		            // to weed out duplicates
    		        } while (productIDs.indexOf(randProductIndex) > -1);
    		        productIDs.push(randProductIndex); 
        			randProduct = prodDict[randProductIndex].prod;
        			randPrice = prodDict[randProductIndex].price;
        
        			// calculate amounts
        			randQuantity = Math.floor((Math.random() * 9) + 1);
        			netAmountItem = parseInt((randQuantity * randPrice).toFixed(2), 10);
        			taxAmountItem = parseInt((netAmountItem * 0.19).toFixed(2), 10); // Taking 19% Tax
        			grossAmountItem = netAmountItem + taxAmountItem;
        			
        			randNetAmount += netAmountItem;
        			randTaxAmount += taxAmountItem;
        			randGrossAmount += grossAmountItem;
        			
        			// prepare the insert query
        			 poItems.push(["0" + maxPoId,
                         "00000000" + ((k + 1) * 10),
                         randProduct,
                         "NoteId",
                         "EUR",
                         grossAmountItem,
                         netAmountItem,
                         taxAmountItem,
                         randQuantity,
                         "EA",
                         StartDateStr]);
   
    		    }
    
    			//Randomly extract the business partner from businessPartnerArray
    			randBPIndex = Math.floor(Math.random() * 44); // since BP is 45
    			randBP = bpDict[randBPIndex];
    
    			//Creating values to be inserted for the purchaseOrderHeader table
    			poHeaders.push([ "0" + maxPoId, //PURCHASEORDERID
                     "0000000033", //HISTORY.CREATEDBY.EMPLOYEEID
                     StartDateStr, //HISTORY.CREATEDAT
                     "0000000033", //HISTORY.CHANGEDBY.EMPLOYEEID
                     StartDateStr, //HISTORY.CHANGEDAT
                     "NoteId",  //NOTEID
                     randBP, //PARTNERID.PARTNERID
                     "EUR", //CURRENCY
                     randGrossAmount, //GROSSAMOUNT
                     randNetAmount, //NETAMOUNT
                     randTaxAmount, //TAXAMOUNT
                     "N", //LIFECYCLESTATUS
                     "I", //APPROVALSTATUS
                     "I", //CONFIRMSTATUS
                     "I", //ORDERINGSTATUS
                     "I" //INVOICINGSTATUS
                     ]);

    		}
        }

		//Items
        hdbconn.executeUpdate(query, poItems);
        //Headers
        hdbconn.executeUpdate(queryPO, poHeaders);
        hdbconn.commit();
        hdbconn.close();

	} 
	catch (e) {
		$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
		$.response.setBody(e.message);
	}
}

//Create Purchase Orders distributed randomly across a time period
function replicateTimeBasedPurchaseOrders(aStartDate, aEndDate, aNoRec,bpDict,prodDict) {

	var body = '';
	var alpha = 0;
	var thetaArray = [];
	var i = 0;
	var randNo = 0;
	var j;
	var noRecords = aNoRec;
	var calc;
	var startDay, startMonth, startYear, StartDateStr, BATCHSIZE;

	//Calculate the number of days
	var StartDate = new Date(aStartDate);
	var endDate = new Date(aEndDate);
	var timeDiff = Math.abs(endDate.getTime() - StartDate.getTime());
	var diffDays = (Math.ceil(timeDiff / (1000 * 3600 * 24))) + 1;

	if (aNoRec === 0) {
		return;
	}

	//Get the random number of purchase orders to be generated for each day finally stored in thetaArray[]
	if(diffDays === 1){
	    randNo = 1;
	}else{
	    randNo = Math.random();
	}
	alpha = Math.round(aNoRec / diffDays);
	thetaArray[0] = Math.round(alpha * randNo);
	aNoRec = +(aNoRec - thetaArray[i]) || 0;

	for (i = 1; i < diffDays - 1; i++) {
		//Generate a random number
		randNo = Math.random();
		if((diffDays-i) > 0 )
		{
		alpha = Math.round(aNoRec / (diffDays - i));
		calc = Math.round(alpha * randNo) * Math.round(6 * randNo);
		thetaArray[i] = (calc <= aNoRec) ? calc : 0;
		aNoRec = +(aNoRec - thetaArray[i]) || 0;
		}
	}

    if(aNoRec>0){
	thetaArray[diffDays - 1] = +aNoRec || 0;
    }
	var totalSize = 0;
	var dates = [], batchSizes = [];
	//Loop to distribute the random purchase orders to be generated across each day(date) and also calculate the BATCHSIZE
	for (j = 0; j < diffDays; j++) {
		if (thetaArray[j] === 0) {
			continue;
		}
		
		startDay = StartDate.getDate();
		startMonth = StartDate.getMonth() + 1; // Jan is 0
		startYear = StartDate.getFullYear();
		
		if (startDay < 10) {
			startDay = '0' + startDay;
		}
		if (startMonth < 10) {
			startMonth = '0' + startMonth;
		}
		StartDateStr = startYear.toString() + startMonth.toString() + startDay;
		
		BATCHSIZE = thetaArray[j];
		totalSize += BATCHSIZE;
		dates.push(StartDateStr);
		batchSizes.push(BATCHSIZE);
		
		if (totalSize < 1000 || j === (diffDays - 1) && diffDays < 1000 ) {
			// if more than lot size or last loop 
			createTimeBasedPO(dates, batchSizes, totalSize,bpDict,prodDict);
			// reset
			dates = [];
			batchSizes = [];
			totalSize = 0;
		} 
		// Increment Date
		StartDate.setDate(StartDate.getDate() + 1);
	}
	//Update sequence
	resetTableSequence('purchaseOrderSeqId');
    $.response.contentType = "application/json";
    var output = {};
    output.message =  MESSAGES.getMessage('SEPM_ADMIN', '001', noRecords,
        'Purchase.Header') + "\n";
    output.numberOfRecords = noRecords;
	
	$.response.status = $.net.http.OK;
	$.response.setBody(JSON.stringify(output));

}

//Generate Sales Orders by replicating from table
function replicateSalesOrders() {
	var body = '';
	var maxSoId = '';
     var query;
	try {
	
		maxSoId = getMaxId("SalesOrderId");
		if (maxSoId===-1){
		    throwError("Unable to get Sales Order ID next sequence");
		}
		maxSoId = parseInt(maxSoId, 10) + 1;
		var hdbconn = $.hdb.getConnection();
		var d=new Date();
		insertStartTime(d.getTime(),hdbconn);
		query = 'INSERT INTO "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::SO.Header" ' + '("SALESORDERID", "HISTORY.CREATEDBY.EMPLOYEEID", "HISTORY.CREATEDAT", "HISTORY.CHANGEDBY.EMPLOYEEID", "HISTORY.CHANGEDAT", "NOTEID", ' + ' "PARTNER.PARTNERID", "CURRENCY", "GROSSAMOUNT", "NETAMOUNT", "TAXAMOUNT", ' + ' "LIFECYCLESTATUS", "BILLINGSTATUS", "DELIVERYSTATUS" ) ' + 'select \'0\' || to_int("SALESORDERID" + ' + maxSoId + ' - 500000000 ), "HISTORY.CREATEDBY.EMPLOYEEID", ' + ' add_days(now(), ROUND(TO_DECIMAL(-365 + (0+365)*RAND()),0)), ' + ' "HISTORY.CHANGEDBY.EMPLOYEEID", "HISTORY.CHANGEDAT", "NOTEID", ' + ' "PARTNER.PARTNERID", "CURRENCY", "GROSSAMOUNT", "NETAMOUNT", "TAXAMOUNT", ' + ' "LIFECYCLESTATUS", "BILLINGSTATUS", "DELIVERYSTATUS" ' + '  from "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::SO.Header" WHERE "SALESORDERID" <= ' + " '0500000999' ";
		var iNumSo = hdbconn.executeUpdate(query);
		hdbconn.commit();
		body = body + MESSAGES.getMessage('SEPM_ADMIN', '001', iNumSo, 'SO.Header') + "\n";
		query = 'INSERT INTO "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::SO.Item" ' + '("SALESORDERID", "SALESORDERITEM", "PRODUCT.PRODUCTID", "NOTEID", "CURRENCY", ' + ' "GROSSAMOUNT", "NETAMOUNT", "TAXAMOUNT", "ITEMATPSTATUS", "OPITEMPOS", "QUANTITY", "QUANTITYUNIT", "DELIVERYDATE") ' + 'select \'0\' || to_int("SALESORDERID" + ' + maxSoId + ' - 500000000 ), "SALESORDERITEM", ' + '"PRODUCT.PRODUCTID"' + ', "NOTEID", "CURRENCY", ' + ' "GROSSAMOUNT", "NETAMOUNT", "TAXAMOUNT", "ITEMATPSTATUS", "OPITEMPOS", "QUANTITY", "QUANTITYUNIT", "DELIVERYDATE" ' + '  from "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::SO.Item" WHERE "SALESORDERID" <= ' + " '0500000999' ";
		var iNumItem = hdbconn.executeUpdate(query);
		hdbconn.commit();
		var d1=new Date();
		insertEndTime(d1.getTime(),hdbconn);
        
        var totalTime=getTransactionTime(hdbconn);
		hdbconn.close();
		resetTableSequence('salesOrderId');
		body = body + MESSAGES.getMessage('SEPM_ADMIN', '001', iNumItem,'SO.Item') + "\n";
		body=body+'Total time taken= '+totalTime+'  seconds'+'\n';
		

		$.response.status = $.net.http.OK;
		$.response.setBody(body);
	} catch (e) {
		$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
		$.response.setBody(e.message);
	}
}

//Helper method to create time based sales orders when the batch size is more than 1
function createTimeBasedSO(startDates, batchSizes,totalSize,bpDict,prodDict) {
	var maxSoId = '';
	var randProductIndex, randProduct, randPrice, randQuantity, randNetAmount, randTaxAmount, randGrossAmount, randBPIndex, randBusinessPartner;
	var soItems = [];
    var soHeaders = [];
	try {
		var hdbconn = $.hdb.getConnection();
		var i;

		//Insert statement for purchaseOrderItem table
		var query = "INSERT INTO \"SAP_HANA_DEMO\".\"sap.hana.democontent.epm.data::SO.Item\" " + "(\"SALESORDERID\", \"SALESORDERITEM\", \"PRODUCT.PRODUCTID\", \"NOTEID\", \"CURRENCY\", \"GROSSAMOUNT\", \"NETAMOUNT\", \"TAXAMOUNT\",\"ITEMATPSTATUS\",\"OPITEMPOS\",\"QUANTITY\", \"QUANTITYUNIT\", \"DELIVERYDATE\") " + "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";
		//Insert statement for purchaseOrderHeader table
		var querySO = "INSERT INTO \"SAP_HANA_DEMO\".\"sap.hana.democontent.epm.data::SO.Header\"" + "(\"SALESORDERID\", \"HISTORY.CREATEDBY.EMPLOYEEID\", \"HISTORY.CREATEDAT\", \"HISTORY.CHANGEDBY.EMPLOYEEID\", \"HISTORY.CHANGEDAT\", \"NOTEID\", \"PARTNER.PARTNERID\", \"CURRENCY\", \"GROSSAMOUNT\", \"NETAMOUNT\", \"TAXAMOUNT\", \"LIFECYCLESTATUS\", \"BILLINGSTATUS\", \"DELIVERYSTATUS\")" + "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

		//set the BATCHSIZE for the items to be inserted into the purchaseOrderItem and purchaseOrderHeader tables

		// generate itemCounts to calculate the batch count for items
		var itemCounts = [];
		var l;
		var count;
		var j;
		var StartDateStr;
		var BATCHSIZE;
		var productIDs;
		var itemCount;
		var k;
		var netAmountItem;
		var taxAmountItem;
		var grossAmountItem;
		for (l = 0; l < totalSize; l++) {
		    // Decide number of items, max 5
		    count = Math.floor((Math.random() * 4) + 1);
		    itemCounts.push(count);
		}
		l = 0;
		


		//Extract the max SO Id
		
		maxSoId = getMaxId("SalesOrderId");
		if (maxSoId===-1){
		    throwError("Unable to get Sales Order ID next sequence");
		}

        // loop for every day in the arguments
        for (j = 0; j < batchSizes.length; j++) {
            
            StartDateStr = startDates[j];
            BATCHSIZE = batchSizes[j];
            
    		//batch inserts
    		for (i = 0; i < BATCHSIZE; i++) {
    		    
    		    itemCount = itemCounts[l];
    		    l++;
    		    productIDs = [];
    		    
    		    // create the next purchase order ID
    			maxSoId = parseInt(maxSoId, 10) + 1;
    			maxSoId = maxSoId.toString();
    			
    			// reset amounts
    			randNetAmount = 0;
    			randTaxAmount = 0;
    			randGrossAmount = 0;
    		
    		    for (k = 0; k < itemCount; k++) {
    		        
    		        // Randomly extract the product and the corresponding price of the selected product
    		        do {
    		            
    		            randProductIndex = Math.floor(Math.random() * 105);
    		            // to weed out duplicates
    		        } while (productIDs.indexOf(randProductIndex) > -1);
    		        productIDs.push(randProductIndex); 
        			
        			randProduct = prodDict[randProductIndex].prod;
        			randPrice = prodDict[randProductIndex].price;
        
        			// calculate amounts
        			randQuantity = Math.floor((Math.random() * 9) + 1);
        			netAmountItem = parseInt((randQuantity * randPrice).toFixed(2), 10);
        			taxAmountItem = parseInt((netAmountItem * 0.19).toFixed(2), 10); // Taking 19% Tax
        			grossAmountItem = netAmountItem + taxAmountItem;
        			
        			randNetAmount += netAmountItem;
        			randTaxAmount += taxAmountItem;
        			randGrossAmount += grossAmountItem;
    
        			//Creating values to be inserted purchaseOrderItem table
        			 soItems.push(["0" + maxSoId,
                                      "00000000" + ((k + 1) * 10),
                                      randProduct,
                                      "NoteId",
                                      "EUR",
                                     grossAmountItem,
                                     netAmountItem,
                                     taxAmountItem,
                                     "I",
                                    "?",
                                    randQuantity,
                                    "EA",
                                     StartDateStr
                                    ]);
        
    		    }
    
    			//Randomly extract the business partner from businessPartnerArray
    			randBPIndex = Math.floor(Math.random() * 44); // since BP is 45
    			randBusinessPartner = bpDict[randBPIndex];
    
    			//Creating values to be inserted for the purchaseOrderHeader table
    			 soHeaders.push([
                "0" + maxSoId,
                "0000000033",
                StartDateStr,
                "0000000033",
                StartDateStr,
                "NoteId",
                randBusinessPartner,
                "EUR",
                randGrossAmount,
                randNetAmount,
                randTaxAmount,
                "N",
                "I",
                "I"
                ]);

    		}
        }

		//Items
        hdbconn.executeUpdate(query, soItems);
        //Headers
        hdbconn.executeUpdate(querySO, soHeaders);
        
        hdbconn.commit();
        hdbconn.close();
	} catch (e) {
		$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
		$.response.setBody(e.message);
	}
}


//Create Sales Orders distributed randomly across a time period
function replicateTimeBasedSalesOrders(aStartDate, aEndDate, aNoRec,bpDict,prodDict) {

	var alpha = 0;
	var thetaArray = [];
	var i = 0;
	var randNo = 0;
	var body = '';
	var j;
	var noRecords = aNoRec;
	var calc;
	var startDay, startMonth, startYear, StartDateStr, BATCHSIZE;
	//Calculate the number of days
	var StartDate = new Date(aStartDate);
	var endDate = new Date(aEndDate);
	var timeDiff = Math.abs(endDate.getTime() - StartDate.getTime());
	var diffDays = (Math.ceil(timeDiff / (1000 * 3600 * 24))) + 1;

	if (aNoRec === 0) {
		return;
	}

	//Get the random number of purchase orders to be generated for each day finally stored in thetaArray[]
	if(diffDays === 1){
	    randNo = 1;
	}else{
	    randNo = Math.random();
	}
	alpha = Math.round(aNoRec / diffDays);
	thetaArray[0] = Math.round(alpha * randNo);
	aNoRec = +(aNoRec - thetaArray[i]) || 0;

	for (i = 1; i < diffDays - 1; i++) {
		//Generate a random number
		randNo = Math.random();
		alpha = Math.round(aNoRec / (diffDays - i));
		calc = Math.round(alpha * randNo) * Math.round(6 * randNo);
		thetaArray[i] = (calc <= aNoRec) ? calc : 0;
		aNoRec = +(aNoRec - thetaArray[i]) || 0;
	}

	if(aNoRec>0){
	thetaArray[diffDays - 1] = +aNoRec || 0;
    }
	var totalSize = 0;
	var dates = [], batchSizes = [];
	//Loop to distribute the random purchase orders to be generated accross each day(date) and also calculate the BATCHSIZE
	for (j = 0; j < diffDays; j++) {
		if (thetaArray[j] === 0) {
			continue;
		}
		
		startDay = StartDate.getDate();
		startMonth = StartDate.getMonth() + 1; // Jan is 0
		startYear = StartDate.getFullYear();
		
		if (startDay < 10) {
			startDay = '0' + startDay;
		}
		if (startMonth < 10) {
			startMonth = '0' + startMonth;
		}
		StartDateStr = startYear.toString() + startMonth.toString() + startDay;
		
		BATCHSIZE = thetaArray[j];
		totalSize += BATCHSIZE;
		dates.push(StartDateStr);
		batchSizes.push(BATCHSIZE);

		if (totalSize < 1000 || j === (diffDays - 1) && diffDays < 1000 ) {
			// if more than lot size or last loop 
			createTimeBasedSO(dates, batchSizes, totalSize,bpDict,prodDict);
			// reset
			dates = [];
			batchSizes = [];
			totalSize = 0;
		}
		// Increment Date
		StartDate.setDate(StartDate.getDate() + 1);
	}
	//Update sequence
	resetTableSequence('salesOrderId');
    $.response.contentType = "application/json";
    var output = {};
    output.message =  MESSAGES.getMessage('SEPM_ADMIN', '001', noRecords,
        'Sales.Header') + "\n";
    output.numberOfRecords = noRecords;
	
	$.response.status = $.net.http.OK;
	$.response.setBody(JSON.stringify(output));

}

//Get size of all tables and their names in a two diamensional array
function getTableSize() {
	var i = 0;
	var body = '';
	var list = [];
	var hdbconn = '';
	var query, rs, query2, rs2;

	function createTotalEntry(rs, table, rs2) {

		var record_count = Math.round(rs[0][0]);
		var table_size = Math.round(rs2[0][0] / 1024);


		return {
			"name": table,
			"table_size": table_size,
			"record_count": record_count
		};

	}
	var tableDict = [{
		"tableName": "MD.Addresses",
		"tableSynonym": "Address"
	}, {
		"tableName": "MD.BusinessPartner",
		"tableSynonym": "Business Partner"
	}, {
		"tableName": "Util.Constants",
		"tableSynonym": "Constants"
	}, {
		"tableName": "MD.Employees",
		"tableSynonym": "Employees"
	}, {
		"tableName": "Util.Messages",
		"tableSynonym": "Messages"
	}, {
		"tableName": "MD.Products",
		"tableSynonym": "Products"
	}, {
		"tableName": "PO.Header",
		"tableSynonym": "Purchase Order Headers"
	}, {
		"tableName": "PO.Item",
		"tableSynonym": "Purchase Order Items"
	}, {
		"tableName": "SO.Header",
		"tableSynonym": "Sales Order Headers"
	}, {
		"tableName": "SO.Item",
		"tableSynonym": "Sales Order Items"
	}, {
		"tableName": "Util.Texts",
		"tableSynonym": "Texts"
	}];
	hdbconn = $.hdb.getConnection();
	for (i = 0; i < tableDict.length; i++) {
		query = 'SELECT COUNT(*) FROM "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::' + tableDict[i].tableName + '"';
		rs = hdbconn.executeQuery(query);
		query2 = 'SELECT "TABLE_SIZE" FROM "SYS"."M_TABLES" WHERE "SCHEMA_NAME" = \'SAP_HANA_DEMO\' AND "TABLE_NAME" = \'sap.hana.democontent.epm.data::' + tableDict[i].tableName + '\'';
		rs2 = hdbconn.executeQuery(query2);
		if (rs.length!==0 && rs2.length!==0){
		     list.push(createTotalEntry(rs, tableDict[i].tableSynonym, rs2));
		}
	}
	hdbconn.close();
	body = JSON.stringify({
		"entries": list
	});

	$.response.contentType = 'application/json; charset=UTF-8';
	$.response.setBody(body);
	$.response.status = $.net.http.OK;
}

//Generate synonyms for currency conversion tables
function generateSynonym() {

	// open db connection
	var hdbconn = $.hdb.getConnection();
	var i = 0;
	var body = '';
	var query = '';

	var tableArray = ["T006", "T006A", "TCURC", "TCURF", "TCURN", "TCURR",
	                  "TCURT", "TCURV", "TCURW", "TCURX"
	                  ];
	for (i = 0; i < tableArray.length; i++) {
		try {
			query = 'DROP SYNONYM "SAP_HANA_DEMO"."' + tableArray[i] + '" ';
			hdbconn.executeUpdate(query);
			hdbconn.commit();
		} catch (ignore) {}
	}

	for (i = 0; i < tableArray.length; i++) {
		query = 'CREATE SYNONYM "SAP_HANA_DEMO"."' + tableArray[i] + '" FOR "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Conversions.' + tableArray[i] + '"';
		hdbconn.executeUpdate(query);
		hdbconn.commit();
		body = body + 'Created Synonym: "SAP_HANA_DEMO"."' + tableArray[i] + ' FOR "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::' + tableArray[i] + '" \n';
	}

	// close db connection
	hdbconn.close();
	
	$.response.status = $.net.http.OK;
	$.response.setBody(body);
}
