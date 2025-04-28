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
        $query = "SELECT * FROM students.students_list \n
        ORDER BY \"id\" ASC";
        $result = pg_query($this->conn, $query);
        return pg_fetch_all($result);
    }
    public function get_student($id) {
        $query = "SELECT * FROM students.students_list WHERE id = $id";
        $result = pg_query($this->conn, $query);
        return pg_fetch_assoc($result);
    }

    public function create_student($group, $name, $surname, $gender, $birthday){
        $login = $this->login_generation($surname);
        $query = "INSERT INTO students.students_list (\"Group\", \"Name\", \"Surname\", \"Gender\", \"Birthday\", \"Status\", \"login\")
            VALUES ('$group', '$name', '$surname', '$gender', '$birthday', false, '$login');";
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

    public function count_student(){
        $query = 'SELECT COUNT(*) AS student_count FROM students.students_list';
        $result = pg_query($this->conn, $query);
        // Fetch the count
        $row = pg_fetch_assoc($result);
        $count = (int) $row['student_count']; // Cast to integer for safety
        
        return $count;
    }

    public function check_for_copy($group, $name, $surname, $gender, $birthday){
        // Check for duplicates
        $query = "SELECT * FROM students.students_list WHERE \"Group\" = '$group' AND \"Name\" = '$name' AND \"Surname\" = '$surname' AND \"Gender\" = '$gender' AND \"Birthday\" = '$birthday'";
        $result = pg_query($this->conn, $query);
        if (pg_num_rows($result) > 0) {
            return true;
        } else {
            return false;
        }
    }

    private function login_generation($surname){
        $exit_bool = false;
        while ($exit_bool === false){
            $random_suffix = rand(1000, 9999);
            $login = strtolower($surname) . $random_suffix;
            $query = "SELECT * FROM students.students_list WHERE \"login\" = '$login'";
            $result = pg_query($this->conn, $query);
            if (pg_num_rows($result) == 0) {
                $exit_bool = true;
            }
        }
        return $login;
    }

    public function credentials_login($login, $password){
        $query = "SELECT id, \"Name\", \"Surname\" FROM students.students_list WHERE \"login\" = '$login' AND \"Birthday\" = '$password'";
        $result = pg_query($this->conn, $query);
        if (pg_num_rows($result) === 1) {
            $row = pg_fetch_assoc($result);
            return [
                'id' => $row['id'],
                'Name' => $row['Name'],
                'Surname' => $row['Surname']
            ];
        } else {
            return false;
        }
    }
    public function set_offline($id){
        $query = "UPDATE students.students_list SET \"Status\" = false WHERE id = $id";
        $result = pg_query($this->conn, $query);
        return pg_affected_rows($result) > 0;
    }
    public function set_online($id){
        $query = "UPDATE students.students_list SET \"Status\" = true WHERE id = $id";
        $result = pg_query($this->conn, $query);
        return pg_affected_rows($result) > 0;
    }
    public function close_db_connection() {
        if ($this->conn) {
            pg_close($this->conn);
        }
    }

    public function __destruct() {
        $this->close_db_connection();
    }
}

?>