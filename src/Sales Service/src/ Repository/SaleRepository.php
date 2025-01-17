<?php
namespace App\Repository;

use App\Entity\Sale;
use PDO;

class SaleRepository {
    private $pdo;
    
    public function __construct() {
        $this->pdo = new PDO(
            'mysql:host=db;dbname=sales',
            'root',
            'password',
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS sales (
            id INT AUTO_INCREMENT PRIMARY KEY,
            customer_name VARCHAR(255) NOT NULL,
            amount DECIMAL(10,2) NOT NULL
        )");
    }

    public function save(Sale $sale, bool $flush = true): void {
        $stmt = $this->pdo->prepare(
            "INSERT INTO sales (customer_name, amount) VALUES (:name, :amount)"
        );
        
        $stmt->execute([
            ':name' => $sale->getCustomerName(),
            ':amount' => $sale->getAmount()
        ]);
        
        $sale->setId($this->pdo->lastInsertId());
    }

    public function find(int $id): ?Sale {
        $stmt = $this->pdo->prepare("SELECT * FROM sales WHERE id = :id");
        $stmt->execute([':id' => $id]);
        
        if ($row = $stmt->fetch()) {
            $sale = new Sale();
            $sale->setId($row['id']);
            $sale->setCustomerName($row['customer_name']);
            $sale->setAmount($row['amount']);
            return $sale;
        }
        
        return null;
    }

    public function findAll(): array {
        $stmt = $this->pdo->query("SELECT * FROM sales");
        $sales = [];
        
        while ($row = $stmt->fetch()) {
            $sale = new Sale();
            $sale->setId($row['id']);
            $sale->setCustomerName($row['customer_name']);
            $sale->setAmount($row['amount']);
            $sales[] = $sale;
        }
        
        return $sales;
    }
}