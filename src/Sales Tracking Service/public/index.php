<?php
require_once __DIR__ . '/../vendor/autoload.php';

$connection = new PDO(
    'mysql:host=' . getenv('DB_HOST') . ';dbname=' . getenv('DB_NAME'),
    getenv('DB_USER'),
    getenv('DB_PASSWORD')
);

$repository = new App\Repository\SaleRepository($connection);
$controller = new App\Controller\SaleController($repository);

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

header('Content-Type: application/json');

try {
    switch ("$method $path") {
        case 'GET /sales':
            echo json_encode($controller->index());
            break;
        case (preg_match('#^GET /sales/(\d+)$#', "$method $path", $matches) ? true : false):
            $sale = $controller->show((int)$matches[1]);
            echo $sale ? json_encode($sale) : http_response_code(404);
            break;
        case 'POST /sales':
            $data = json_decode(file_get_contents('php://input'), true);
            $controller->create($data);
            http_response_code(201);
            break;
        default:
            http_response_code(404);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
