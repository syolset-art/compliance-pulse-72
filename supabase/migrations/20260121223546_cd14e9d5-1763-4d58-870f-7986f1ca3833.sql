-- Seed dummy data: Assign existing assets to work areas

-- IT og systemer
UPDATE assets 
SET work_area_id = '27056e97-5c80-4817-9dc6-51ef68aece17'
WHERE name IN ('Microsoft 365', 'SAP S/4HANA', 'ServiceNow ITSM', 'FW-MAIN01', 'SW-CORE01');

-- Ledelse og administrasjon
UPDATE assets 
SET work_area_id = '5acc39b4-288f-4f2c-9609-4734909e44d3'
WHERE name IN ('Salesforce CRM', 'Hovedkontor Oslo', 'Datasenter Green Mountain');

-- HR og personal
UPDATE assets 
SET work_area_id = '13fa06fd-d980-4823-8562-299360bf9130'
WHERE name IN ('Visma Business', 'Avdeling Bergen');

-- Økonomi og regnskap
UPDATE assets 
SET work_area_id = 'e6a1a675-a89f-429c-9217-0cdf1658e9da'
WHERE name IN ('HubSpot Marketing', 'Avdeling Trondheim', 'Avdeling Stavanger');