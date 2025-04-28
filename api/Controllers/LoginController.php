<?php 
namespace App\Controllers\LoginController;
require_once __DIR__ . '/../Controllers/JWT.php';
use App\Controllers\JWT;
require_once __DIR__ . '/../Models/Database.php';
use App\Models\DBService;

class LoginController {
    private $db;
    private $jwt;

    public function __construct() {
        $this->db = new DBService();
        $this->jwt = new JWT();
    }

    public function login($login, $password) {
        if ($this->validate_credentials($login, $password) === false) {
            http_response_code(422);
            return json_encode(['error' => 'Invalid credentials format']);
        }
        $user = $this->db->credentials_login($login, $password);
        if ($user === false) {
            http_response_code(401);
            return json_encode(['error' => 'Invalid credentials']);
        }
        $id = $user['id'];
        $token = $this->jwt->encode($id);
        $this->db->set_online($id, $token);
        http_response_code(200);
        return json_encode(['token' => $token]);
    }

    public function logout($jwt) {
        $decode_result = $this->jwt->decode($jwt);
        if ($decode_result === null) {
            http_response_code(401);
            return json_encode(['error' => 'Invalid token']);
        }
        if ($decode_result['expired'] === true) {
            $this->db->set_offline($decode_result['id']);
            http_response_code(401);
            return json_encode(['error' => 'Token expired']);
        }
        if ($decode_result['expired'] === false) {
            $this->db->set_offline($decode_result['id']);
            http_response_code(200);
            return json_encode(['error' => 'Invalid token']);
        }
    }

    public function validate_credentials($login, $password) {
        if(!preg_match('#^(a-zA-Z)+(0-9){4}$#', $login)){
            return false;
        }
        if(!preg_match('#^#^\d{4}-\d{2}-\d{2}$#$#', $password)){
            return false;
        }
        return true;
    }

    public function is_logged_in() {
        $headers = getallheaders();
    
    // Check for Authorization header
    if (!isset($headers['Authorization'])) {
        http_response_code(401);
        echo json_encode(['error' => 'No Authorization header provided']);
        exit;
    }
    
    // Extract the token 
    $authHeader = $headers['Authorization'];
    if (preg_match('#Bearer\s(\S+)#', $authHeader, $matches)) {
        $token = $matches[1];
        $decode_result = $this->jwt->decode($token);
        if ($decode_result === null) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid token']);
            exit;
        }
        if ($decode_result['expired'] === true) {
            $this->db->set_offline($decode_result['id']);
            http_response_code(401);
            echo json_encode(['error' => 'Expired token']);
            exit;
        }
        $this->db->set_online($decode_result['id'], $token);
        return true;
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid Authorization header format']);
        exit;
    }
    }

}
?>