## Features Currently supported in SAP HANA Application Migration Assistant:

**Project Configuration Features During Migration**

The following features and changes have been applied as part of the project configuration during the migration process:

    - Generate SAP HANA Native project structure
    - Migrate database artifacts to SAP HANA Native formats i.e hdbdd-> hdbtables, hdbviews, hdbindexes and hdbtabletypes
    - Converte design time artifacts to HDI-compatible formats
    - Generate MTA deployment descriptor

**Data Type Conversion in Native artifacts:**  
  The following data type conversions are done during migration in the respective files `.hdbtable`, `.hdbprocedure`, `.hdbfunction`, `.hdbdropcreatetable`, `.hdbtrigger`, `.hdblibrary`, `.hdbstructuredprivilege`, `.hdbview`, `.hdbindex`, `.hdbconstraint`, `.hdbtablefunction`, `.hdbsequence`:
- ALPHANUM → NVARCHAR
- TEXT → NCLOB
- SHORTTEXT → NVARCHAR
- CHAR → VARCHAR
- BINTEXT → NCLOB

**Data type conversion** in calculation views:  
  - `date()` → `daydate()`  
  - `day()` → `daydate()`  
  - `time()` → `daytime()`  
  - `counter` (Integer) → `BIGINT`

**Series entity** is not supported in SAP HANA Cloud and will be converted to a regular entity. Please refer the [SAP HANA Cloud Documentation](https://help.sap.com/docs/hana-cloud/sap-hana-cloud-migration-guide/series-data).

**Indexes:**  
  Based on the technical configuration in SAP HANA hdbdd, if indexes are enabled for a hdbtable, then respective index files are created under the `hdbindex` folder.

**Fuzzy Search Indexes:**  
  If fuzzy search is enabled on a table or column, corresponding fuzzy search index files are generated under the `hdbindex` folder.
  - **Implicit Fuzzy Search Indexes:**  
    Indexes that are automatically created by the system (such as primary key indexes) are considered implicit indexes and are handled by the database without explicit index files. In HANA 2.0, certain SQL types (like SHORTTEXT and TEXT) always had an implicit fulltext index, but in HANA Cloud, these require explicit fuzzy search index creation during migration.created fuzzy search/text indexes for SHORTTEXT and TEXT datatype elements.
  - **Explicit Fuzzy Search Indexes:**  
    Indexes that are specifically defined in the technical configuration are created as explicit index files under the `hdbindex` folder.

**Full Text Index Removal:**  
  Full text indexes, which are no longer supported in SAP HANA Cloud, are removed during the migration process. For cases involving Text Analysis or Text Mining, please refer to the post-migration steps.

**Unsupported Features Folder:**  
  A folder named `unsupported_feature` has been created by the extension to contain file extensions that are not supported in SAP HANA Cloud.

**Synonym grantor service:** 
  Synonym grantor service will be added in mta descriptor if present in source project
