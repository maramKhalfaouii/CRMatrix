#!/bin/bash
set -e

# Create project structure
mkdir -p src/{Entity,Repository,Controller} public

# Copy previous artifact contents to files
cat > src/Entity/Sale.php << 'EOF'
<?php
namespace App\Entity;

class Sale {
    private int $id;
    private string $customerName;
    private float $amount;
    private string $status;
    private \DateTime $createdAt;

    public function getId(): int { return $this->id; }
    public function getCustomerName(): string { return $this->customerName; }
    public function setCustomerName(string $name): void { $this->customerName = $name; }
    public function getAmount(): float { return $this->amount; }
    public function setAmount(float $amount): void { $this->amount = $amount; }
    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): void { $this->status = $status; }
    public function getCreatedAt(): \DateTime { return $this->createdAt; }
}
EOF

cat > src/Repository/SaleRepository.php << 'EOF'
<?php
namespace App\Repository;

use App\Entity\Sale;
use PDO;

class SaleRepository {
    private PDO $connection;

    public function __construct(PDO $connection) {
        $this->connection = $connection;
    }

    public function findAll(): array {
        $stmt = $this->connection->query('SELECT * FROM sales');
        return $stmt->fetchAll(PDO::FETCH_CLASS, Sale::class);
    }

    public function find(int $id): ?Sale {
        $stmt = $this->connection->prepare('SELECT * FROM sales WHERE id = ?');
        $stmt->execute([$id]);
        $result = $stmt->fetchObject(Sale::class);
        return $result ?: null;
    }

    public function save(Sale $sale): void {
        $stmt = $this->connection->prepare(
            'INSERT INTO sales (customer_name, amount, status, created_at) 
             VALUES (?, ?, ?, NOW())'
        );
        $stmt->execute([
            $sale->getCustomerName(),
            $sale->getAmount(),
            $sale->getStatus()
        ]);
    }
}
EOF

cat > src/Controller/SaleController.php << 'EOF'
<?php
namespace App\Controller;

use App\Entity\Sale;
use App\Repository\SaleRepository;

class SaleController {
    private SaleRepository $repository;

    public function __construct(SaleRepository $repository) {
        $this->repository = $repository;
    }

    public function index(): array {
        return $this->repository->findAll();
    }

    public function show(int $id): ?Sale {
        return $this->repository->find($id);
    }

    public function create(array $data): void {
        $sale = new Sale();
        $sale->setCustomerName($data['customer_name']);
        $sale->setAmount($data['amount']);
        $sale->setStatus('new');
        $this->repository->save($sale);
    }
}
EOF

cat > public/index.php << 'EOF'
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
EOF

# Set up database
cat > init.sql << 'EOF'
CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
EOF
composer install
composer update

echo "Setup completed successfully"
