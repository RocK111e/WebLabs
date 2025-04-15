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

}
?>