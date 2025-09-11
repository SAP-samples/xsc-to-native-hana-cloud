#!/bin/bash


for i in "$@"
do
case $i in
        -a=* | --appname=*)
        APP_NAME="${i#*=}"
        shift
        ;;
        -s=* | --service-instance=*)
        SERVICE_INSTANCE="${i#*=}"
        shift
        ;;
esac
done




#check if one of the mandatory parameters is set
if [[ ! $APP_NAME && ! $SERVICE_INSTANCE ]]
then
        echo "FAILURE: Either parameters appname or service-instance needs to be set."
        echo "Usage:  ./moveTablesToContainer [Option]"
        echo " Options:"
        echo "    --appname, -a             The name of the db-application"
        echo "    --service-instance, -s    The name of the service instance"
        exit
fi


if [ $APP_NAME ]
then
    xs env $APP_NAME --export-json env_json;
    MODE='app'
fi      

if [ $SERVICE_INSTANCE ]
then
    xs service-key $SERVICE_INSTANCE SharedDevKey > env_json;
    MODE='service'
fi


DIRNAME="$( cd "$(dirname "${BASH_SOURCE[0]}")" && pwd )"
JAVA_EXE="$DIRNAME/sapjvm_8_jre/bin/java"

path_to_executable=$(which node 2>/dev/null)
if [ -x "$path_to_executable" ] ; then
    FOUND_NODE="$path_to_executable"
elif [[ -n "$NODE_HOME" && -x $NODE_HOME/bin/node ]] ; then
    FOUND_NODE=$NODE_HOME/bin/node
fi

found_node_version=$($FOUND_NODE --version 2>/dev/null | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [[ -z "$found_node_version" || $found_node_version -lt $NODE_MIN_VERSION ]] ; then
    echo initializing...
    TMPDIR=$(mktemp -d)
    trap "rm -rf $TMPDIR" EXIT
    $JAVA_EXE -cp $DIRNAME/init Unzip $DIRNAME/init/java.dat $TMPDIR
    NODE_EXE="$TMPDIR/$(ls -1 $TMPDIR)/bin/node"
else
    NODE_EXE=$FOUND_NODE
fi


container_name=$("$NODE_EXE" "$DIRNAME/parse-json.js" "schema" "$MODE");
container_owner=$("$NODE_EXE" "$DIRNAME/parse-json.js" "user" "$MODE");


cat << EOF > move_tables_to_container.hdbprocedure
PROCEDURE "SYSTEM"."public::move_tables_to_container" ( ) 
        LANGUAGE SQLSCRIPT
        SQL SECURITY DEFINER 
        
         AS
BEGIN
/***************************** 
        Write your procedure logic 
 *****************************/
EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Conversions.TCURX" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Conversions.TCURX" TO "$container_name"."sap.hana.democontent.epm.data::Conversions.TCURX"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Conversions.TCURW" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Conversions.TCURW" TO "$container_name"."sap.hana.democontent.epm.data::Conversions.TCURW"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Conversions.TCURV" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Conversions.TCURV" TO "$container_name"."sap.hana.democontent.epm.data::Conversions.TCURV"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Conversions.TCURT" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Conversions.TCURT" TO "$container_name"."sap.hana.democontent.epm.data::Conversions.TCURT"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Conversions.TCURR" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Conversions.TCURR" TO "$container_name"."sap.hana.democontent.epm.data::Conversions.TCURR"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Conversions.TCURN" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Conversions.TCURN" TO "$container_name"."sap.hana.democontent.epm.data::Conversions.TCURN"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Conversions.TCURF" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Conversions.TCURF" TO "$container_name"."sap.hana.democontent.epm.data::Conversions.TCURF"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Conversions.TCURC" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Conversions.TCURC" TO "$container_name"."sap.hana.democontent.epm.data::Conversions.TCURC"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Conversions.T006A" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Conversions.T006A" TO "$container_name"."sap.hana.democontent.epm.data::Conversions.T006A"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Conversions.T006" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Conversions.T006" TO "$container_name"."sap.hana.democontent.epm.data::Conversions.T006"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::EPM.MapKeys" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::EPM.MapKeys" TO "$container_name"."sap.hana.democontent.epm.data::EPM.MapKeys"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::JobsDemo.RuntimeSchedules" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::JobsDemo.RuntimeSchedules" TO "$container_name"."sap.hana.democontent.epm.data::JobsDemo.RuntimeSchedules"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::JobsDemo.Details" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::JobsDemo.Details" TO "$container_name"."sap.hana.democontent.epm.data::JobsDemo.Details"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::MD.productLog" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::MD.productLog" TO "$container_name"."sap.hana.democontent.epm.data::MD.productLog"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::MD.Products" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::MD.Products" TO "$container_name"."sap.hana.democontent.epm.data::MD.Products"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::MD.Employees" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::MD.Employees" TO "$container_name"."sap.hana.democontent.epm.data::MD.Employees"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::MD.BusinessPartner" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::MD.BusinessPartner" TO "$container_name"."sap.hana.democontent.epm.data::MD.BusinessPartner"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::MD.Addresses" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::MD.Addresses" TO "$container_name"."sap.hana.democontent.epm.data::MD.Addresses"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::PO.Item" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::PO.Item" TO "$container_name"."sap.hana.democontent.epm.data::PO.Item"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::PO.Header" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::PO.Header" TO "$container_name"."sap.hana.democontent.epm.data::PO.Header"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::SO.Item" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::SO.Item" TO "$container_name"."sap.hana.democontent.epm.data::SO.Item"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::SO.Header" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::SO.Header" TO "$container_name"."sap.hana.democontent.epm.data::SO.Header"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::SO.Filter" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::SO.Filter" TO "$container_name"."sap.hana.democontent.epm.data::SO.Filter"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::User.Details" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::User.Details" TO "$container_name"."sap.hana.democontent.epm.data::User.Details"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Util.Texts" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Util.Texts" TO "$container_name"."sap.hana.democontent.epm.data::Util.Texts"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Util.SeriesData" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Util.SeriesData" TO "$container_name"."sap.hana.democontent.epm.data::Util.SeriesData"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Util.SSCOOKIE" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Util.SSCOOKIE" TO "$container_name"."sap.hana.democontent.epm.data::Util.SSCOOKIE"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Util.Notes" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Util.Notes" TO "$container_name"."sap.hana.democontent.epm.data::Util.Notes"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Util.Messages" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Util.Messages" TO "$container_name"."sap.hana.democontent.epm.data::Util.Messages"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Util.DataGenerationTime" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Util.DataGenerationTime" TO "$container_name"."sap.hana.democontent.epm.data::Util.DataGenerationTime"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Util.Constants" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Util.Constants" TO "$container_name"."sap.hana.democontent.epm.data::Util.Constants"';

EXEC 'ALTER TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Util.Attachments" OWNER TO $container_owner';
EXEC 'RENAME TABLE "SAP_HANA_DEMO"."sap.hana.democontent.epm.data::Util.Attachments" TO "$container_name"."sap.hana.democontent.epm.data::Util.Attachments"';

EXEC 'ALTER TABLE "LM"."sap.hana.democontent.epm.data::add" OWNER TO $container_owner';
EXEC 'RENAME TABLE "LM"."sap.hana.democontent.epm.data::add" TO "$container_name"."sap.hana.democontent.epm.data::add"';

END;
EOF