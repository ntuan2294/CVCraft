-- Reseed default CV templates if table is empty
-- This migration handles the case where all templates were deleted manually
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM cv_templates LIMIT 1) THEN
        INSERT INTO cv_templates (id, name, description, fields, supports_photo_upload, summary_label, thumbnail) VALUES
        (1, 'Template 1', 'Có ảnh, dùng nhãn Profile cho phần tóm tắt', 'photo,name,job_title,profile,work_experience,education,contact,language,skills,reference', true, 'Profile', '/template-images/temp1-v2.jpg'),
        (2, 'Template 2', 'Có ảnh, dùng nhãn About me cho phần tóm tắt', 'photo,name,job_title,about_me,work_experience,education,contact,language,skills,reference', true, 'About me', '/template-images/temp2.jpg'),
        (3, 'Template 3', 'Không ảnh, dùng nhãn Profile cho phần tóm tắt', 'name,job_title,profile,work_experience,education,contact,language,skills,reference', false, 'Profile', '/template-images/temp3.jpg'),
        (4, 'Template 4', 'Mẫu có vùng ảnh trong file, dùng Personal summary', 'photo,name,job_title,personal_summary,work_experience,education,contact,language,skills,reference', false, 'Personal summary', '/template-images/temp4.jpg'),
        (5, 'Template 5', 'Không ảnh, dùng nhãn Summary gọn gàng', 'name,job_title,summary,work_experience,education,contact,language,skills,reference', false, 'Summary', '/template-images/temp5-v2.jpg'),
        (6, 'Template 6', 'HTML/CSS modern, LLM viết nội dung JSON rồi render vào template', 'name,job_title,about_me,work_experience,education,contact,language,skills', false, 'About me', '/template-images/temp6.jpg');

        -- Reset sequence to max id
        PERFORM setval('cv_templates_id_seq', 6);
    END IF;
END $$;
