<?php
namespace App\Routers;
require_once __DIR__ . '/../Controllers/StudentController.php';
use App\Controllers\StudentController;
require_once __DIR__ . '/../Controllers/PopulateController.php';
use App\Controllers\PopulateController;

class Router {
    public function route() {
        // Get the request method and URI
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH); // Get only the path
        $uri = preg_replace('#^/WebLabs/api/app.php#', '', $uri);
        // Flag to track if a route was matched
        $routeMatched = false;

        //Define routes
        if (preg_match('#^/students#', $uri)) {
            $controller = new StudentController();

            if ($method === 'GET' && preg_match('#^/students$#', $uri)) {
                //Get all students
                echo $controller->get_all_students();
                http_response_code(200);
                $routeMatched = true;
            } elseif ($method === 'GET' && preg_match('#^/students/(\d+)$#', $uri, $matches)) {
                // Get a specific student by ID
                $id = $matches[1];
                echo $controller->get_student_by_id($id);
                $routeMatched = true;
            } elseif ($method === 'POST' && preg_match('#^/students$#', $uri)) {
                // Create a new student
                $data = json_decode(file_get_contents('php://input'), true);
                echo $controller->create_student($data);
                $routeMatched = true;
            } elseif ($method === 'PUT' && preg_match('#^/students/(\d+)$#', $uri, $matches)) {
                // Update a specific student by ID
                $id = $matches[1];
                $data = json_decode(file_get_contents('php://input'), true);
                echo $controller->update_student($id, $data);
                $routeMatched = true;
            } elseif ($method === 'DELETE' && preg_match('#^/students/(\d+)$#', $uri, $matches)) {
                // Delete a specific student by ID
                $id = $matches[1];
                echo $controller->delete_student($id);
                $routeMatched = true;
            }elseif ($method === 'GET' && preg_match('#^/students/count$#', $uri)){
                // Get count for pagination
                echo $controller->count_student();
                $routeMatched = true;
            }
            
        }
        elseif (preg_match('#^/login#', $uri)) {
            //$controller = new StudentController();
            // Handle login logic here
        }
        elseif (preg_match('#^/populate/(\d+)$#', $uri, $matches)) {
            $controller = new PopulateController();
            $count = $matches[1];
            $controller->populate_students($count);
            $routeMatched = true;
            
        }
        // If no route was matched, return a 404 response
        if (!$routeMatched) {
            http_response_code(404);
            echo json_encode(['error' => 'Route not found']);
        }
    }
}
?>