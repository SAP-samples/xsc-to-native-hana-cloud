# Migration of SAP HANA XS Classic To SAP HANA Native Using SAP HANA Application Migration Assistant

[![REUSE status](https://api.reuse.software/badge/github.com/SAP-samples/xsc-to-native-hana-cloud)](https://api.reuse.software/info/github.com/SAP-samples/xsc-to-native-hana-cloud)

## Table of Contents
- [Migration of SAP HANA XS Classic To SAP HANA Native Using SAP HANA Application Migration Assistant](#migration-of-sap-hana-xs-classic-to-sap-hana-native-using-sap-hana-application-migration-assistant)
  - [Table of Contents](#table-of-contents)
  - [Description](#description)
  - [Introduction](#introduction)
  - [Requirements](#requirements)
  - [Where to Start](#where-to-start)
  - [Step-1: Install and Configure the SAP Cloud Connector](#step-1-install-and-configure-the-sap-cloud-connector)
  - [Step-2: Setup an SAP BTP Destination to connect to the source system](#step-2-setup-an-sap-btp-destination-to-connect-to-the-source-system)
  - [Step-3: Create a SAP Business Application Studio Devspace with the SAP HANA Application Migration Assistant Extension installed](#step-3-create-a-sap-business-application-studio-or-sap-build-devspace-with-the-sap-hana-application-migration-assistant-extension-installed)
  - [Step-4: Migrate using the SAP HANA Application Migration Assistant](#step-4-migrate-using-the-sap-hana-application-migration-assistant)
  - [Step-5: Database post migration changes](#step-5-database-post-migration-changes)
  - [Step-6: Deployment of the Migrated database artifacts](#step-6-deployment-of-the-migrated-database-artifacts)
  - [Known Issues in SAP HANA Application Migration Assistant](#known-issues-in-sap-hana-application-migration-assistant)
  - [Supported Features](#supported-features)
  - [Unsupported Features](#unsupported-features)
  - [Learning Resources](#learning-resources)
  - [How to obtain support](#how-to-obtain-support)
  - [License](#license)

## Description
The SAP HANA Application Migration Assistant enables users to migrate XS Classic applications packaged either as a Delivery Unit or as a Package into SAP HANA Native applications, targeting SAP HANA Cloud as the database.

In this enhanced version, the assistant performs:

**Automated Conversion of Database Artifacts:** Source XS Classic Repository database objects (such as .hdbdd, .hdbtable, .hdbview, etc.) are transformed into their corresponding SAP HANA Native compliant database artifacts, with naming adapted to SAP HANA Cloud conventions.

> [!CAUTION]
> As automated conversion is not guaranteed to be 100% accurate, human intervention is required post-migration to validate, refine, and productionize the application logic and service definitions.

In this sample, conversion of Source XS Classic Repository database artifacts to the corresponding target SAP HANA Native compliance database artifacts are listed.

## Introduction
SAP HANA Interactive Education or SHINE is a demo application that is packaged as [HCO_DEMOCONTENT](https://github.com/SAP-samples/hana-shine/releases/download/v2.5.0/HCO_DEMOCONTENT-1.205.0.tgz) Delivery Unit. It includes the following features: 
- **HDI Features:**
  - Table
  - HDBDD Views
  - Sequence
  - Calculation Views
  - Analytical Views
  - Attribute Views
  - Associations
  - Table Functions
  - Synonyms
  - Procedures
  - Spatial Features
  - Local Time Data Generation
  - Index
  - Structured Privilege
  - Analytical Privilege

HCO_DEMOCONTENT follows the XS Classic Programming Model(XSC) and uses SAP HANA on-premise for the database. This article describes the steps to be followed to migrate this Delivery Unit from XS Classic to SAP HANA Native with SAP HANA Cloud as the database using the SAP HANA Application Migration Assistant.
The SAP HANA Application Migration Assistant performs only database artifact migration. It does not perform any service layer migration and does not use AI to perform any part of the migration process. All transformations are rule-based and deterministic.

<p align="center">
<img src="images\SAPHAMASD.png">
</p>

## Requirements
- XS Classic on-premise database source system with the [HCO_DEMOCONTENT](https://github.com/SAP-samples/hana-shine/releases/download/v2.5.0/HCO_DEMOCONTENT-1.205.0.tgz) delivery unit.
- SAP Business Technology Platform subaccount with the following 
  - Service instances:
    - `SAP Hana Cloud` and
    - `SAP Hana Schemas and HDI Containers`
  - Subscription
    - **SAP Business Application Studio or or SAP Build** with SAP HANA Tools extension for database development and deployment.
- SAP Cloud Connector


## Where to Start
To successfully migrate the HCO_DEMOCONTENT sample delivery unit using the SAP HANA Application Migration Assistant, follow the steps below:

1. Install and configure the SAP Cloud Connector.
2. Setup an SAP BTP Destination to connect to the source system.
3. Create a Dev Space in SAP Business Application Studio with SAP HANA Application Migration Assistant extension installed.
4. Migrate using the SAP HANA Application Migration Assistant.
5. Database post migration changes.
6. Deployment of the migrated database artifacts.


> [!NOTE]  
> This sample covers only the migration of the database artifacts from SAP Neo Database to SAP Hana Cloud.  
> The migration steps should be tested in a development environment before production.
> This guide is directed at single-tenant-applications.

## Step-1: Install and Configure the SAP Cloud Connector

1. Install the [SAP Cloud Connector](https://tools.hana.ondemand.com/#cloud) on your local system. For the installation and setup of the cloud connector, please refer to this [Documentation](https://help.sap.com/docs/connectivity/sap-btp-connectivity-cf/installation?locale=en-US).  
  
2. After installing the cloud connector, you can access it by opening your web browser and going to `https://localhost:<port-no>/`. Use your credentials to log in.
   
3. Once you've successfully logged in, you should set up two connections in the Cloud Connector.
   -  The first connection should link to the subaccount with the source database, and the second connection should be for the target subaccount with the SAP Hana Cloud. To establish these connections, click on the connector button in the left menu. 

   -  Now, enter the necessary details for your subaccount - this includes the Region, Subaccount ID, Display Name, Subaccount User, Password, and Location ID. After entering all the information, click on 'Save'.

<p align="center">
    <img src="images\destination1.png" width="600" height="400">
</p>

4. Select the subaccount where the source database is located, then add a service channel under 'on-prem to cloud' using the following details:  
    
   - **Type**: HANA Database
    
   - **HANA Instance Name**: < DB/Schema ID >
    
   - **Local Instance Number**: Input any two-digit number between 00 and 09. This number is used to compute the port number needed to access the SAP instance in the SAP Hana Cloud. The local port is calculated from the local instance number (3<n<15). For example, if the number is 7, then the local port would be 30715.
    
   - **Connections**: 1

<p align="center">
    <img src="images\destination2.png" width="600" height="400">
</p>

5. In the SAP Business Technology Platform (BTP) Cloud Foundry account where the SAP Business Application Studio (BAS) subscription is created, select 'Cloud to On-Prem' and add a mapping with the following details:  
    
   - **Back-end Type**: SAP Hana  
    
   - **Protocol**: TCP  
    
   - **Internal Host**: localhost  
    
   - **Internal Port**: < portno > (The port number derived from your local instance number)  
    
   - **Virtual Host**: myvirtualhost  
    
   - **Virtual Port**: This should be the same as your internal port
    
   - **Principal Type**: None  
        
<p align="center">
    <img src="images\destination3.png" width="600" height="400">
</p>
    
## Step-2: Setup an SAP BTP Destination to connect to the source system
  
Navigate to the SAP BTP Cloud Foundry subaccount and select 'Destination' under 'Connectivity' from the left menu pane. Create a new destination using the following details:
 
 - **Name**: < Destination name >
 - **Type**: HTTP
 - **URL**: `https://<virtual-host>:<virtual-port-no>/`
 - **ProxyType**: on-premise
 - **Authentication**: NoAuthentication
 - **Locationid**: Location id as mentioned in cloud connector

And the following additional properties: 
 - **HTML5.DynamicDestination** : true
 - **WebIDEEnabled** : true
 - **WebIDEUsage** : xs_hdb 
    
<p align="center">
    <img src="images\destination4.png" width="600" height="400">
</p>

## Step-3: Create a SAP Business Application Studio or SAP Build Devspace with the SAP HANA Application Migration Assistant Extension installed  
    
1. In the SAP BTP subaccount where you created the destination, establish a subscription to SAP Business Application Studio (BAS).

2. Open SAP Business Application studio subscription.

3. Select "Create Dev Space". Assign a desired name to your Dev Space and select the "SAP HANA Native Application" type. Then, choose the `SAP HANA Application Migration Assistant` Extension to help with migration, as well as the `SAP Hana Tools` Extension which will be required later for deployment. Finally, click on "Create Dev Space".
   
4. Wait for the status of your newly created Dev Space to change to "Running". Once it's running, you can open it by clicking on the name of the Dev space that you just created.
   
5. Navigate to the folder by clicking on File -> Open Folder. Enter the path `/home/user/projects/` and click on OK.
   
6. Once the folder opens, you can select the SAP HANA Application Migration Assistant from the Command Palette (You can access the Command Palette from View -> Command Palette).

## Step-4: Migrate using the SAP HANA Application Migration Assistant

1. Open the the Command Palette and type "SAP HANA Application Migration Assistant" and select the command when it appears.
    
2. When the Migration Assistant Wizard opens, select the migration path. Since we are migrating from XS Classic to SAP HANA Native, select `XSC to HANA native` as your migration path.		

<p align="center">
  <img width="536" alt="HomeScreen" src="images\homescreen.png">
</p>


3. In the Data Source page of the wizard, choose the destination you previously created from the dropdown menu. 
    
<p align="center">
  <img width="544" alt="DestinationList" src="images\destinationList.png">
</p>

4. Enter the user credentials for the SAP HANA Database Migration User - username and password - into their respective fields. Hit the login button to authorize these credentials.[Procedure to create migration user](https://help.sap.com/docs/SAP_HANA_PLATFORM/58d81eb4c9bc4899ba972c9fe7a1a115/2786447387df41f69a0dad1cc2973e95.html#procedure)
    
<p align="center">
<img width="545" alt="Login" src="images\login.png">
</p>

5. To proceed, click on the Next button.  
        
<p align="center">
<img width="545" alt="LoggedIn" src="images\loginEnabled.png">
</p>

6. In the "Migration Options" page, select "Delivery Unit" or "Package Name" as your source type from the drop-down menu. The SAP HANA Application Migration Assistant supports package level migration as well.

<p align="center">
<img width="545" alt="selectType" src="images\selectType.png">
</p>
  
7. Enter the name of your Source Delivery Unit in this case, it would be `HCO_DEMOCONTENT` or Source Package Name which will be `sap.hana.democontent.epm:true`. 	

<p align="center">
<img width="545" alt="DU1" src="images\DeliveryUnit1.png">
</p>

<p align="center">
<img width="545" alt="package" src="images\packageExample1.png">
</p>

8. Choose the target directory. This is where the migration results will be stored.
   
   **Note:** Ensure that the directory you select is a sub-directory of `/home/user/projects`.	

<p align="center">
<img width="545" alt="DU2" src="images\DeliveryUnit2.png">
</p>

9. Specify a unique name for the Target Folder, where the migration results will be saved. Once you've entered the name, click on Finish.

<p align="center">
<img width="545" alt="end" src="images\DeliveryUnit3.png">
</p>

10. Select the XSC Compatilibity Mode by setting it to True, False or Default.

<p align="center">
<img width="545" alt="end" src="images\xscCompatibilityMode.png">
</p>

**xsc-compatibility-mode** is a view property introduced to maintain behavioral compatibility with how Calculation Views, especially those with aggregation nodes or star joins, worked in XS Classic (XSC) when migrating them to HANA Deployment Infrastructure (HDI) in XSA.
In the SAP HANA Application Migration Assistant, the UI provides a drop down with 3 options for the xsc-compatibility-mode. 
    They are: 
    <li>True: Sets the value to true and enables the legacy XS Classic behaviour in CVs</li>
    <li>False: Sets the value to false and adopts the native XSA behaviour</li>
    <li>Default: Retain the existing values for all CVs</li>

please refer to [xsCompatibilitymode](https://help.sap.com/docs/hana-cloud-database/sap-hana-cloud-sap-hana-database-modeling-guide-for-sap-business-application-studio/70d331c824b5460b82c1fb7f9919ee18.html?q=compatibility).

11. Select the Migration Type (Default: non-staged) and click on Finish
If your application depends on objects from external schemas or HDI containers, a non-staged migration generates single hdbsynonym, hdbsynonymconfig, and hdbgrants files to provide access. Staged migration, on the other hand, creates separate files for each external object, allowing you to isolate access as needed.

<p align="center">
<img width="545" alt="end" src="images\stagedMigration.png">
</p>

12. When a notification appears in the bottom-right corner of your screen, it indicates that the migration process has started. This notification will provide real-time updates throughout the process. 
At the end of the migration, a SAP HANA Native project will be generated, containing:
    -  Revised database artifacts
    -  A `report.html` file summarizing migration details and areas requiring manual review.

<p align="center">
<img width="545" alt="end" src="images\end.png">
</p>

## Step-5: Database post migration changes
Once the project is created, there are some adjustments we need to make manually as these are not currently handled by the SAP HANA Application Migration Assistant. We have provided the changed files for [HCO_DEMOCONTENT](https://github.com/SAP-samples/xsc-hana-native-migration/tree/main/hana-shine-native-final) for reference.
 1. If your project contains any files from a different schema, these need to be migrated before migrating the current Delivery Unit and included in this project. If this can't be done immediately, you can remove them for the time being. To utilize objects from other containers, please refer to the SAP HANA Cloud help documentation and configure accordingly.
    
    For the HCO_DEMOCONTENT project, make the following changes:
    - Delete the uis folder from db/cfg
    - Delete `synonym-grantor-service.hdbgrants` and `synonym-grantor-service.hdbsynonymconfig` from db/cfg
    - Delete the uis and ui folder in db/src
    - Delete `synonym-grantor-service.hdbsynonym` from db/src/models
 2. In order to access objects from other public schemas, you will need to either create a new hdbsynonym file or modify an existing one.
    For the HCO_DEMOCONTENT project, edit the `db/src/synonym-grantor-service.hdbsynonym` file with the following configuration:
    ```
    {
      "sap.hana.democontent.epm::DUMMY": {
         "target": {
           "schema": "SYS",
           "object": "DUMMY"
         }
      },
      "sap.hana.democontent.epm::M_TIME_DIMENSION": {
         "target": {
           "schema": "_SYS_BI",
           "object": "M_TIME_DIMENSION"
         }
      },
      "M_TIME_DIMENSION":{
         "target": {
           "schema": "_SYS_BI",
           "object": "M_TIME_DIMENSION"
         }
      }
    }
    ```
 3. In addition, please take the time to clear out unused role names from the `default_access_role.hdbrole` file located in the db/src/defaults folder. If there are specific roles required for your project, ensure to add them as needed.
    For the HCO_DEMOCONTENT project, Remove `sap.hana.democontent.epm::migration_all_analytic_priv` role under names. 
    
 4. The assistant will modify the name of the artifacts in your project. Therefore, ensure to update the references to these artifacts accordingly.
    - For the HCO_DEMOCONTENT project, you'll need to adjust the references for entities under the `currencyConversionTables` tag. This is located in the `db/src/models/PURCHASE_COMMON_CURRENCY.hdbcalculationview` file. Make the changes as follows:

      ```
      <currencyConversionTables rates="sap.hana.democontent.epm.data::Conversions.TCURR" configuration="sap.hana.democontent.epm.data::Conversions.TCURV" prefactors="sap.hana.democontent.epm.data::Conversions.TCURF" notations="sap.hana.democontent.epm.data::Conversions.TCURN" precisions="sap.hana.democontent.epm.data::Conversions.TCURX"/>
      ```

 5.  Unused configurations should be removed from hdbrole files, or these files should be adjusted to add supported options.
     For the HCO_DEMOCONTENT project, make the following alterations:
     - In `db/src/roles/User.hdbrole`, eliminate the following unused configurations:
       ```
       {
         "reference": "_SYS_BIC",
         "privileges": [
            "EXECUTE",
            "SELECT"
         ]
       },
       {
         "reference": "_SYS_REPO",
         "privileges": [
            "EXECUTE",
            "SELECT"
         ]
       },
       {
         "reference": "_SYS_RT",
         "privileges": [
            "SELECT"
         ]
       }
       ```
       **Reason**: During the deployment step, access permissions will be granted by executing certain SQL commands.
       
     - In `db/src/roles/Admin.hdbrole`, eliminate the following unused configurations:
       ```
       {
         "name": "REPOSITORY_REST",
         "type": "PROCEDURE",
         "privileges": 
         [
            "EXECUTE"
         ]
       }
       ```
       **Reason**: Roles are not needed for executing procedures in the same HDI container.
     - Alter `db/src/roles/Admin.hdbrole` by replacing the existing schema privileges and adding schema analytic privileges:
       ```
       "schema_privileges": [
       {
          "reference": "< Schema Name >",
          "privileges": [
             "SELECT METADATA",
             "SELECT CDS METADATA",
             "SELECT",
             "INSERT",
             "EXECUTE",
             "DELETE",
             "UPDATE",
             "CREATE TEMPORARY TABLE"
          ]
       }
       ],
       "schema_analytic_privileges": [
       {
          "schema_reference": "< Schema Name >",
          "privileges": [
             "sap.hana.democontent.epm.models::AP_SALES_ORDER_6",
             "sap.hana.democontent.epm.models::AP_SALES_ORDER",
             "sap.hana.democontent.epm.models::AP_SALES_ORDER_1",
             "sap.hana.democontent.epm.models::AP_SALES_ORDER_2",
             "sap.hana.democontent.epm.models::AP_SALES_ORDER_4",
             "sap.hana.democontent.epm.models::AP_SALES_ORDER_12",
             "sap.hana.democontent.epm.models::AP_SALES_ORDER_3",
             "sap.hana.democontent.epm.models::AP_SALES_ORDER_9",
             "sap.hana.democontent.epm.models::AP_PURCHASE_ORDER_2",
             "sap.hana.democontent.epm.models::AP_SALES_ORDER_10",
             "sap.hana.democontent.epm.models::AP_PURCHASE_ORDER_PROD_CAT_1",
             "sap.hana.democontent.epm.models::AP_PURCHASE_ORDER_3",
             "sap.hana.democontent.epm.models::AP_SALES_ORDER_5",
             "sap.hana.democontent.epm.models::AP_PURCHASE_ORDER_1",
             "sap.hana.democontent.epm.models::AP_SALES_ORDER_7",
             "sap.hana.democontent.epm.models::AP_PURCHASE_ORDER_PROD_CAT_2",
             "sap.hana.democontent.epm.models::AP_PURCHASE_ORDER",
             "sap.hana.democontent.epm.models::AP_PURCHASE_ORDER_PROD_CAT"
          ]
       }
       ],
       ```
       **Reason**: The modifications in the hdbrole file are needed to access calculation views with analytic privileges.
 6. Assign the permission to users with the admin role for accessing the schema.
    For the HCO_DEMOCONTENT project, create an `Admin.hdbroleconfig` file in the `db/src/roles/` directory. The file should contain the following configuration:
    ```
    {
      "sap.hana.democontent.epm.roles::Admin": {
         "< Schema Name >": {
            "schema": "< Schema Name >"
         }
      }
    }
    ```
 7. In each of the .hdbtabledata files under db/src/data/loads remove the namespace `sap.hana.democontent.epm.data.loads::` from the csv file names `file_name`. For example change `sap.hana.democontent.epm.data.loads::constants.csv` to `constants.csv`.
 8. Adjust SQL syntax in procedures. For instance, "UPDATE FROM" should be changed to "MERGE INTO", and "TRUNCATE" statements should be replaced with "DELETE FROM" statements.
 9. Currently, changes to Reptask, and Replication artifacts are not covered. You will need to modify these manually. Unsupported types and functions in the calculation view such as "CE_FUNCTION", "CACHE", etc., need to be noted. Please refer to the [SAP HANA Cloud Documentation](https://help.sap.com/docs/hana-cloud/sap-hana-cloud-migration-guide/checks-performed-by-migration-tool) for more details on how to handle these.
 10.  Series entity is not supported in Hana Cloud so they will be removed by the extension. Please check [Migration Documentation](https://help.sap.com/docs/hana-cloud/sap-hana-cloud-migration-guide/series-data%22) for more information.

## Step-6: Deployment of the Migrated database artifacts

1. In your dev space, the database connection and artifacts of your project will be visible under the "SAP HANA Projects" section.
   
2. Next, log in to your Cloud Foundry account using the following steps:

   - Open a new terminal in the SAP Business Application Studio
   - Run the command `cf login -a < API_URL >` and input your username and password

3. For the Database Connection of the project, click "Bind" and then select "Bind to an HDI Container" and finally select the HDI container created in your SAP BTP Space. Once successfully bound, you will see a .env file with the VCAP services created in the db folder of your project.
   
4. Replace < Schema Name > with this value in the `Admin.hdbroleconfig` and `Admin.hdbrole` files.

5. Click the "Open HDI Container" button to open the database explorer.
   
6. Open an SQL console with your DBADMIN user or with admin privileges.
   
7. Run the following query in SAP HANA Cloud to grant access: <Schema Name> should be replaced with your specific schema name. You can also create roles and grant file for granting access.

   ```
   GRANT SELECT ON SCHEMA "_SYS_BI" TO "< Schema Name >#OO";

   GRANT SELECT ON "_SYS_BI"."M_TIME_DIMENSION" TO "< Schema Name >#OO";

   GRANT UPDATE ON "_SYS_BI"."M_TIME_DIMENSION" TO "< Schema Name >#OO" WITH GRANT OPTION;

   GRANT INSERT, SELECT, UPDATE ON "_SYS_BI"."M_TIME_DIMENSION" TO "< Schema Name >#OO" WITH GRANT OPTION;

   GRANT SELECT ON SCHEMA "_SYS_BI" TO "< Schema Name >#OO" WITH GRANT OPTION;
   ```
8. To deploy your application, select the "Deploy" button located in the "SAP HANA Projects" section.

## Known Issues in SAP HANA Application Migration Assistant

**Database:**

- Some artifacts which are currently not supported in the SAP HANA Application Migration Assistant require manual remodeling before deployment. You can find detailed information on manually migrating these artifacts in the following [link](https://help.sap.com/docs/hana-cloud/sap-hana-cloud-migration-guide/checks-performed-by-migration-tool).


## Supported Features
For a detailed list of the features supported by the SAP HANA Application Migration Assistant for Database, please refer to [this](supportedFeatures.md) link.

## Unsupported Features
   
1. Following Artifacts are not currently supported '.hdbreptask'.

2. If the source files have any errors, the migration of the Delivery Unit or Package by the SAP HANA Application Migration Assistant will fail. For example: If the javascript files have unknown characters like ```NULL```, the migration will fail with errors. Please check the output logs for the error messages.

## Learning Resources
1. [Prepare XS Classic Artifacts for Migration](https://help.sap.com/docs/SAP_HANA_PLATFORM/58d81eb4c9bc4899ba972c9fe7a1a115/a759b4815ae246649c83365cbcede79b.html).
2. [Prepare the Source System for the XS Application Migration](https://help.sap.com/docs/SAP_HANA_PLATFORM/58d81eb4c9bc4899ba972c9fe7a1a115/2786447387df41f69a0dad1cc2973e95.html).
3. [The Self-Service Migration Tool for SAP HANA Cloud](https://help.sap.com/docs/hana-cloud/sap-hana-cloud-migration-guide/self-service-migration-for-sap-hana-cloud-tool).
4. [SAP HANA Cloud, SAP HANA Database Developer Guide for Cloud Foundry Multitarget Applications (SAP Business App Studio)](https://help.sap.com/docs/hana-cloud-database/sap-hana-cloud-sap-hana-database-developer-guide-for-cloud-foundry-multitarget-applications-sap-business-app-studio/sap-hana-cloud-sap-hana-database-developer-guide-for-cloud-foundry-multitarget-applications-sap-business-app-studio)


## How to obtain support
[Create an issue](https://github.com/SAP-samples/xsc-to-native-hana-cloud/issues) in this repository if you find a bug or have questions about the content.
 
For additional support, [ask a question in SAP Community](https://answers.sap.com/questions/ask.html).

## Contributing
If you wish to contribute code, offer fixes or improvements, please send a pull request. Due to legal reasons, contributors will be asked to accept a DCO when they create the first pull request to this project. This happens in an automated fashion during the submission process. SAP uses [the standard DCO text of the Linux Foundation](https://developercertificate.org/).

## License
Copyright (c) 2024 SAP SE or an SAP affiliate company. All rights reserved. This project is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](LICENSE) file.
