<?php
namespace App\Controllers;

require_once __DIR__ . '/../Models/Database.php';
use App\Models\DBService;


class StudentController{
    private $db;

    public function __construct() {
        $this->db = new DBService();
    }

    public function get_all_students() {
        $result = $this->db->get_all_students();
        return json_encode($result);
    }

    public function get_student_by_id($id){
        $result = $this->db->get_student($id);
        return json_encode($result);
    }

    public function create_student($data) {
        $group = $data['Group'];
        $name = $data['Name'];
        $surname = $data['Surname'];
        $gender = $data['Gender'];
        $birthday = $data['Birthday'];

        // Validate the input data
        $validation_result = $this->validation($group, $name, $surname, $gender, $birthday);
        if ($validation_result !== true) {
            http_response_code(422);
            return json_encode(['error' => "$validation_result"]);
        }
        // Create the student in the database
        $result = $this->db->create_student($group, $name, $surname, $gender, $birthday);
        if ($result) {
            http_response_code(201);
            return json_encode(['message' => 'Student created successfully']);
        } else {
            http_response_code(500);
            return json_encode(['error' => 'Failed to create student']);
        }
    }

    public function update_student($id, $data){
        $group = $data['Group'];
        $name = $data['Name'];
        $surname = $data['Surname'];
        $gender = $data['Gender'];
        $birthday = $data['Birthday'];

        // Validate the input data
        $validation_result = $this->validation($group, $name, $surname, $gender, $birthday);
        if ($validation_result !== true) {
            http_response_code(422);
            return json_encode(['error' => "$validation_result"]);
        }

        $result = $this->db->update_student($id, $group, $name, $surname, $gender, $birthday);
        if ($result) {
            http_response_code(201);
            return json_encode(['message' => 'Student created successfully']);
        } else {
            http_response_code(500);
            return json_encode(['error' => 'Failed to create student']);
        }        
    }

    public function delete_student($id) {
        $result = $this->db->delete_student($id);
        if ($result) {
            http_response_code(200);
            return json_encode(['message' => 'Student deleted successfully']);
        } else {
            http_response_code(500);
            return json_encode(['error' => 'Failed to delete student']);
        }
    }

    public function count_student(){
        $result = $this->db->count_student();
        return json_encode($result);
    }

    private function validation($group, $name, $surname, $gender, $birthday){
        //data validation
        if (empty($group) || empty($name) || empty($surname) || empty($gender) || empty($birthday)) {
            return 'Empty field';
        }
        $group_regex = '#^[a-zA-Z]+-[0-9]+$#';
        if (!preg_match($group_regex, $group)) {
            return 'Invalid group format';
        }
        $string_regex = '#^[a-zA-Z]+[a-zA-Z- \']*[a-zA-Z]+$#';
        if (!preg_match($string_regex, $name)) {
            return 'Invalid name format';
        }
        if (!preg_match($string_regex, $surname)) {
            return 'Invalid surname format';
        }
        $gender_regex = '#^(Male|Female)$#';
        if (!preg_match($gender_regex, $gender)) {
            return 'Invalid gender format';
        }
        $date_regex = '#^\d{4}-\d{2}-\d{2}$#'; 
        if (!preg_match($date_regex, $birthday)) {
            return 'Invalid date format';
        }
        return true;
    }

}
?>