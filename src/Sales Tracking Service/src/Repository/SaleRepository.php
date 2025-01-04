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
