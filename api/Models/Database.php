<?php
namespace App\Models;
// Connect to PostgreSQL
class DBService {
    private $conn;

    public function __construct() {
        $this->conn = $this->init_db_connection();
    }

    private function init_db_connection() {
        // Database connection parameters
        $host = "localhost";
        $port = "5432";
        $dbname = "students";
        $user = "postgres";
        $password = "1111";
        
        // Connection string
        $conn_string = "host=$host port=$port dbname=$dbname user=$user password=$password";

        $conn = pg_connect($conn_string);

        // Check connection
        if (!$conn) {
            echo "Connection failed: " . pg_last_error();
            die("Connection failed: " . pg_last_error());
        }

        return $conn;
    }

    public function get_all_students() {
        $this->init_db_connection();
        $query = "SELECT * FROM students.students_list";
        $result = pg_query($this->conn, $query);
        $this->close_db_connection();
        return pg_fetch_all($result);
    }
    public function get_student($id) {
        $query = "SELECT * FROM students.students_list WHERE id = $id";
        $result = pg_query($this->conn, $query);
        return pg_fetch_assoc($result);
    }

    public function close_db_connection() {
        if ($this->conn) {
            pg_close($this->conn);
        }
    }
}

?>