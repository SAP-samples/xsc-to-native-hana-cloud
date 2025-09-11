var paramName;
var paramValue;
var headerName;
var headerValue;
var contentType;
var jobName;
var jobDesc;
var xsCron, scheduleMsg, jobType, username, password, locale, starttime, endtime, active;

function saveJobConfig() {

    var uri = "/sap/hana/democontent/epm/jobscheduling/jobs/" + jobName + ".xsjob";
    try {
        var myjob = new $.jobs.Job({
            uri: uri
        });
        myjob.configure({
            user: username,
            password: password,
            locale: locale,
            status: active,
            start_time: {
                value: starttime,
                format: "MM DD YYYY HH:MI:SS"
            },
            end_time: {
                value: endtime,
                format: "MM DD YYYY HH:MI:SS"
            }
        });
    } catch (e) {
        scheduleMsg = "JOB_NOT_SAVED";
        return;
    }
}

function deactivateJob() {

    var uri = "/sap/hana/democontent/epm/jobscheduling/jobs/" + jobName + ".xsjob";
    try {
        var myjob = new $.jobs.Job({
            uri: uri
        });
        myjob.deactivate({
            user: username,
            password: password
        });
    } catch (e) {
        scheduleMsg = "JOB_NOT_DEACTIVATED";
        return;
    }


}

function activateJob() {

    var uri = "/sap/hana/democontent/epm/jobscheduling/jobs/" + jobName + ".xsjob";
    try {
        var myjob = new $.jobs.Job({
            uri: uri
        });
        myjob.activate({
            user: username,
            password: password
        });
    } catch (e) {
        scheduleMsg = "JOB_NOT_ACTIVATED";
        return;
    }


}


//to add a schedule to the XSJSJob
function addScheduleXSJS() {
    var rs;

    //check if a job schedule by the name already exists
    var conn = $.hdb.getConnection();
    rs = conn.executeQuery('SELECT ID from "sap.hana.democontent.epm.data::JobsDemo.RuntimeSchedules" where NAME = ?', jobName);
   
    if (rs.length !== 0) {
        scheduleMsg = "JOB_EXISTS";
           return;
    }
   
    //if the job does not exist, create a new job
    var myjob = new $.jobs.Job({
        uri: "/sap/hana/democontent/epm/jobscheduling/jobs/demoXSJS.xsjob"
    });
    var comment = 'RT XSJS Job:' + jobName;
    var jobId;
    try {
        jobId = myjob.schedules.add({
            description: jobDesc,
            xscron: xsCron,
            parameter: {
                description: comment
            }

        });
    } catch (e) {
        scheduleMsg = "SCHEDULE_NOT_ADDED";
        return;
    }



    //xsCron value should be something like * * * * * * 1:30/5
    //Insert Job Name

    ;
    conn.executeUpdate('insert into \"sap.hana.democontent.epm.data::JobsDemo.RuntimeSchedules\"' + " values(?,?, ?)", jobName, jobId, jobType);
    conn.commit();
    conn.close();

}

//to add a schedule to the SQLScriptJob
function addScheduleSQLScript() {
    var  rs;

    //check if a job schedule by the name already exists
    var conn = $.hdb.getConnection();
    rs = conn.executeQuery('SELECT ID from "sap.hana.democontent.epm.data::JobsDemo.RuntimeSchedules" where NAME = ?', jobName);
    //return if the job already exists
    if (rs.length !== 0) {
        scheduleMsg = "JOB_EXISTS";
        return;
    }
  
    //if the job does not exist, create a new job
    var myjob = new $.jobs.Job({
        uri: "/sap/hana/democontent/epm/jobscheduling/jobs/demoSQLScript.xsjob"
    });
    //xsCron value should be something like * * * * * * 1:30/5
    var comment = 'RT SQL Job:' + jobName;
    var jobId;
    try {
        jobId = myjob.schedules.add({
            description: jobDesc,
            xscron: xsCron,
            parameter: {
                DESCRIPTION: comment
            }

        });
    } catch (e) {
        scheduleMsg = "SCHEDULE_NOT_ADDED";
        return;
    }




    //Insert Job Name
    ;
    conn.executeUpdate('insert into \"sap.hana.democontent.epm.data::JobsDemo.RuntimeSchedules\"' + " values(?,?, ?)", jobName, jobId, jobType);
    conn.commit();
    conn.close();

}

//to remove a schedule from the XSJS/SQLScript Job
function removeSchedule() {
    var rs, jobId, jobType;

    //check if the job exists
    var conn = $.hdb.getConnection();
    rs = conn.executeQuery('SELECT ID, JOBTYPE from "sap.hana.democontent.epm.data::JobsDemo.RuntimeSchedules" where NAME = ?', jobName);

    if (rs.length !== 0) {
        jobId = rs[0][0];
        jobType = rs[0][1];
    }

      //if the job does not exists, return
    if (rs.length !== 0) {
        jobId = rs[0][0];
        jobType = rs[0][1];
    } else {
        scheduleMsg = "JOB_NOT_EXISTS";
        return;
    }

    //delete the job schedule
    if (jobType === 'XSJS Job') {

        try {
            var myjobxs = new $.jobs.Job({
                uri: "/sap/hana/democontent/epm/jobscheduling/jobs/demoXSJS.xsjob"
            });
         
            myjobxs.schedules["delete"]({
                id: parseInt(jobId, 10)
            });
        } catch (e) {
            scheduleMsg = "SCHEDULE_XSJS_NOT_REMOVED";
            return;
        }

    } else if (jobType === 'SQLScript Job') {

        try {
            var myjobsql = new $.jobs.Job({
                uri: "/sap/hana/democontent/epm/jobscheduling/jobs/demoSQLScript.xsjob"
            });
           
            myjobsql.schedules["delete"]({
                id: parseInt(jobId, 10)
            });
        } catch (e) {
            scheduleMsg = "SCHEDULE_SQL_NOT_REMOVED";
            return;
        }

    }

    //delete the job name
    try {
        conn.executeUpdate('DELETE from "sap.hana.democontent.epm.data::JobsDemo.RuntimeSchedules" where NAME = ?', jobName);
        conn.commit();
    } catch (e) {
        scheduleMsg = "SCHEDULE_NOT_DELETED";
    }
}



//Implementation of GET call
function handleGet() {
    // Retrieve data here and return results in JSON/other format
    $.response.status = $.net.http.OK;
    return {
        "myResult": " GET success"
    };
}

//Clear the Details Table data
function clearJobLogs(){
	
	//check if the job exists
    var conn = $.hdb.getConnection();
    try{
        conn.executeUpdate('DELETE FROM "sap.hana.democontent.epm.data::JobsDemo.Details"');
        conn.commit();
        conn.close();
    }
    catch(e){
    	scheduleMsg = "JOB_LOGS_NOT_DELETED";
    	conn.close();
    	$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
    }

}

//Implementation of the DELTE call
function handleDelete(){
	
	var terms = $.request.parameters.get("cmd");
	switch (terms) {
	 case "clearJobLogs":
		 clearJobLogs();
     	break;
     default:
         $.response.status = $.net.http.METHOD_NOT_ALLOWED;
         $.response.setBody("Wrong request method");
         break;
	
	}
	
	if(scheduleMsg === ""){
	    $.response.status = $.net.http.OK;
	    scheduleMsg = "JOB_LOGS_DELETE_SUCCESS";
	}
	    
    return {
        "myResult": scheduleMsg
    };
    
}



//Implementation of POST call
function handlePost() {
    var bodyStr = $.request.body ? $.request.body.asString() : undefined;
    if (bodyStr === undefined) {
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        return {
            "myResult": "Missing BODY"
        };
    }

    var jobData = JSON.parse(bodyStr);
    if (jobData.jobAction === "addSchedule") {
        jobName = jobData.jobName;
        jobDesc = jobData.jobDesc;
        xsCron = jobData.xsCron;
        jobType = jobData.jobType;
        if (jobType === 'XSJS Job') {
            addScheduleXSJS();
        } else if (jobType === 'SQLScript Job') {
            addScheduleSQLScript();
        }

        if (scheduleMsg === "") {
            // Extract body insert data to DB and return results in JSON/other format
            $.response.status = $.net.http.OK;
            scheduleMsg = "SUCCESS";
        } else {
            $.response.setBody(scheduleMsg);
            $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        }

    } else if (jobData.jobAction === "deleteSchedule") {
        jobName = jobData.jobName;
        username = jobData.username;
        password = jobData.password;
        removeSchedule();
        if (scheduleMsg === "") {
            // Extract body insert data to DB and return results in JSON/other format
            $.response.status = $.net.http.OK;
            scheduleMsg = "SUCCESS";
        } else {
            $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
            $.response.setBody(scheduleMsg);
        }


    } else if (jobData.jobAction === "deactivateJob") {
        jobName = jobData.jobName;
        username = jobData.username;
        password = jobData.password;
        deactivateJob();
        if (scheduleMsg === "") {
            // Extract body insert data to DB and return results in JSON/other format
            $.response.status = $.net.http.OK;
            scheduleMsg = "SUCCESS";
        } else {
            $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
            $.response.setBody(scheduleMsg);
        }

    } else if (jobData.jobAction === "activateJob") {
        jobName = jobData.jobName;
        username = jobData.username;
        password = jobData.password;
        activateJob();
        if (scheduleMsg === "") {
            // Extract body insert data to DB and return results in JSON/other format
            $.response.status = $.net.http.OK;
            scheduleMsg = "SUCCESS";
        } else {
            $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
            $.response.setBody(scheduleMsg);
        }

    } else if (jobData.jobAction === "saveJobConfig") {
        jobName = jobData.jobName;
        username = jobData.username;
        password = jobData.password;
        locale = jobData.locale;
        starttime = jobData.starttime;
        endtime = jobData.endtime;
        active = jobData.active;
        saveJobConfig();
        if (scheduleMsg === "") {
            // Extract body insert data to DB and return results in JSON/other format
            $.response.status = $.net.http.OK;
            scheduleMsg = "SUCCESS";
        } else {
            $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
            $.response.setBody(scheduleMsg);
        }

    }

    return {
        "myResult": scheduleMsg
    };

}

// Check Content type headers and parameters
function validateInput() {

    // Check content-type is application/json
    contentType = $.request.contentType;
    if (contentType === null || contentType.startsWith("application/json") === false) {
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        $.response.setBody("Wrong content type request use application/json");
        return false;
    }

    return true;
}
// Request process 
function processRequest() {
    scheduleMsg = "";
    if (validateInput()) {
        try {
            switch ($.request.method) {
                //Handle your GET calls here
                case $.net.http.GET:
                    $.response.setBody(JSON.stringify(handleGet()));
                    break;
                    //Handle your POST calls here
                case $.net.http.POST:
                    $.response.setBody(JSON.stringify(handlePost()));
                    break;
                    //Handle your other methods: PUT, DELETE
                case $.net.http.DEL:
                	$.response.setBody(JSON.stringify(handleDelete()));
                	break;
                default:
                    $.response.status = $.net.http.METHOD_NOT_ALLOWED;
                    $.response.setBody("Wrong request method");
                    break;
            }
            $.response.contentType = "application/json";
        } catch (e) {
            $.response.setBody("Failed to execute action: " + e.toString());
        }
    }
}
// Call request processing  
processRequest();