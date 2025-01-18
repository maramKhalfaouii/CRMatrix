<?php
require_once __DIR__ . '/../vendor/autoload.php';

use OpenTelemetry\API\Trace\Span;
use OpenTelemetry\API\Trace\SpanKind;
use Prometheus\CollectorRegistry;
use DaprClient\DaprClient;

// Initialize Prometheus metrics
$registry = new CollectorRegistry(new Redis(['host' => 'redis']));

$saleOperations = $registry->getOrRegisterCounter(
    'sales_operations_total',
    'Total sale operations',
    ['operation', 'status']
);

$operationDuration = $registry->getOrRegisterHistogram(
    'sale_operation_duration_seconds',
    'Duration of sale operations',
    ['operation']
);

// Initialize Dapr client
$daprClient = new DaprClient();

// Initialize database connection
try {
    $connection = new PDO(
        'mysql:host=' . getenv('DB_HOST') . ';dbname=' . getenv('DB_NAME'),
        getenv('DB_USER'),
        getenv('DB_PASSWORD'),
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    error_log("Database connection failed: " . $e->getMessage());
    http_response_code(500);
    exit(json_encode(['error' => 'Database connection failed']));
}

$repository = new App\Repository\SaleRepository($connection);
$controller = new App\Controller\SaleController($repository);

// Get current trace context
$tracer = OpenTelemetry\API\GlobalTracerProvider::get()->getTracer('sales-service');

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

header('Content-Type: application/json');

// Start main request span
$span = $tracer->startSpan(
    "$method $path",
    ['kind' => SpanKind::KIND_SERVER]
);

try {
    $startTime = microtime(true);
    
    switch ("$method $path") {
        case 'GET /sales':
            $span->setAttribute('operation', 'list_sales');
            $result = $controller->index();
            $saleOperations->inc(['operation' => 'list', 'status' => 'success']);
            echo json_encode($result);
            break;

        case (preg_match('#^GET /sales/(\d+)$#', "$method $path", $matches) ? true : false):
            $span->setAttribute('operation', 'get_sale');
            $span->setAttribute('sale.id', $matches[1]);
            
            $sale = $controller->show((int)$matches[1]);
            if ($sale) {
                $saleOperations->inc(['operation' => 'get', 'status' => 'success']);
                echo json_encode($sale);
            } else {
                $saleOperations->inc(['operation' => 'get', 'status' => 'not_found']);
                http_response_code(404);
            }
            break;

        case 'POST /sales':
            $span->setAttribute('operation', 'create_sale');
            $data = json_decode(file_get_contents('php://input'), true);
            
            $result = $controller->create($data);
            
            // Publish event via Dapr
            $daprClient->publishEvent(
                'pubsub',
                'sale-events',
                ['action' => 'created', 'saleId' => $result['id']]
            );
            
            $saleOperations->inc(['operation' => 'create', 'status' => 'success']);
            http_response_code(201);
            echo json_encode($result);
            break;

        default:
            $saleOperations->inc(['operation' => 'unknown', 'status' => 'not_found']);
            http_response_code(404);
    }

    // Record operation duration
    $duration = microtime(true) - $startTime;
    $operationDuration->observe($duration, ['operation' => $span->getAttribute('operation')]);

} catch (Exception $e) {
    $span->setAttribute('error', true);
    $span->setAttribute('error.message', $e->getMessage());
    
    $saleOperations->inc([
        'operation' => $span->getAttribute('operation'),
        'status' => 'error'
    ]);
    
    error_log("Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
} finally {
    $span->end();
}