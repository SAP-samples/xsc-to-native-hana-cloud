set schema "SAP_HANA_DEMO";
drop trigger "sap.hana.democontent.epm.functions/add_insert_to_log";
CREATE TRIGGER "sap.hana.democontent.epm.functions/add_insert_to_log"
    AFTER INSERT ON 
         "sap.hana.democontent.epm.data::MD.Products" 
    REFERENCING NEW ROW newrow FOR EACH ROW
 BEGIN

  INSERT INTO "sap.hana.democontent.epm.data::MD.productLog" 
           VALUES(:newrow.PRODUCTID, 
                  now(), 
                  CURRENT_USER,
                  :newrow.PRODUCTID || ' has been created');
 END;
 
 INSERT into "sap.hana.democontent.epm.data::MD.Products" 
          values( 'ProductA', 'PR', 'Handheld', '0000000033', '20121003', '0000000033', '20121003',
                  '1000000149', '1000000150', '0100000029', 1, 'EA', 0.5, 'KG', 'CAD', 2490, '/sap/hana/democontent/epm/data/images/HT-7030.jpg',
                  0.09, 0.15, 0.1, 'M');
