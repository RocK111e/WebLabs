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
        $query = "SELECT * FROM students.students_list";
        $result = pg_query($this->conn, $query);
        return pg_fetch_all($result);
    }
    public function get_student($id) {
        $query = "SELECT * FROM students.students_list WHERE id = $id";
        $result = pg_query($this->conn, $query);
        return pg_fetch_assoc($result);
    }

    public function create_student($group, $name, $surname, $gender, $birthday){
        $query = "INSERT INTO students.students_list (\"Group\", \"Name\", \"Surname\", \"Gender\", \"Birthday\", \"Status\")
            VALUES ('$group', '$name', '$surname', '$gender', '$birthday', false);";
        $result = pg_query($this->conn, $query);
        if ($result) {
            // Check the number of affected rows
            $rows_affected = pg_affected_rows($result);
            if ($rows_affected > 0) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    public function update_student($id, $group, $name, $surname, $gender, $birthday) {
        $query = "UPDATE students.students_list SET \"Group\" = '$group', \"Name\" = '$name', \"Surname\" = '$surname', \"Gender\" = '$gender', \"Birthday\" = '$birthday' WHERE id = $id";
        $result = pg_query($this->conn, $query);
        return pg_affected_rows($result) > 0;
    }

    public function delete_student($id) {
        $query = "DELETE FROM students.students_list WHERE id = $id";
        $result = pg_query($this->conn, $query);
        return pg_affected_rows($result) > 0;
    }

    public function close_db_connection() {
        if ($this->conn) {
            pg_close($this->conn);
        }
    }
}

?>