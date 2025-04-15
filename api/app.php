<?php
// backend/app.php
header('Content-Type: application/json');

require_once 'ErrorHandler.php';

set_error_handler("ErrorHandler::handleError");
set_exception_handler("ErrorHandler::handleException");

// try {
//     $pdo = new PDO(
//         "pgsql:host=localhost;port=5432;dbname=students",
//         "postgres",
//         "1111",
//         [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
//     );
//     echo json_encode(['message' => 'PostgreSQL connection successful']);
// } catch (PDOException $e) {
//     http_response_code(500);
//     echo json_encode(['error' => 'Connection failed: ' . $e->getMessage()]);
// }


require_once __DIR__ . '/Routers/Router.php';
use App\Routers\Router;

$router = new Router();
$router->route();
?>