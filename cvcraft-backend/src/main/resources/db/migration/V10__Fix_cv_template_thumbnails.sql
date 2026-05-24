-- Fix incorrect thumbnail paths for Template 1, 5, and 6
UPDATE cv_templates SET thumbnail = '/template-images/temp1-v2.jpg' WHERE id = 1;
UPDATE cv_templates SET thumbnail = '/template-images/temp5-v2.jpg' WHERE id = 5;
UPDATE cv_templates SET thumbnail = '/template-images/temp6.jpg'    WHERE id = 6;
